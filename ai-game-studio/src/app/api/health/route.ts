// ============================================
// GET /api/health - Check Claude CLI availability and auth
// ============================================

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

/** Build a clean env for Claude CLI (remove invalid API keys, ensure HOME) */
function buildClaudeEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  if (!env.HOME && env.USERPROFILE) {
    env.HOME = env.USERPROFILE;
  }
  return env;
}

export async function GET() {
  const env = buildClaudeEnv();

  // Step 1: Check if CLI is installed
  const version = await spawnResult('claude', ['--version'], env);
  if (!version.ok) {
    return NextResponse.json({
      cliAvailable: false,
      loggedIn: false,
      error: 'Claude CLI not found. Install: npm install -g @anthropic-ai/claude-code',
    });
  }

  // Step 2: Check auth status
  const auth = await spawnResult('claude', ['auth', 'status'], env);
  let loggedIn = false;
  let authMethod = 'none';
  try {
    const parsed = JSON.parse(auth.stdout);
    loggedIn = parsed.loggedIn === true;
    authMethod = parsed.authMethod || 'none';
  } catch {
    // Could not parse auth status
  }

  return NextResponse.json({
    cliAvailable: true,
    cliVersion: version.stdout.trim(),
    loggedIn,
    authMethod,
    error: loggedIn ? undefined : 'Claude CLI 未登录。请在终端运行: claude login',
  });
}

function spawnResult(cmd: string, args: string[], env: NodeJS.ProcessEnv): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true, timeout: 5000, env, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('close', (code) => resolve({ ok: code === 0, stdout, stderr }));
    child.on('error', (err) => resolve({ ok: false, stdout: '', stderr: err.message }));
  });
}
