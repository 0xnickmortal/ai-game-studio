// ============================================
// POST /api/chat/permission - Send permission response to CLI stdin
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getProcess } from '@/lib/claude/process-registry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, response } = body as {
    sessionId: string;
    response: 'yes' | 'no';
  };

  if (!sessionId || !response) {
    return NextResponse.json({ error: 'Missing sessionId or response' }, { status: 400 });
  }

  const child = getProcess(sessionId);
  if (!child) {
    return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 });
  }

  if (!child.stdin || child.stdin.destroyed) {
    return NextResponse.json({ error: 'Process stdin is closed' }, { status: 400 });
  }

  try {
    child.stdin.write(response + '\n', 'utf-8');
    console.log(`[Permission] session=${sessionId.slice(0, 8)} response=${response}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Failed to write: ${(err as Error).message}` }, { status: 500 });
  }
}
