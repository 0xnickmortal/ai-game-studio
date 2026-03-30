// ============================================
// Chat message types — flat messages (1 event = 1 message)
// Matches claude-code-chat's webview message model
// ============================================

/** Every SSE event becomes one ChatMsg in the list */
export type ChatMsg =
  | { type: 'user'; text: string; ts: number }
  | { type: 'output'; text: string; ts: number }
  | { type: 'thinking'; text: string; ts: number }
  | { type: 'toolUse'; toolName: string; toolInfo: string; rawInput: Record<string, unknown>; ts: number }
  | { type: 'toolResult'; content: string; isError: boolean; toolUseId?: string; hidden?: boolean; ts: number }
  | { type: 'permissionRequest'; id: string; tool: string; input: Record<string, unknown>; suggestions?: unknown[]; toolUseId?: string; status: 'pending' | 'approved' | 'denied'; ts: number }
  | { type: 'error'; text: string; ts: number }
  | { type: 'system'; text: string; ts: number };

/** Colors for each message type (left border gradients) — from claude-code-chat CSS */
export const MSG_COLORS: Record<string, [string, string]> = {
  user:              ['#40a5ff', '#0078d4'],
  output:            ['#2ecc71', '#27ae60'],
  thinking:          ['#ba55d3', '#9932cc'],
  toolUse:           ['#7c8bed', '#5d6fe1'],
  toolResult:        ['#1cc08c', '#16a974'],
  permissionRequest: ['#f39c12', '#e67e22'],
  error:             ['#e74c3c', '#c0392b'],
  system:            ['#94a3b8', '#64748b'],
};
