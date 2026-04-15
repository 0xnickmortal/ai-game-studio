// ============================================
// POST /api/chat/stream
// 1:1 translation of claude-code-chat extension.ts
// _sendMessageToClaude + stdout parsing + _processJsonStreamData
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { join } from 'path';
import { registerProcess, removeProcess } from '@/lib/claude/process-registry';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateInvite, isInviteRequired } from '@/lib/invite';

/** Detect which auth path the Claude CLI will use. Purely informational. */
function detectAuthSource(env: Record<string, string>): string {
  if (env.ANTHROPIC_API_KEY) {
    const masked = env.ANTHROPIC_API_KEY.slice(0, 8) + '…' + env.ANTHROPIC_API_KEY.slice(-4);
    return `ANTHROPIC_API_KEY (env) ${masked}`;
  }
  const home = env.HOME || env.USERPROFILE;
  if (home) {
    const credsPath = join(home, '.claude', '.credentials.json');
    if (existsSync(credsPath)) return `OAuth ${credsPath}`;
  }
  return 'NONE — CLI will fail (no ANTHROPIC_API_KEY, no ~/.claude/.credentials.json)';
}

export const dynamic = 'force-dynamic';

// Safe tools that get auto-approved (no UI prompt needed)
// Auto-approve read + write tools; Bash needs manual approval
const SAFE_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'TodoWrite', 'WebSearch', 'WebFetch',
  'AskUserQuestion', 'Task', 'Skill', 'Agent',
  'Write', 'Edit', 'MultiEdit', 'NotebookEdit',
]);

