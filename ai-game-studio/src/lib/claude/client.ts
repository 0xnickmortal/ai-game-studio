// ============================================
// Claude Code CLI Client - Server-side only
// Uses `claude -p` (print mode) with existing Claude Code auth
// No API key needed!
// ============================================

import { spawn } from 'child_process';
import { AgentDef, ChatMessage, ClaudeModel } from '@/types';
import { getRealSystemPrompt } from '@/lib/agents/parser';

/** Map our model names to Claude CLI model names */
export const MODEL_MAP: Record<ClaudeModel, string> = {
  opus: 'opus',
  sonnet: 'sonnet',
  haiku: 'haiku',
};

/** Build the system prompt for an agent */
export function buildSystemPrompt(agent: AgentDef, projectContext?: string): string {
  // Try to load the real system prompt from the .md agent definition file
  const realPrompt = getRealSystemPrompt(agent.id);

  if (realPrompt) {
    // Use the real prompt from .claude/agents/*.md, with coordination context appended
    const parts = [
      realPrompt,
      ``,
      `## Coordination Context`,
      `- Agent ID: ${agent.id}`,
      `- You report to: ${agent.escalatesTo || 'No one (top-level)'}`,
      `- You delegate to: ${agent.delegatesTo.length > 0 ? agent.delegatesTo.join(', ') : 'No one (specialist)'}`,
      ``,
      `## Response Guidelines`,
      `- Respond in the same language as the user (Chinese if they write in Chinese)`,
      `- Be specific and actionable`,
      `- Keep responses concise but thorough`,
    ];

    if (projectContext) {
      parts.push(``, `## Current Project Context`, projectContext);
    }

    return parts.join('\n');
  }

  // Fallback: construct a basic prompt from agent metadata
  const parts = [
    `# Role: ${agent.name} (${agent.id})`,
    ``,
    `## Domain: ${agent.domain}`,
    `## Description: ${agent.description}`,
    ``,
    `## Instructions`,
    agent.systemPrompt,
    ``,
    `## Coordination Rules`,
    `- You report to: ${agent.escalatesTo || 'No one (top-level)'}`,
    `- You delegate to: ${agent.delegatesTo.length > 0 ? agent.delegatesTo.join(', ') : 'No one (specialist)'}`,
    `- Stay within your domain. If a request falls outside your expertise, recommend the appropriate agent.`,
    ``,
    `## Response Guidelines`,
    `- Respond in the same language as the user (Chinese if they write in Chinese)`,
    `- Be specific and actionable`,
    `- Reference game design best practices`,
    `- Keep responses concise but thorough`,
  ];

  if (projectContext) {
    parts.push(``, `## Current Project Context`, projectContext);
  }

  return parts.join('\n');
}

/** Build a combined prompt from conversation history */
export function buildConversationPrompt(agent: AgentDef, messages: ChatMessage[], projectContext?: string): string {
  const systemPrompt = buildSystemPrompt(agent, projectContext);

  const conversationParts: string[] = [
    systemPrompt,
    '',
    '---',
    '',
    '## Web App Context',
    '你正在 AI Game Studio Web 应用中运行。以下规则覆盖协作协议中的审批流程：',
    '- 直接执行文件读写，无需询问用户"可以写入吗"',
    '- 直接创建/修改设计文档，无需等待逐节审批',
    '- 用户已授予所有文件操作权限',
    '- 仍然需要在回复中说明你做了什么',
    '',
    '## Conversation History',
    '',
  ];

  const previousMessages = messages.slice(0, -1);
  for (const msg of previousMessages) {
    if (msg.role === 'user') {
      conversationParts.push(`**User**: ${msg.content}`, '');
    } else if (msg.role === 'assistant') {
      conversationParts.push(`**${agent.name}**: ${msg.content}`, '');
    }
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    conversationParts.push(`---`, '', `## Current Request`, '', lastMessage.content);
  }

  return conversationParts.join('\n');
}

/** Send a message to a specific agent via Claude Code CLI */
export async function sendAgentMessage(
  agent: AgentDef,
  messages: ChatMessage[],
  projectContext?: string
): Promise<string> {
  const prompt = buildConversationPrompt(agent, messages, projectContext);
  const model = MODEL_MAP[agent.model];

  return new Promise((resolve, reject) => {
    console.log(`[Claude CLI] Spawning claude -p --model ${model} (prompt: ${prompt.length} chars)`);

    const TIMEOUT_MS = 120000;

    // Remove ANTHROPIC_API_KEY (may be invalid placeholder from .env.local)
    // and ensure HOME is set so Claude CLI can find its OAuth credentials
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    if (!env.HOME && env.USERPROFILE) {
      env.HOME = env.USERPROFILE;
    }

    const child = spawn('claude', ['-p', '--model', model, '--output-format', 'text', '--dangerously-skip-permissions'], {
      shell: true,
      env,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Enforce timeout by killing the process
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, TIMEOUT_MS);

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      console.log(`[Claude CLI] Exited code=${code}, stdout=${stdout.length}chars, stderr=${stderr.length}chars`);

      if (timedOut) {
        reject(new Error(`Claude CLI timed out after ${TIMEOUT_MS / 1000}s`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr || stdout || 'Unknown error'}`));
        return;
      }

      const reply = stdout.trim();
      if (!reply) {
        reject(new Error('Empty response from Claude CLI'));
        return;
      }

      resolve(reply);
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    // Write prompt to stdin and close it
    child.stdin.on('error', (err) => {
      console.error('[Claude CLI] stdin error:', err.message);
    });
    child.stdin.end(prompt, 'utf-8');
  });
}
