# Mentivue - Project Navigation for Claude Code

## What this project is

B2B research firm measuring AI search visibility for Slovak e-commerce brands.
Sells PDF reports (€2 990 Audit, €299 Industry) and subscriptions (€490-4 990/mes).

## Read these first

Before any task, read relevant docs in `docs/`:
- `PRD.md` - product strategy, decisions, scope
- `METRICS.md` - per-metric formulas and SQL
- `ANALYSIS.md` - data pipeline architecture
- `AUTOMATION.md` - 12 AI agents specifications
- `VALIDATION.md` - quality control methods (M1-M22)
- `READINESS_AUDIT.md` - what's ready, what's missing
- `MONOREPO.md` - this folder structure rationale

## Where things live

### Adding a new metric
1. Schema → `packages/shared/src/db/schema.ts`
2. Migration → `pnpm db:generate`
3. Query → `packages/shared/src/db/queries.ts`
4. Agent logic → `packages/workers/src/agents/`
5. Display → `packages/app/src/components/` or `packages/site/src/components/`

### Adding a new vertical (e.g. banking)
1. Prompts → `prompts/sk-banking.yaml`
2. Seed → `packages/shared/src/db/seed.ts` (extend)
3. Update queries to filter by `vertical_id`
4. Add brand cards → `packages/site/src/pages/brand/[slug].astro`

### Adding a new agent
1. Definition → `packages/workers/src/agents/[name].ts`
2. Register in worker → `packages/workers/src/index.ts`
3. Schedule cron → BullMQ repeat option

## Tech stack rules

- **TypeScript only.** No JavaScript files.
- **Bun runtime** for app and workers. Not Node.js.
- **pnpm workspaces** for monorepo. Not Turborepo (yet).
- **Drizzle ORM** for all DB access. No raw SQL except in queries.ts.
- **Zod** for all input validation.
- **Astro** for marketing site. Islands only when needed.
- **Hono server-rendered** for app. JSX rendered on server.
- **HTMX** for app interactivity. No client-side state management.
- **Biome** for lint + format. Not ESLint+Prettier.

## Import patterns

### From shared package
```typescript
import { db, brands } from '@mentivue/shared/db';
import { env } from '@mentivue/shared/config';
import { callClaude } from '@mentivue/shared/llm';
import { formatNumber } from '@mentivue/shared/utils';
import type { Tier } from '@mentivue/shared/types';
```

### Within same package
Use relative imports:
```typescript
import { someHelper } from './lib/helper.ts';
```

## Code patterns

### LLM calls
Always use shared clients:
```typescript
import { callClaude } from '@mentivue/shared/llm';
const result = await callClaude({ 
  prompt: 'Analyze this...',
  model: 'claude-haiku-4-5-20251001' 
});
```

### DB queries
Always use Drizzle:
```typescript
import { db, brands } from '@mentivue/shared/db';
import { eq } from 'drizzle-orm';

const brand = await db.select().from(brands).where(eq(brands.slug, slug));
```

### Slovak number formatting
Always use helper:
```typescript
import { formatNumber } from '@mentivue/shared/utils';
formatNumber(1176); // "1 176" (SK with non-breaking space)
```

### Env access
Never `process.env.X` directly. Always:
```typescript
import { env } from '@mentivue/shared/config';
const apiKey = env.ANTHROPIC_API_KEY;
```

## Don'ts

- ❌ No client-side React in app (server-render with HTMX)
- ❌ No Next.js (we use Hono + Bun for app, Astro for site)
- ❌ No raw SQL outside `packages/shared/src/db/queries.ts`
- ❌ No env vars accessed directly (use `@mentivue/shared/config`)
- ❌ No new dependencies without checking with Tomas first
- ❌ No `any` types (use `unknown` if truly unknown)
- ❌ No JavaScript files (TypeScript only)
- ❌ No `--legacy-peer-deps` or workarounds (fix root causes)

## Brand voice (for any user-facing copy)

- Slovak primary language for marketing site (target = SK CMOs)
- Vykanie (vy/váš), never tykanie (ty/tvoj) - B2B respect
- Editorial autorita - like Trend, SME Tech, FT
- No startup-speak ("revolučný", "nakopnite", "boost")
- No literal EN translations ("share of voice" stays EN, "sentiment" stays EN)
- Numbers in SK format: 1 176 (not 1,176)

## When unsure - ask Tomas first

Before:
- Adding new dependencies
- Major refactoring
- Changing public APIs
- Modifying pricing or product copy
- Schema changes that require data migration
- Adding new vertical or geographic market

## Current focus

Week 1-4 build per `AUTOMATION.md` priorities:
1. Foundation (DB, hosting, billing infra)
2. Report Writer + Pulse Writer agents
3. Anomaly Watcher
4. Klient Onboarding flow
5. Sales agents + quality patterns
6. Tomas Command Center dashboard

Read `PHASED_GTM.md` for full launch timeline.

## Build/test commands

```bash
pnpm dev              # All services in parallel
pnpm dev:site         # Just marketing site
pnpm dev:app          # Just app server
pnpm dev:workers      # Just workers

pnpm typecheck        # TypeScript check across all packages
pnpm lint             # Biome lint check
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format all files

pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio (DB browser)
pnpm db:seed          # Seed initial data

pnpm docker:up        # Start local Postgres + Redis
pnpm docker:down      # Stop containers
```
