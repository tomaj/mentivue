# Mentivue - Monorepo Architecture

Konkrétna štruktúra ktorá:
- Drží Claude Code v plnom kontexte
- Žiadny build orchestration overhead
- Path k Turborepo v Y2 ak bude treba
- Optimized pre solo developer s AI assistant

---

## High-level layout

```
mentivue/                              ← jeden git repo
│
├── 📚 docs/                           ← PRD, METRICS, ANALYSIS, atď.
│   ├── PRD.md
│   ├── REPORTS.md
│   ├── METRICS.md
│   ├── ANALYSIS.md
│   ├── VALIDATION.md
│   ├── SALES_VALUE.md
│   ├── SUBSCRIPTION.md
│   ├── PHASED_GTM.md
│   ├── AUTOMATION.md
│   ├── READINESS_AUDIT.md
│   ├── STACK_COMPARISON.md
│   └── CLAUDE.md                      ← navigačný dokument pre Claude Code
│
├── 🎨 site/                           ← Astro marketing site
│   ├── src/
│   │   ├── pages/                     ← /, /pricing, /audit, /research, ...
│   │   ├── components/
│   │   ├── content/                   ← markdown blog posts, methodology
│   │   ├── layouts/
│   │   └── styles/
│   ├── public/
│   ├── astro.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── 🖥️  app/                           ← Hono + Bun app server
│   ├── src/
│   │   ├── server.ts                  ← entry point
│   │   ├── routes/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── alerts/
│   │   │   └── settings/
│   │   ├── components/                ← JSX components (server-rendered)
│   │   ├── middleware/
│   │   └── public/                    ← htmx, css, static
│   └── package.json
│
├── ⚙️  workers/                        ← Bun + BullMQ background jobs
│   ├── src/
│   │   ├── index.ts                   ← BullMQ worker entry
│   │   ├── scheduler.ts               ← cron jobs setup
│   │   ├── agents/
│   │   │   ├── collector.ts           ← daily LLM data collection
│   │   │   ├── analyzer.ts            ← extraction + sentiment
│   │   │   ├── reporter.ts            ← report generation
│   │   │   ├── anomaly-watcher.ts
│   │   │   ├── pulse-writer.ts
│   │   │   └── ... (12 agents total)
│   │   └── jobs/                      ← individual job definitions
│   └── package.json
│
├── 🔗 shared/                         ← shared TypeScript code
│   ├── db/
│   │   ├── schema.ts                  ← Drizzle ORM schema
│   │   ├── queries.ts                 ← reusable queries
│   │   ├── migrations/                ← Drizzle migrations
│   │   └── index.ts                   ← export DB client
│   ├── llm/
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── perplexity.ts
│   │   ├── gemini.ts
│   │   └── index.ts                   ← unified LLM client
│   ├── types/
│   │   ├── brand.ts
│   │   ├── metric.ts
│   │   ├── report.ts
│   │   ├── klient.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── format.ts                  ← SK number formatting, etc.
│   │   ├── validation.ts              ← zod schemas
│   │   └── slugify.ts
│   └── config/
│       └── env.ts                     ← typed env vars (zod-validated)
│
├── 📝 prompts/                        ← prompt libraries
│   ├── sk-electronics.yaml            ← 1 176 SK prompts (current)
│   ├── sk-banking.yaml                ← future
│   ├── sk-insurance.yaml              ← future
│   └── analysis-prompts.yaml          ← prompts for extraction/sentiment
│
├── 🛠️  infra/                          ← deployment + dev infrastructure
│   ├── docker-compose.yml             ← local dev (Postgres, Redis)
│   ├── Caddyfile                      ← reverse proxy config
│   ├── deploy.sh                      ← simple deploy script
│   └── pm2.config.js                  ← process manager
│
├── 🧪 tests/                          ← integration tests
│   ├── agents/
│   ├── api/
│   └── fixtures/
│
├── 📦 package.json                    ← root (orchestrátor pre scripts)
├── 🔧 tsconfig.json                   ← root TypeScript config
├── 🔧 bun.lockb                       ← Bun lockfile
├── 🔐 .env                            ← shared env vars
├── 🔐 .env.example                    ← committed template
├── 📄 .gitignore
├── 📄 README.md
└── 📄 CLAUDE.md                       ← Claude Code navigation guide
```

