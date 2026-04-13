#!/bin/bash
# ============================================
# Inject Claude OAuth credentials at runtime
# from Railway environment variables
# ============================================

# Create Claude config directory
mkdir -p ~/.claude

# Write OAuth credentials from env var
if [ -n "$CLAUDE_OAUTH_TOKEN" ]; then
  echo "$CLAUDE_OAUTH_TOKEN" > ~/.claude/.credentials.json
  echo "[entrypoint] Claude OAuth credentials injected"
else
  echo "[entrypoint] WARNING: CLAUDE_OAUTH_TOKEN not set — CLI will not be authenticated"
fi

# Verify Claude CLI is available
claude --version 2>/dev/null && echo "[entrypoint] Claude CLI ready" || echo "[entrypoint] WARNING: Claude CLI not found"

# Start the app
exec "$@"
