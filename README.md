# Mentivue

B2B research firm measuring AI search visibility for Slovak e-commerce brands.

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Setup env
cp .env.example .env
# Fill in API keys + generate AUTH_SECRET:
#   openssl rand -hex 32

# 3. Start Postgres + Redis
pnpm docker:up

# 4. (After schema is added) Generate + apply migrations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run all services in dev mode
pnpm dev
```

Services:

- **Marketing site** (Astro) → http://localhost:4321
- **App server** (Hono + Bun) → http://localhost:3000
- **Workers** (Bun + BullMQ) → background

## Repo layout

```
mentivue/
├── docs/                 Strategy documents (PRD, METRICS, ANALYSIS, …)
├── brand/                Brand assets (logo, identity book)
├── packages/
│   ├── site/             Astro marketing site (mentivue.sk)
│   ├── app/              Hono + Bun app server (app.mentivue.sk)
│   ├── workers/          Bun + BullMQ background jobs / AI agents
│   └── shared/           Drizzle schema, LLM clients, types, utils, env
├── prompts/              Prompt libraries (sk-electronics.yaml, …)
├── infra/                docker-compose, deploy scripts
├── CLAUDE.md             Navigation guide for Claude Code
└── README.md
```

Read [`CLAUDE.md`](./CLAUDE.md) and [`docs/PRD.md`](./docs/PRD.md) before any task.

## Stack

- **Runtime:** Bun (app + workers)
- **DB:** PostgreSQL 16 + pgvector, Drizzle ORM
- **Queue:** BullMQ + Redis
- **Marketing site:** Astro 5 + Tailwind, deployed to Cloudflare Pages
- **App:** Hono (server-rendered JSX) + HTMX
- **Lint/format:** Biome
- **Workspace:** pnpm

See [`docs/STACK_COMPARISON.md`](./docs/STACK_COMPARISON.md) for stack rationale.

## Status

Skeleton scaffolded. Week 1 build kicks off with DB schema + first LLM client +
seed data — see [`docs/PRD.md`](./docs/PRD.md) §9 and
[`docs/AUTOMATION.md`](./docs/AUTOMATION.md) for the implementation roadmap.
