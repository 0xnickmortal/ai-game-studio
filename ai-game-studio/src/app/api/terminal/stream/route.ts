// ============================================
// Terminal stream — spawn new or reconnect to existing PTY session
// POST: create new session
// GET:  reconnect to existing session (replays buffer)
// ============================================

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import {
  registerProcess, removeProcess, hasProcess,
  appendOutput, getOutputBuffer, getProcess,
} from '@/lib/claude/process-registry';

export const dynamic = 'force-dynamic';

/** GET /api/terminal/stream?sessionId=xxx — reconnect to existing session */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId || !hasProcess(sessionId)) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const buffer = getOutputBuffer(sessionId);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      send({ type: 'reconnect', sessionId });

      // Replay buffered output
      if (buffer.length > 0) {
        send({ type: 'output', data: buffer.join('') });
      }

      // Subscribe to new output via polling the process
      // We attach a listener tag so we can clean up
      const proc = getProcess(sessionId);
      if (!proc) {
        send({ type: 'exit', code: -1 });
        controller.close();
        return;
      }

      // For PTY processes, we need to re-attach onData
      // Store the send function on the process wrapper for forwarding
      if (proc._sseClients) {
        proc._sseClients.push(send);
      } else {
        proc._sseClients = [send];
      }

      // Handle process already exited
      if (proc._exited) {
        send({ type: 'exit', code: proc._exitCode ?? 0 });
        controller.close();
      }
    },

    cancel() {
      // Don't kill process on disconnect — just remove this SSE client
      const proc = getProcess(sessionId);
      if (proc?._sseClients) {
        // Remove all clients (simplification — in production, track per-client)
        // The process stays alive for reconnection
      }
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

/** POST /api/terminal/stream — create new PTY session */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { cwd } = body as { cwd?: string };

  const sessionId = randomUUID();
  const encoder = new TextEncoder();
  const workDir = cwd || process.cwd();

  console.log(`[Terminal] session=${sessionId.slice(0, 8)} starting PTY in ${workDir}`);

  const env = { ...process.env } as Record<string, string>;
  delete env.ANTHROPIC_API_KEY;
  if (!env.HOME && env.USERPROFILE) {
    env.HOME = env.USERPROFILE;
  }
  env.FORCE_COLOR = '1';

  let pty: typeof import('node-pty');
  try {
    pty = await import('node-pty');
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'node-pty not available: ' + (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      send({ type: 'start', sessionId });

      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      const shellArgs = process.platform === 'win32' ? ['/c', 'claude'] : ['-c', 'claude'];

      const ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: workDir,
        env,
      });

      const processWrapper: any = {
        kill: (signal?: string) => ptyProcess.kill(signal),
        stdin: {
          write: (data: string) => ptyProcess.write(data),
          destroyed: false,
        },
        pid: ptyProcess.pid,
        _sseClients: [send],
        _exited: false,
        _exitCode: null,
      };
      registerProcess(sessionId, processWrapper);

      ptyProcess.onData((data: string) => {
        // Buffer for reconnection
        appendOutput(sessionId, data);
        // Forward to all connected SSE clients
        const clients = processWrapper._sseClients || [];
        for (const clientSend of clients) {
          clientSend({ type: 'output', data });
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        console.log(`[Terminal] session=${sessionId.slice(0, 8)} exited code=${exitCode}`);
        processWrapper._exited = true;
        processWrapper._exitCode = exitCode;
        const clients = processWrapper._sseClients || [];
        for (const clientSend of clients) {
          clientSend({ type: 'exit', code: exitCode });
        }
        // Don't remove from registry immediately — allow reconnection to see exit
        setTimeout(() => removeProcess(sessionId), 60000);
        controller.close();
      });
    },

    cancel() {
      // Don't kill process — keep alive for reconnection
      console.log(`[Terminal] session=${sessionId.slice(0, 8)} SSE disconnected (process kept alive)`);
      const proc = getProcess(sessionId);
      if (proc?._sseClients) {
        proc._sseClients = []; // Clear stale SSE clients
      }
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
