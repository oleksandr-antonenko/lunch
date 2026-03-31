FROM node:24-slim AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/api/node_modules apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist dist
COPY --from=builder /app/apps/api/node_modules node_modules
COPY --from=builder /app/apps/api/prisma prisma
COPY --from=builder /app/apps/api/package.json .
EXPOSE 3001
CMD ["node", "dist/main.js"]
