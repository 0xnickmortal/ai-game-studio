// ============================================
// Process Registry — uses globalThis to survive Next.js HMR reloads
// ============================================

import { ChildProcess } from 'child_process';

interface ProcessEntry {
  process: ChildProcess | any;
  createdAt: number;
  outputBuffer: string[];
  maxBufferLines: number;
}

const MAX_AGE_MS = 30 * 60 * 1000;
const DEFAULT_BUFFER_LINES = 500;

// Use globalThis so the Map survives Next.js dev mode HMR reloads
const g = globalThis as unknown as { __processRegistry?: Map<string, ProcessEntry> };
if (!g.__processRegistry) {
  g.__processRegistry = new Map();
}
const registry = g.__processRegistry;

function sweep() {
  const now = Date.now();
  for (const [id, entry] of registry) {
    if (now - entry.createdAt > MAX_AGE_MS) {
      try { entry.process.kill(); } catch { /* already dead */ }
      registry.delete(id);
    }
  }
}

export function registerProcess(sessionId: string, process: ChildProcess | any) {
  sweep();
  registry.set(sessionId, {
    process,
    createdAt: Date.now(),
    outputBuffer: [],
    maxBufferLines: DEFAULT_BUFFER_LINES,
  });
  console.log(`[Registry] registered ${sessionId.slice(0, 8)}, total=${registry.size}`);
}

export function getProcess(sessionId: string): ChildProcess | any | null {
  const entry = registry.get(sessionId);
  console.log(`[Registry] get ${sessionId.slice(0, 8)} → ${entry ? 'found' : 'NOT FOUND'}, total=${registry.size}`);
  return entry?.process ?? null;
}

export function removeProcess(sessionId: string) {
  const entry = registry.get(sessionId);
  if (entry) {
    try { entry.process.kill(); } catch { /* already dead */ }
    registry.delete(sessionId);
    console.log(`[Registry] removed ${sessionId.slice(0, 8)}, total=${registry.size}`);
  }
}

export function hasProcess(sessionId: string): boolean {
  return registry.has(sessionId);
}

export function appendOutput(sessionId: string, data: string) {
  const entry = registry.get(sessionId);
  if (!entry) return;
  entry.outputBuffer.push(data);
  if (entry.outputBuffer.length > entry.maxBufferLines) {
    entry.outputBuffer.splice(0, entry.outputBuffer.length - entry.maxBufferLines);
  }
}

export function getOutputBuffer(sessionId: string): string[] {
  return registry.get(sessionId)?.outputBuffer ?? [];
}

export function listSessions(): string[] {
  return Array.from(registry.keys());
}
