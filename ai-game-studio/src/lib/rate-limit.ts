// ============================================
// Simple in-memory rate limiter for demo
// Limits requests per IP per hour
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const g = globalThis as unknown as { __rateLimitMap?: Map<string, RateLimitEntry> };
if (!g.__rateLimitMap) {
  g.__rateLimitMap = new Map();
}
const store = g.__rateLimitMap;

const MAX_REQUESTS_PER_HOUR = 30; // Generous for demo
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Clean expired entries
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }

  let entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
  }

  entry.count++;
  const allowed = entry.count <= MAX_REQUESTS_PER_HOUR;
  const remaining = Math.max(0, MAX_REQUESTS_PER_HOUR - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  return { allowed, remaining, resetIn };
}
