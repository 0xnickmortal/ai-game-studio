# ============================================
# AI Game Studio — Railway Deployment
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

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Next.js standalone build (smaller output)
RUN npm run build

# ── Production stage ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

# Copy project files that agents need to read
COPY --from=builder /app/../.claude ./.claude-project/.claude
COPY --from=builder /app/../CLAUDE.md ./.claude-project/CLAUDE.md
COPY --from=builder /app/../docs ./.claude-project/docs 2>/dev/null || true
COPY --from=builder /app/../design ./.claude-project/design 2>/dev/null || true

# Script to inject OAuth credentials at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create temp dirs for user sessions
RUN mkdir -p /tmp/sessions

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