---

## Prečo toto funguje pre Claude Code

### 1. Single context window

Otvor VS Code v root `mentivue/` folderi. Claude Code session:
- Vidí `docs/` a vie celú business logic
- Vidí `shared/db/schema.ts` a vie všetky tabuľky
- Vidí `app/routes/dashboard.tsx` a `workers/agents/reporter.ts` v jednom kontexte
- Vie spraviť cross-cutting change (DB → endpoint → UI) v jednom commite

To je **dramatic productivity unlock**. Pri split repos by Claude Code potreboval 3 sessions paralelne.

### 2. Relative imports namiesto package names

Toto:
```typescript
// app/routes/dashboard.tsx
import { db } from '../../shared/db';
import { getBrandMetrics } from '../../shared/db/queries';
import type { Brand } from '../../shared/types';
```

Funguje **bez akéhokoľvek setupu** - len TypeScript paths.

Naopak Turborepo by chcelo:
```typescript
import { db } from '@mentivue/db';
import { getBrandMetrics } from '@mentivue/db/queries';
import type { Brand } from '@mentivue/types';
```

Čo vyžaduje `package.json` v každom packagei, workspace setup, build steps. Pre Claude Code obojé funguje, ale relative paths sú jednoduchšie debug-ovať keď niečo nesedí.

### 3. CLAUDE.md ako navigation map

Pridáme do root `CLAUDE.md` ktorý funguje ako:
- "Hej Claude, takto je projekt štruktúrovaný"
- "Ak pracuješ na X, choď do Y"
- "Tieto patterns používame konzistentne"

Claude Code prečíta CLAUDE.md pri každom session start a má hneď orientáciu.

---

## Konkrétny package.json v root

```json
{
  "name": "mentivue",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run dev:all",
    "dev:all": "concurrently -n site,app,workers -c blue,green,yellow \"bun run dev:site\" \"bun run dev:app\" \"bun run dev:workers\"",
    "dev:site": "cd site && bun run dev",
    "dev:app": "cd app && bun run dev",
    "dev:workers": "cd workers && bun run dev",
    
    "build": "bun run build:all",
    "build:site": "cd site && bun run build",
    "build:app": "cd app && bun run build",
    "build:workers": "cd workers && bun run build",
    "build:all": "bun run build:site && bun run build:app && bun run build:workers",
    
    "db:generate": "cd shared/db && drizzle-kit generate",
    "db:migrate": "cd shared/db && drizzle-kit migrate",
    "db:studio": "cd shared/db && drizzle-kit studio",
    
    "test": "bun test",
    "lint": "biome check .",
    "format": "biome format . --write",
    
    "deploy:site": "cd site && bun run build && wrangler pages deploy dist",
    "deploy:app": "bash infra/deploy.sh app",
    "deploy:workers": "bash infra/deploy.sh workers"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "concurrently": "^9.0.0",
    "typescript": "^5.6.0",
    "@types/bun": "latest"
  }
}
```

**Kľúčový pattern:**
- `bun run dev` spustí všetky 3 procesy naraz s farebným logging
- `bun run deploy:site` deployuje iba site
- Iba root `package.json` má scripts - sub-folders majú svoje vlastné iba pre internal use

---

