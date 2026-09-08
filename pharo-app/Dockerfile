# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (Linux engine) and build the standalone output
RUN npx prisma generate && npm run build

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Use a non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copy the full node_modules so the prisma CLI, @prisma/client, bcryptjs,
# and seed scripts all work at runtime
COPY --from=builder /app/node_modules ./node_modules

# Copy standalone server output (contains server.js, .next, package.json)
COPY --from=builder /app/.next/standalone ./
# Copy static assets and public files
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# SQLite lives on a persistent volume
RUN mkdir -p /data && chown -R nextjs:nodejs /data /app

USER nextjs

# Copy the start script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x start.sh

VOLUME ["/data"]
EXPOSE 3000

CMD ["sh", "start.sh"]
