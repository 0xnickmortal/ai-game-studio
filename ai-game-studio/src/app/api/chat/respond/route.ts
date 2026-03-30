// ============================================
// POST /api/chat/respond — Send follow-up messages or permission responses
// to an existing Claude CLI session via stdin
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getProcess } from '@/lib/claude/process-registry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { internalId, action } = body as {
    internalId: string;
    action:
      | { type: 'message'; sessionId: string; text: string }
      | { type: 'permission'; requestId: string; allow: boolean; input?: Record<string, unknown>; suggestions?: unknown[]; toolUseId?: string };
  };

  if (!internalId || !action) {
    return NextResponse.json({ error: 'Missing internalId or action' }, { status: 400 });
  }

  const child = getProcess(internalId);
  console.log(`[Respond] internalId=${internalId.slice(0, 8)} process=${child ? 'found' : 'NOT FOUND'}`);
  if (!child) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const stdin = child.stdin;
  console.log(`[Respond] stdin=${stdin ? 'exists' : 'null'} destroyed=${stdin?.destroyed}`);
  if (!stdin || stdin.destroyed) {
    return NextResponse.json({ error: 'stdin closed' }, { status: 400 });
  }

  try {
    if (action.type === 'message') {
      // Send user message
      const msg = {
        type: 'user',
        session_id: action.sessionId,
        message: {
          role: 'user',
          content: [{ type: 'text', text: action.text }],
        },
        parent_tool_use_id: null,
      };
      stdin.write(JSON.stringify(msg) + '\n');
      return NextResponse.json({ ok: true });
    }

    if (action.type === 'permission') {
      // Send permission response (must include toolUseID — exact format from claude-code-chat)
      const response = action.allow
        ? {
            behavior: 'allow',
            updatedInput: action.input || {},
            updatedPermissions: action.suggestions || undefined,
            toolUseID: action.toolUseId,
          }
        : {
            behavior: 'deny',
            message: 'User denied permission',
            interrupt: true,
            toolUseID: action.toolUseId,
          };

      const msg = {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: action.requestId,
          response,
        },
      };
      const json = JSON.stringify(msg);
      console.log(`[Respond] Writing permission response: ${json.slice(0, 200)}`);
      stdin.write(json + '\n');
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
  } catch (err) {
    console.error(`[Respond] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
