#!/bin/bash
# ============================================
# Inject Claude OAuth credentials at runtime
# from Railway environment variables
# ============================================

set -e

CLAUDE_DIR="${HOME:-/root}/.claude"
CREDS_FILE="$CLAUDE_DIR/.credentials.json"

mkdir -p "$CLAUDE_DIR"

if [ -n "$CLAUDE_OAUTH_TOKEN" ]; then
  # Use printf (no interpretation of escape sequences, no trailing newline unless in data)
  printf '%s' "$CLAUDE_OAUTH_TOKEN" > "$CREDS_FILE"
  chmod 600 "$CREDS_FILE"

  # Validate it's valid JSON
  if node -e "JSON.parse(require('fs').readFileSync('$CREDS_FILE', 'utf8'))" 2>/dev/null; then
    echo "[entrypoint] Credentials written ($(wc -c < "$CREDS_FILE") bytes, valid JSON)"
  else
    echo "[entrypoint] ERROR: CLAUDE_OAUTH_TOKEN is not valid JSON"
    echo "[entrypoint] First 80 chars: $(head -c 80 "$CREDS_FILE")"
    exit 1
  fi
else
  echo "[entrypoint] WARNING: CLAUDE_OAUTH_TOKEN not set — CLI will not be authenticated"
fi

# Verify Claude CLI auth
echo "[entrypoint] Checking Claude CLI auth status..."
claude auth status 2>&1 | head -10 || echo "[entrypoint] auth status check failed"

echo "[entrypoint] Starting app..."
exec "$@"