## Konkrétny tsconfig.json v root

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["bun-types"],
    
    "baseUrl": ".",
    "paths": {
      "@db/*": ["shared/db/*"],
      "@llm/*": ["shared/llm/*"],
      "@types/*": ["shared/types/*"],
      "@utils/*": ["shared/utils/*"],
      "@config/*": ["shared/config/*"]
    }
  },
  "include": [
    "site/**/*",
    "app/**/*",
    "workers/**/*",
    "shared/**/*",
    "tests/**/*"
  ],
  "exclude": ["node_modules", "**/dist", "**/.astro"]
}
```

**Path aliases** sú voliteľné - ak ti relative imports vyhovujú, môžeš ich vynechať. Path aliases pomáhajú pri refactoringu (presunieš súbor a importy stále fungujú).

---

## CLAUDE.md - navigation guide pre AI

Toto je critical súbor ktorý dramaticky zlepší Claude Code productivity:

```markdown
# Mentivue - Project Navigation for Claude Code

## What this project is

B2B research firm measuring AI search visibility for Slovak e-commerce brands.
Sells PDF reports (€2 990 Audit, €299 Industry) and subscriptions (€490-4 990/mes).

## Read these first

Before any task, read relevant docs:
- `docs/PRD.md` - product strategy, decisions, scope
- `docs/METRICS.md` - per-metric formulas and SQL
- `docs/ANALYSIS.md` - data pipeline architecture
- `docs/AUTOMATION.md` - 12 AI agents specifications

## Where things live

### Adding a new metric
1. Schema change → `shared/db/schema.ts`
2. Migration → `shared/db/migrations/`
3. Query → `shared/db/queries.ts`
4. Agent logic → `workers/agents/`
5. Display → `app/components/` or `site/src/components/`

### Adding a new vertical (e.g. banking)
1. Prompts → `prompts/sk-banking.yaml`
2. Seed data → `shared/db/seeds/banking-sk/`
3. Update queries to filter by `vertical_id`
4. Add brand cards → `site/src/pages/brand/[slug].astro`

### Adding a new agent
1. Definition → `workers/agents/[name].ts`
2. Register in scheduler → `workers/scheduler.ts`
3. Add to dashboard → `app/routes/admin/agents.ts`

## Tech stack rules

- **TypeScript only.** No JavaScript files.
- **Bun runtime** for app and workers. Not Node.js.
- **Drizzle ORM** for all DB access. No raw SQL except in `queries.ts`.
- **Zod** for all input validation.
- **Server-rendered HTML** for app (no React app, JSX rendered server-side).
- **HTMX** for app interactivity. No client-side state management.
- **Astro** for marketing site. Islands only when needed.

## Code patterns

### LLM calls
Always use `shared/llm/` clients, never direct SDK imports.

```typescript
import { callClaude } from '@llm/anthropic';
const response = await callClaude({ prompt, model: 'claude-haiku-4-5' });
```

### DB queries
Always use Drizzle, never raw SQL.

```typescript
import { db } from '@db';
import { brands } from '@db/schema';
import { eq } from 'drizzle-orm';

const brand = await db.select().from(brands).where(eq(brands.slug, slug));
```

### Slovak number formatting
Always use the helper, never hardcode:

```typescript
import { formatNumber } from '@utils/format';
formatNumber(1176) // "1 176" (SK with non-breaking space)
```

## Don'ts

- ❌ No client-side React in app (server-render with HTMX)
- ❌ No Next.js (we use Hono + Bun for app, Astro for site)
- ❌ No raw SQL outside `shared/db/queries.ts`
- ❌ No env vars accessed directly (use `@config/env`)
- ❌ No new dependencies without checking with Tomas first

## Brand voice

Read `docs/BRAND_TOKENS.md` before any UI work.
Read `docs/copy/sk-voice.md` before any copy work.

## When unsure

