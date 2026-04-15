#!/bin/bash
# ============================================
# Runtime setup — verify Claude CLI can auth
# Auth source priority (Claude CLI reads these):
#   1. ANTHROPIC_API_KEY env var  (the simple path)
#   2. ~/.claude/.credentials.json  (OAuth, rarely used on server)
# ============================================

set -e

if [ -n "$ANTHROPIC_API_KEY" ]; then
  masked="${ANTHROPIC_API_KEY:0:10}...${ANTHROPIC_API_KEY: -4}"
  echo "[entrypoint] Using ANTHROPIC_API_KEY ($masked)"
elif [ -n "$CLAUDE_OAUTH_TOKEN" ]; then
  # Legacy OAuth injection (kept as fallback — unsupported on Railway due to IP binding)
  CLAUDE_DIR="${HOME:-/root}/.claude"
  CREDS_FILE="$CLAUDE_DIR/.credentials.json"
  mkdir -p "$CLAUDE_DIR"
  printf '%s' "$CLAUDE_OAUTH_TOKEN" > "$CREDS_FILE"
  chmod 600 "$CREDS_FILE"
  if node -e "JSON.parse(require('fs').readFileSync('$CREDS_FILE', 'utf8'))" 2>/dev/null; then
    echo "[entrypoint] Fallback: OAuth credentials injected ($(wc -c < "$CREDS_FILE") bytes)"
  else
    echo "[entrypoint] ERROR: CLAUDE_OAUTH_TOKEN is not valid JSON"
    exit 1
  fi
else
  echo "[entrypoint] WARNING: no ANTHROPIC_API_KEY or CLAUDE_OAUTH_TOKEN set — CLI will fail"
fi

echo "[entrypoint] Starting app..."
exec "$@"