export async function POST(request: NextRequest) {
  // Invite validation
  const inviteToken = request.cookies.get('invite_token')?.value
    || request.headers.get('x-invite-token')
    || null;
  const invite = validateInvite(inviteToken);
  if (isInviteRequired() && !invite) {
    return NextResponse.json({ error: 'Invalid or missing invite token' }, { status: 401 });
  }

  // Rate limiting — keyed by invite label (or IP if no invite)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  const rateKey = invite?.label || ip;
  const limit = checkRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(limit.resetIn / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { message, sessionId: existingSessionId, model } = body as {
    message: string;
    sessionId?: string;
    model?: string;
  };

  const internalId = randomUUID();
  const encoder = new TextEncoder();

  // ── Build env (same as extension.ts) ──
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  // Keep ANTHROPIC_API_KEY if set (fallback when OAuth fails on server deployment)
  // Otherwise CLI uses OAuth from ~/.claude/.credentials.json (local dev)
  if (!env.HOME && env.USERPROFILE) env.HOME = env.USERPROFILE;
  env.FORCE_COLOR = '0';
  env.NO_COLOR = '1';

  // ── Log which auth source is active (helps debug 401 on deploys) ──
  const authSource = detectAuthSource(env);
  console.log(`[Stream] ${internalId.slice(0, 8)} auth: ${authSource}`);

  // ── Build args (exact copy from extension.ts _sendMessageToClaude) ──
  const args: string[] = [
    '--output-format', 'stream-json',
    '--input-format', 'stream-json',
    '--verbose',
    '--permission-prompt-tool', 'stdio',
  ];
  if (model && model !== 'default') {
    args.push('--model', model);
  }
  if (existingSessionId) {
    args.push('--resume', existingSessionId);
  }

  console.log(`[Stream] ${internalId.slice(0, 8)} spawn claude ${args.join(' ')}`);

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        } catch { /* closed */ }
      };

      // ── Spawn (same as extension.ts) ──
      const child: ChildProcess = spawn('claude', args, {
        shell: process.platform === 'win32',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env as NodeJS.ProcessEnv,
        windowsHide: true,
      });

      registerProcess(internalId, child);
      send('session_start', { internalId });

      // ── Send init + user message immediately (same as claude-code-chat) ──
      // CLI processes stdin in order — no need to wait for system.init
      const userMsg = {
        type: 'user',
        session_id: existingSessionId || '',
        message: {
          role: 'user',
          content: [{ type: 'text', text: message }],
        },
        parent_tool_use_id: null,
      };
      child.stdin!.write(JSON.stringify(userMsg) + '\n');
      // stdin stays open for permission responses

      // ── Stdout parsing (exact copy from extension.ts lines 1100-1150) ──
      let rawOutput = '';

      child.stdout!.on('data', (chunk: Buffer) => {
        rawOutput += chunk.toString();
        const lines = rawOutput.split('\n');
        rawOutput = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const jsonData = JSON.parse(line.trim());

            // Handle control_request (permission)
            if (jsonData.type === 'control_request') {
              handleControlRequest(jsonData, child, send);
              continue;
            }

            // Handle control_response — skip
            if (jsonData.type === 'control_response') {
              continue;
            }

            // Handle result — close stdin (exact copy)
            if (jsonData.type === 'result') {
              if (child.stdin && !child.stdin.destroyed) {
                child.stdin.end();
              }
            }

            // Process all JSON data
            processJsonStreamData(jsonData, send);

          } catch {
            // Failed to parse JSON line — skip
          }
        }
      });

      // ── Stderr ──
      let stderr = '';
      child.stderr!.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      // ── Process lifecycle ──
      child.on('close', (code) => {
        console.log(`[Stream] ${internalId.slice(0, 8)} exited code=${code}`);
        if (stderr) {
          console.error(`[Stream] ${internalId.slice(0, 8)} stderr:`, stderr);
        }
        if (code !== 0 && stderr) {
          send('error', stderr.trim());
        }
        send('processExit', { code });
        setTimeout(() => removeProcess(internalId), 60000);
        controller.close();
      });

      child.on('error', (err) => {
        send('error', err.message);
        removeProcess(internalId);
        controller.close();
      });
    },

    cancel() {
      // Keep process alive for reconnection
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// ── _processJsonStreamData (exact translation from extension.ts lines 850-1050) ──

function processJsonStreamData(
  jsonData: any,
  send: (type: string, data: unknown) => void,
) {
  switch (jsonData.type) {

    case 'system':
      if (jsonData.subtype === 'init') {
        send('sessionInfo', {
          sessionId: jsonData.session_id,
          tools: jsonData.tools || [],
          mcpServers: jsonData.mcp_servers || [],
        });
      }
      break;

    case 'assistant':
      if (jsonData.message?.content) {
        for (const content of jsonData.message.content) {
          if (content.type === 'text' && content.text?.trim()) {
            send('output', content.text.trim());
          } else if (content.type === 'thinking' && content.thinking?.trim()) {
            send('thinking', content.thinking.trim());
          } else if (content.type === 'tool_use') {
            send('toolUse', {
              toolInfo: `🔧 Executing: ${content.name}`,
              toolName: content.name,
              rawInput: content.input,
              toolUseId: content.id,
            });
          }
        }
        // Token usage
        if (jsonData.message.usage) {
          send('updateTokens', {
            inputTokens: jsonData.message.usage.input_tokens || 0,
            outputTokens: jsonData.message.usage.output_tokens || 0,
            cacheCreationTokens: jsonData.message.usage.cache_creation_input_tokens || 0,
            cacheReadTokens: jsonData.message.usage.cache_read_input_tokens || 0,
          });
        }
      }
      break;

    case 'user':
      if (jsonData.message?.content) {
        for (const content of jsonData.message.content) {
          if (content.type === 'tool_result') {
            let resultContent = content.content || 'Tool executed successfully';
            if (typeof resultContent === 'object') {
              resultContent = JSON.stringify(resultContent, null, 2);
            }
            send('toolResult', {
              content: resultContent,
              isError: content.is_error || false,
              toolUseId: content.tool_use_id,
            });
          }
        }
      }
      break;

    case 'result':
      if (jsonData.subtype === 'success') {
        send('result', {
          sessionId: jsonData.session_id,
          isError: jsonData.is_error || false,
          result: jsonData.result,
          totalCostUsd: jsonData.total_cost_usd,
          durationMs: jsonData.duration_ms,
          numTurns: jsonData.num_turns,
        });
        send('setProcessing', { isProcessing: false });
      }
      break;
  }
}

// ── _handleControlRequest (exact translation from extension.ts) ──

function handleControlRequest(
  controlRequest: any,
  child: ChildProcess,
  send: (type: string, data: unknown) => void
) {
  const request = controlRequest.request;
  const requestId = controlRequest.request_id;

  // Only handle can_use_tool
  if (request?.subtype !== 'can_use_tool') {
    return;
  }

  const toolName: string = request.tool_name || 'Unknown';
  const input = request.input || {};
  const suggestions = request.permission_suggestions;
  const toolUseId = request.tool_use_id;

  // Auto-approve safe tools
  if (SAFE_TOOLS.has(toolName)) {
    const response = {
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: requestId,
        response: {
          behavior: 'allow',
          updatedInput: input,
          toolUseID: toolUseId,
        },
      },
    };
    child.stdin!.write(JSON.stringify(response) + '\n');
    return;
  }

  // Dangerous tools → forward to client for approval
  send('permissionRequest', {
    id: requestId,
    tool: toolName,
    input,
    suggestions,
    toolUseId,
    status: 'pending',
  });
}
