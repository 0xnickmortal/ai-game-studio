// ============================================
// Invite token validation
// Tokens configured via INVITE_TOKENS env var (comma-separated)
// Format: token:label,token:label
// Example: abc123:investor-alice,xyz789:partner-bob
// ============================================

interface InviteInfo {
  token: string;
  label: string;
}

function parseInvites(): InviteInfo[] {
  const raw = process.env.INVITE_TOKENS || '';
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [token, label] = s.split(':');
      return { token: token.trim(), label: (label || token).trim() };
    });
}

export function validateInvite(token: string | null | undefined): InviteInfo | null {
  if (!token) return null;
  const invites = parseInvites();
  // Empty list = open access (dev/demo mode)
  if (invites.length === 0) return { token: 'public', label: 'public' };
  return invites.find((i) => i.token === token) || null;
}

export function isInviteRequired(): boolean {
  return parseInvites().length > 0;
}
