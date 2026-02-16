# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────
# Shotlin Dashboard — Multi-stage Production Dockerfile
# Optimized for 10GB SSD (npm cache mounts)
# ──────────────────────────────────────────────────────

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args become env vars at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js app
RUN npm run build

# ── Stage 3: Production ──
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root + dumb-init
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S shotlin && \
    adduser -S shotlin -u 1001 -G shotlin

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R shotlin:shotlin /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

USER shotlin
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
