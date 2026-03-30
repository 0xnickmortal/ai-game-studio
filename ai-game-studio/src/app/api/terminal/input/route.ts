// ============================================
// POST /api/terminal/input - Send keystrokes to Claude CLI stdin
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getProcess } from '@/lib/claude/process-registry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { sessionId, input } = (await request.json()) as {
    sessionId: string;
    input: string;
  };

  if (!sessionId || input === undefined) {
    return NextResponse.json({ error: 'Missing sessionId or input' }, { status: 400 });
  }

  const child = getProcess(sessionId);
  if (!child) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!child.stdin || child.stdin.destroyed) {
    return NextResponse.json({ error: 'stdin closed' }, { status: 400 });
  }

  try {
    child.stdin.write(input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