Ask Tomas before:
- Adding new dependencies
- Major refactoring
- Changing public APIs
- Modifying pricing or product copy
```

Tento súbor je **investícia ktorá vráti 10×**. Claude Code prečíta a hneď chápe kde čo je.

---

## Praktický deploy split

Aj keď monorepo, deploys sú **logicky oddelené**:

```bash
# Marketing site deploy (Cloudflare Pages)
bun run deploy:site
# → builds site/, pushes to Cloudflare Pages
# → mentivue.sk updated v <2 min

# App deploy (Hetzner VM)
bun run deploy:app
# → SSH na Hetzner
# → git pull, bun install, restart Hono process
# → app.mentivue.sk updated v <30 sec

# Workers deploy (Hetzner VM, same server)
bun run deploy:workers
# → SSH na Hetzner
# → git pull, bun install, restart BullMQ workers
# → agents updated v <30 sec
```

**Toto je dôležité:** zmena copy na homepage nepotrebuje touchnúť workers. Drobná zmena agentovi nepotrebuje rebuild site.

Každý deploy je **iba na zložku ktorá sa zmenila** - aj keď to je v rovnakom git repo.

---

## Bude to spomalovať Claude Code?

Krátka odpoveď: **NIE, ak nastavíš správne.**

### Potenciálne risk-y

**Risk 1: Veľký codebase rozdeľuje pozornosť**

Pri 50 000+ riadkov kódu Claude Code môže mať problém nájsť relevant súbor. Riešenie:

- **CLAUDE.md** ako navigation map (vyriešené vyššie)
- **Konzistentná štruktúra** v každej zložke
- **Search-friendly naming** (workers/agents/anomaly-watcher.ts, nie workers/aw.ts)

**Risk 2: Zmena v shared/ ovplyvní viacero apps**

Keď zmeníš `shared/db/schema.ts`, ovplyvní to app + workers + potenciálne site. Claude Code môže byť zmätený "kde to teraz padá".

**Riešenie:** pri schema changes vždy update kompletný TypeScript context. `bun run build` cez celý projekt overí čí nič nezlomí.

**Risk 3: Veľký git diff**

Cross-cutting feature môže byť 20+ files v jednom PR. Code review je ťažší.

**Riešenie:** solo developer = žiadny review problem. Pre Y2+ keď máš team, použiješ atomic commits cez `git add -p`.

### Skutočné benefity

**Speed of cross-cutting changes:** napríklad "pridať novú metriku Sentiment Velocity":

V split repos:
```
1. Otvoriť shared/types repo, pridať type ........... 10 min
2. Publish ako npm package ........................ 15 min
3. Otvoriť db repo, pridať schema ................. 20 min
4. Publish migration ............................ 10 min
5. Otvoriť app repo, pridať komponent ............. 20 min
6. Otvoriť workers repo, pridať analyzer .......... 20 min
7. Koordinovať deploy order ...................... 15 min

TOTAL: ~2 hodiny + context switching
```

V monorepo:
```
1. Schema → query → agent → komponent v jednom session ... 30 min
2. Test lokálne ......................................... 5 min
3. Push, deploy ........................................ 5 min

