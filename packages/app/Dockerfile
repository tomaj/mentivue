# syntax=docker/dockerfile:1.7
# Mentivue App — Hono on Bun.
# Multi-stage: install (pnpm) → build (bun) → runtime (slim).

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

# ----------------------------------------------------------------------------
# 1) deps — install pnpm workspace deps with full lockfile
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# Only the manifests — keep layer cache hot across code-only changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/app/package.json packages/app/
COPY packages/workers/package.json packages/workers/
COPY packages/site/package.json packages/site/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @mentivue/app... --filter @mentivue/shared

# ----------------------------------------------------------------------------
# 2) build — copy source, compile Bun bundle
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /repo
COPY --from=deps /repo /repo
COPY packages/shared/ packages/shared/
COPY packages/app/ packages/app/

WORKDIR /repo/packages/app
RUN bun build src/server.ts --target=bun --outdir=dist

# ----------------------------------------------------------------------------
# 3) runtime — slim image with bundled output + runtime node_modules
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    APP_PORT=3000

# Bring built artefacts + transitive deps that aren't bundled.
COPY --from=build /repo/packages/app/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/packages/app/package.json ./

EXPOSE 3000
USER bun

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+ (process.env.APP_PORT||3000) +'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "dist/server.js"]
