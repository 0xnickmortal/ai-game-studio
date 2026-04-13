# ============================================
# AI Game Studio — Railway Deployment
# Build context: repo root (not ai-game-studio/)
# Next.js + Claude Code CLI (OAuth from env)
# ============================================

FROM node:20-slim AS base

# Install system deps for node-pty + Claude CLI
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# ── Build stage ──
FROM base AS builder
WORKDIR /app

# Copy package files from ai-game-studio subdirectory
COPY ai-game-studio/package.json ai-game-studio/package-lock.json ./
RUN npm ci

# Copy app source
COPY ai-game-studio/ .

# Next.js standalone build
RUN npm run build

# ── Production stage ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built app (standalone output)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy project files that CLI agents need to read
COPY .claude /workspace/.claude
COPY CLAUDE.md /workspace/CLAUDE.md
COPY docs /workspace/docs
COPY ai-game-studio/design /workspace/design

# Set workspace as CLI working directory
ENV CLAUDE_WORKSPACE=/workspace

# Script to inject OAuth credentials at runtime
COPY ai-game-studio/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create temp dirs for user sessions
RUN mkdir -p /tmp/sessions

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
