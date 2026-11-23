# Multi-stage Production Dockerfile for OFOS NestJS Backend
# =========================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install build essentials if needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies for Nest CLI and Prisma)
RUN npm ci

# Copy Prisma schema and configuration
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate --config=prisma.config.ts

# Copy NestJS configuration and source code
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Compile production bundle
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Install lightweight init system and curl for healthchecks
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema & generated client from builder
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./

# Copy compiled application code
COPY --from=builder /usr/src/app/dist ./dist

# Switch to non-root node user for container security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
