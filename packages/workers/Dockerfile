# syntax=docker/dockerfile:1.7
# Mentivue Workers — BullMQ consumers on Bun.
# Multi-stage: install (pnpm) → build (bun) → runtime (slim).

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

# ----------------------------------------------------------------------------
# 1) deps
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/app/package.json packages/app/
COPY packages/workers/package.json packages/workers/
COPY packages/site/package.json packages/site/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @mentivue/workers... --filter @mentivue/shared

# ----------------------------------------------------------------------------
# 2) build
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /repo
COPY --from=deps /repo /repo
COPY packages/shared/ packages/shared/
COPY packages/workers/ packages/workers/

WORKDIR /repo/packages/workers
RUN bun build src/index.ts --target=bun --outdir=dist

# ----------------------------------------------------------------------------
# 3) runtime
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/packages/workers/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/packages/workers/package.json ./

USER bun

# Workers expose no HTTP port — health is "process running + Redis reachable".
# Compose / orchestrator can ping the dependency Redis instead.

CMD ["bun", "run", "dist/index.js"]