TOTAL: ~40 min, žiadny context switching
```

**4-5× faster** pre cross-cutting changes. A 80% featur v Mentivue **sú** cross-cutting (metrika → endpoint → UI → report).

---

## Reálna development experience

Tu je tvoj typický deň po setupe:

**Ráno 09:00 (15 min daily ritual):**
```bash
cd ~/projects/mentivue
git pull
bun run dev          # spustí site + app + workers paralelne
```

V VS Code otvoríš root folder. Claude Code session start. Vidí všetko.

**10:00 - feature work:**
Tomas: "Pridaj novú metriku Citation Velocity (rast citácií brand-u v čase)"

Claude Code:
1. Čítá `docs/METRICS.md` aby pochopil pattern
2. Update `shared/db/schema.ts` (pridaj `citation_velocity` field)
3. Generate migration: `cd shared/db && drizzle-kit generate`
4. Update `shared/db/queries.ts` (nová query function)
5. Vytvor `workers/agents/citation-velocity-analyzer.ts`
6. Registruj v `workers/scheduler.ts`
7. Pridaj UI komponent v `app/components/metrics/CitationVelocity.tsx`
8. Mount v `app/routes/dashboard.tsx`

Všetko v jednom session, v jednom rodičovskom kontexte. Claude Code môže navzájom referenciovať súbory bez "open this file" interrupcií.

**Output:** za 20-30 min máš working feature s testami. V split repos by si potreboval 2 hodiny.

---

## Migration path do budúcnosti

Ak za 18 mesiacov budeš mať:
- 3-5 developers
- 80+ source files v workers
- Build times >30s
- 10+ shared packages

... potom môžeš migrate na Turborepo. Proces:

1. `bun add -D turbo`
2. Pridať `turbo.json` config
3. Premenovať folders ak treba (`site/` → `apps/site/`)
4. Update package.json scripts na `turbo run dev`

**Trvanie migrácie: 1-2 dni.** Žiadny code change, iba meta-config.

Inými slovami: **nezostávaš zaseknutý**. Začni jednoducho, migrate keď bude reálna potreba.

---

## Bonus - dev experience tricks

### 1. Concurrently pre dev mode

`bun run dev` spustí všetko naraz s farebným logging:

```
[site]   12:34:01 ▲ Astro
[app]    12:34:02 🦊 Hono server running on http://localhost:3001
[workers] 12:34:02 ⚙️  3 workers initialized
[site]   12:34:03 ◐ astro v5.0.0 ready
[app]    12:34:03 ✓ DB connected
[workers] 12:34:04 ✓ Redis connected
```

### 2. Single .env shared

Jeden `.env` v root pre všetky 3 apps. Žiadne duplikovanie. Type-safe access cez `@config/env`.

### 3. Single node_modules

Bun automaticky deduplikuje dependencies. 200 MB v 1 mieste, namiesto 600 MB cez 3 repos.

### 4. Atomic commits

Cross-cutting feature = 1 commit = jednoduchý revert ak treba.

```bash
git commit -m "feat: add citation velocity metric

- DB: new field citation_velocity in metrics table
- Worker: citation-velocity-analyzer agent (runs daily 03:00)
- API: GET /metrics/citation-velocity endpoint
- UI: CitationVelocity component in Dashboard
- Docs: METRICS.md updated with formula and SQL"
```

---

## Decision recommendation

**Začni s Stratégiou C (jednoduchý monorepo).** Pre tvoj profil je to optimal.

**Konkrétny next step:**

1. Vytvor `mentivue/` folder
2. Setup štruktúru podľa diagramu vyššie
3. Setup root `package.json` a `tsconfig.json`
4. Vytvor `CLAUDE.md` (kopíruj z tohto dokumentu)
5. Init prvý kód v `shared/db/schema.ts` (Drizzle schema)
6. Pre VS Code: otvor root folder
7. Pre Claude Code: prvá session "Read CLAUDE.md and docs/PRD.md, then we'll start with Week 1 task #1"

Trvanie setupu: **2-3 hodiny**. Potom rideing the lightning.

---

## TL;DR pre rozhodnutie

| Otázka | Odpoveď |
|---|---|
| Má monorepo zmysel? | **Áno.** |
| Plný Turborepo monorepo? | **Nie, premature.** |
| Jednoduchý monorepo (Stratégia C)? | **Áno, optimal.** |
| Spomalí to Claude Code? | **Naopak - 4-5× faster pre cross-cutting features.** |
| Funguje Claude Code v ňom? | **Veľmi dobre, najmä s CLAUDE.md navigation file.** |
| Vieš migrovať na Turborepo neskôr? | **Áno, za 1-2 dni v Y2.** |
| Riziko lock-in? | **Minimálne.** |
| Risk že to bude bordel? | **Iba ak nemáš CLAUDE.md a konzistentnú štruktúru.** |
