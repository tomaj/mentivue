# Mentivue - Tech Stack Optimization

Pôvodné rozhodnutie bolo Next.js 15. Toto je revízia z pohľadu **minimal resources + speed**.

---

## TL;DR - Odporúčaný stack

| Komponent | Stack | Hosting | Mesačná cena |
|---|---|---|---|
| **Marketing site** (mentivue.sk) | **Astro 5** static + islands | **Cloudflare Pages** | **€0** |
| **App** (app.mentivue.sk) | **Hono + HTMX** (Bun runtime) | **Hetzner CX22** | **€5** |
| **Workers** (cron, agents, ETL) | **Bun + BullMQ** | **Hetzner CX22 (same VM)** | shared |
| **Database** | **PostgreSQL 16** + pgvector | **Hetzner same VM** alebo Neon | **€0-19** |
| **Storage** (PDFs) | **Cloudflare R2** | Pay-as-you-go | **~€1/mes** |
| **CDN + DNS** | **Cloudflare** | Free tier | **€0** |

**Total mesačné náklady: €6-25** v Year 1.

Pre porovnanie:
- Next.js na Vercel s rovnakými features: **€40-80/mes** (Pro plan)
- Next.js na Hetzner s SSR: musíš CX32 (€12) lebo Next žerie RAM
- Same featureset, **3-15× lacnejšie**

---

## Prečo NIE Next.js 15

Next.js je úžasný framework. Ale pre **B2B research firm s 500 visitors/deň + 50 aktívnych klientov** je to ako kúpiť Boeing 747 na ranné rohlíky.

### Reálne problémy s Next.js

**1. RAM hunger**
- App Router SSR: 180-250 MB idle, 400-600 MB pri 100 rpm
- Toto znamená Hetzner CX22 (2 GB RAM) ledva stačí
- Pri pridaní worker procesov potrebuješ CX32 (€12)

**2. Build time complexity**
- TypeScript build celého app = 60-120s
- Cold deploy na production = 3-5 minút
- Pre side projekt kde commitujeme často = friction

**3. Vendor lock-in cez Vercel**
- Najlepšie hosting na Verceli (lebo postavili to)
- Iné hostingy (Cloudflare, Netlify) majú edge cases
- Self-hosted = stratíš veľa benefitov (ISR, Edge functions)

**4. Overengineering pre statický content**
- Mentivue homepage sa mení raz za týždeň
- Brand cards (15) sa updatujú denne ale **z databázy, nie z kódu**
- Pricing page sa nemení nikdy
- **99% obsahu je STATICKÝ alebo CDN-cacheable**

### Kedy by Next.js bol správny

Ak by Mentivue malo:
- ✅ Real-time multiplayer features
- ✅ Heavy interactive UI (Figma-like)
- ✅ Server Actions critical workflow
- ✅ Streaming SSR pre AI chat
- ✅ 100k+ MAU users

**Mentivue NIČ z toho nemá.** Klient dashboard je tabuľky a grafy ktoré sa môžu plne renderovať raz pri load.

---

## Vyhrávajúci stack - rozobratý

### Layer 1: Marketing site → Astro 5

**Prečo Astro:**

```
Astro vs Next.js pre statický B2B web:
                          Astro       Next.js
JS shipped to browser:    0-5 KB      80-200 KB
Build time (40 stránok):  15s         90s
RAM na server:            0 (CDN)     180-250 MB
Cold start:               0 ms        200-400 ms
Lighthouse score:         98-100      85-95
SEO crawlability:         100%        95% (JS-heavy)
```

**Astro vyhráva v všetkých metrikách pre toto použitie.**

**Stránky ktoré budú Astro:**
- Homepage `/`
- `/pricing`, `/audit`, `/report`, `/methodology`, `/about`
- `/legal/*`
- `/blog/*` (markdown content)
- `/brand/[slug]` (15 SEO landings, generated at build time)
- `/[country]/...` (CZ expansion)

**Features:**
- "Islands architecture" - statické stránky + interaktívne komponenty iba kde treba
- Live Mentivue Index widget = single React island (zvyšok je 0 JS)
- Markdown content collections pre blog
- Type-safe content (TypeScript)
- Vstavané image optimization
- Žiadny server potrebný

**Hosting:** **Cloudflare Pages**
- Free tier: 500 builds/mes, unlimited bandwidth
- Globálna CDN (cca 300 edge locations)
- Built-in SSL, DDoS protection
- Custom domain free
- **€0/mes pre Mentivue traffic**

### Layer 2: App (klient dashboard) → Hono + HTMX

**Najradikálnejší výber. Idem to vysvetliť.**

App layer (`app.mentivue.sk`) je authenticated, dynamický, ale **NIE komplexný**:
- Klient vidí svoj dashboard (4-6 metrík + graf)
- Klient vidí list reportov (10-50 items)
- Klient klikne download → PDF
- Klient si zmení settings (5 fields)

**Toto je CRUD app s ~10 obrazovkami.** Nie Figma.

**Hono + HTMX prístup:**

```
Hono (Bun-based webserver):
- 30-50 MB RAM (proti Next.js 180-250 MB)
- Sub-millisecond response times
- Type-safe (TypeScript native)
- Tailwind + shadcn vie použiť cez server-rendered HTML

HTMX:
- 14 KB JavaScript (proti React/Next ~80-200 KB)
- Žiadny build step pre frontend
- Interaktivita cez HTML attributes (hx-get, hx-post)
- Server-rendered HTML → progressive enhancement
- Žiadny client-side state management
```

**Aký kód to vyzerá:**

```tsx
// Server route (Bun + Hono)
app.get('/app/dashboard', async (c) => {
  const klient = await getKlient(c.req.user);
  const metrics = await getMetrics(klient.brandId);
  
  return c.html(
    <Layout user={klient}>
      <Dashboard metrics={metrics} />
    </Layout>
  );
});

// Dashboard component (JSX rendered on server)
function Dashboard({ metrics }) {
  return (
    <div>
      <MetricCard label="MENTIVUE INDEX" value={metrics.index} />
      <Chart 
        hx-get="/app/charts/sov"
        hx-trigger="load"
        hx-swap="innerHTML"
      />
    </div>
  );
}
```

**Žiadny React, žiadny build, žiadny hydration.** Klient request → server vráti HTML → browser parsuje. HTMX riadi interaktivity (modal open, table refresh, chart load).

**Pre charty:** Pri dashboard load, server pošle SVG charts priamo (Recharts server-side render alebo D3 SVG). Žiadny JS chart library na client.

**Kompromis:** Žiadne sophisticated UX ako drag-drop alebo real-time collab. **Toto však Mentivue nepotrebuje.**

### Layer 3: Workers → Bun + BullMQ

**Toto zostáva ako pôvodný plán:**

```typescript
// Bun runtime
import { Worker, Queue } from 'bullmq';
import { db } from './db';
import { runDailyCollection } from './agents/collector';

const queue = new Queue('mentivue-jobs', {
  connection: { host: 'localhost', port: 6379 }
});

new Worker('mentivue-jobs', async (job) => {
  if (job.name === 'daily-collection') {
    await runDailyCollection();
  }
  // ... ostatné agenti
}, { connection: { host: 'localhost', port: 6379 } });

// Cron schedule
await queue.add('daily-collection', {}, { repeat: { pattern: '0 2 * * *' } });
```

Bun runtime je **3-4× rýchlejší** než Node.js pre tieto workloads. RAM použitie je nižšie. To je rovnaký Hetzner VM ako app server, len iný proces.

---

## Hosting topology - jeden VM, tri procesy

Hetzner CX22 (2 GB RAM, 2 CPU, €5/mes) bezproblémovo zvládne:

```
┌─────────────────────────────────────────────┐
│  HETZNER CX22 — Ubuntu 24.04 (€5/mes)       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  PostgreSQL 16 + pgvector           │   │
│  │  RAM: 200-400 MB                    │   │
│  │  Disk: 5-10 GB Y1                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Redis 7 (BullMQ queue + cache)     │   │
│  │  RAM: 50-100 MB                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Hono App Server (Bun)              │   │
│  │  Port: 3000                         │   │
│  │  RAM: 50-100 MB                     │   │
│  │  app.mentivue.sk endpoint           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Worker Pool (Bun + BullMQ)         │   │
│  │  RAM: 100-300 MB (during heavy LLM) │   │
│  │  Daily collection, analysis, reports│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Caddy reverse proxy                │   │
│  │  Auto SSL via Let's Encrypt         │   │
│  │  RAM: 20 MB                         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  TOTAL RAM USE: ~450-900 MB / 2048 MB     │
│  Plenty of headroom for Year 1            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  CLOUDFLARE PAGES (FREE)                    │
│                                             │
│  mentivue.sk → Astro static site            │
│  - 0 RAM, 0 CPU (pure CDN)                  │
│  - Global edge, <50ms TTFB worldwide        │
│  - Free SSL, DDoS protection                │
│  - Free bandwidth                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  CLOUDFLARE R2 (€0-2/mes)                   │
│                                             │
│  PDF storage (audit reports)                │
│  - €0.015 per GB (vs S3 €0.023)             │
│  - €0 egress (vs S3 €0.09/GB) — kritické    │
└─────────────────────────────────────────────┘
```

---

## Year 1 cost breakdown

| Položka | Mesačne | Ročne |
|---|---|---|
| Hetzner CX22 (app + workers + DB + Redis) | €5 | €60 |
| Cloudflare Pages (marketing site) | €0 | €0 |
| Cloudflare R2 (PDF storage ~50 GB) | €1 | €12 |
| Cloudflare DNS + CDN | €0 | €0 |
| Resend (email, 3000 emails/mes) | $20 | $240 (~€220) |
| Stripe (% z transakcií) | variable | variable |
| Anthropic API (Claude) | $200-400 | $2400-4800 |
| OpenAI API | $50-150 | $600-1800 |
| Gemini API | $20-50 | $240-600 |
| Perplexity API | $50-100 | $600-1200 |
| **TOTAL infra + APIs** | **~€340-680** | **~€4100-8200** |
| **TOTAL infra only (bez LLM)** | **~€7-10** | **~€85-120** |

**Pri Y1 revenue €200-300k a infra cost €4-8k = 2-4% margin impact.** Extremely lean.

---

## Pre porovnanie - Next.js cost

Ak by si zostal pri Next.js:

| Položka | Mesačne |
|---|---|
| Vercel Pro (lebo Free má limity) | €20 |
| Vercel bandwidth (peak) | €5-15 |
| Vercel functions/middleware costs | €5-20 |
| Hetzner CX32 (lebo Next.js žerie RAM) | €12 |
| Same APIs etc. | same |
| **TOTAL infra only** | **€42-67/mes** |

Hybrid stack: **€7-10/mes**
Next.js: **€42-67/mes**

**5-9× lacnejšie** s lepšími performance metrikami.

---

## Architectural simplicity wins

### Filesystem layout (production)

```
/opt/mentivue/
├── app/                    # Hono app server (Bun)
│   ├── server.ts
│   ├── routes/
│   ├── components/         # JSX components
│   └── public/
├── workers/                # Bun + BullMQ workers
│   ├── agents/             # 12 AI agents
│   ├── jobs/
│   └── scheduler.ts
├── db/
│   ├── schema.ts           # Drizzle ORM
│   ├── migrations/
│   └── seeds/
├── reports/                # PDF generation (Puppeteer)
│   └── templates/
└── shared/
    ├── llm/                # LLM client wrappers
    ├── types.ts
    └── config.ts

/opt/mentivue-site/         # SEPARATE: Astro marketing site
├── src/
│   ├── pages/
│   ├── components/
│   ├── content/            # Markdown blog posts
│   └── layouts/
└── astro.config.mjs        # Built on dev machine, deployed to Cloudflare Pages
```

### Deploy story

**Marketing site (Astro):**
```bash
git push origin main
# Cloudflare Pages auto-deploys (2-3 minutes)
# Live globally s 0 downtime
```

**App + workers (Hono + Bun):**
```bash
git push origin main
ssh hetzner "cd /opt/mentivue && git pull && bun install && pm2 reload all"
# 10 seconds total
```

**Žiadny Docker. Žiadny Kubernetes. Žiadny GitHub Actions complexity.**

Caddy automaticky riadi SSL. PM2 udržuje processes. Stačí monitoring.

---

## Counter-arguments - prečo by si zostal pri Next.js

Buďme úprimní - existujú dôvody zostať pri Next.js:

**1. Familiarita**
Ty (Tomas) si možno familiarized s Next.js z VENERGI alebo Monivio. Astro a Hono sú nové.

**Counter-counter:** Astro a Hono majú learning curve **dní, nie mesiacov**. Ty si veľmi silný technicky.

**2. Ecosystem**
Next.js má najväčší ekosystém (shadcn, plugins, hosting).

**Counter-counter:** Astro vie použiť React komponenty (vrátane shadcn) pre interaktívne islands. Best of both worlds.

**3. Future flexibility**
"Možno budeme potrebovať real-time features alebo SSR neskôr."

**Counter-counter:** Hono app server JE SSR (server-rendered HTML). Real-time = WebSockets môžeš pridať do Hono (jednoduchšie než do Next.js).

**4. Talent**
"Ak budem hire-ovať developerov, Next.js je častejší."

**Counter-counter:** Pre Y1 (solo + 1 jr analyst), nehrá rolu. Pre Y2+ keď budeš hire developerov, môžeš migrovať alebo nechať stack.

---

## Migration path if you change your mind later

Stack je modulárny:

```
Phase 1 (Year 1): Astro + Hono + Bun
  ↓ (no need to change)

Phase 2 (Year 2, if needed):
  Option A: Stay (works at 100x current load)
  Option B: Marketing site → Next.js if you need ISR + Server Actions
  Option C: App → Next.js if you need React-heavy UX
  
Phase 3 (Year 3, scale):
  Option A: Add Redis cluster, multiple workers
  Option B: Move app to multiple regions (Cloudflare Workers)
  Option C: Stay - solo VM scales to 10,000+ klientov easily for read-heavy workload
```

**Astro stránky sa migrujú na Next.js za 1 deň.** Hono routes sa migrujú za 2-3 dni. Database, agents, prompts ostávajú rovnaké.

**Migration cost je nízka. Lock-in je minimálny.**

---

## Praktické odporúčanie

Tu je čo by som spravil keby som bol ty:

### Týždeň 1
- **Marketing site:** Začni rovno v Astro 5 + Tailwind + island pre Live Index widget
- **App skeleton:** Hono + Bun, jednoduchá auth (Lucia alebo BetterAuth)
- **DB:** PostgreSQL 16 cez Drizzle (rovnaké ako pôvodný plán)
- **Hosting:** Hetzner CX22 + Cloudflare Pages

### Týždeň 2-4
- Pokračuj build agentov a workers per pôvodný plán
- App layer postupne builduj cez Hono routes
- Marketing pages cez claude.ai/design + adapt to Astro

### Decision check po 8 týždňoch
- Ak si pohodlný s Astro/Hono → continue
- Ak nie → migrate marketing-only na Next.js, ostáva Hono+Bun pre app+workers

---

## Concrete first commit

```bash
# Setup monorepo
mkdir mentivue && cd mentivue
git init

# Marketing site
bun create astro@latest site -- --template minimal --typescript strict
cd site
bun add @astrojs/tailwind @astrojs/sitemap @astrojs/react
cd ..

# App + workers (Bun + Hono)
mkdir app && cd app
bun init -y
bun add hono @hono/node-server bullmq ioredis drizzle-orm drizzle-kit pg @types/pg zod
bun add -D @types/bun typescript

# Shared types
mkdir ../shared && cd ../shared
bun init -y

# Database setup (Docker for local dev)
cd ..
cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: mentivue
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: mentivue
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

volumes:
  postgres_data:
  redis_data:
EOF

docker compose up -d
echo "Stack ready. Total RAM use: <100 MB."
```

---

## Bottom line

| Aspect | Next.js | Recommended (Astro + Hono + Bun) |
|---|---|---|
| **Marketing site RAM** | 180-250 MB | 0 MB (CDN) |
| **App RAM** | 180-250 MB | 50-100 MB |
| **Mesačné náklady infra** | €40-80 | €7-10 |
| **Cold start** | 200-400ms | 50ms (Hono) / 0ms (Astro) |
| **JS shipped to browser** | 80-200 KB | 0-14 KB |
| **Lighthouse score** | 85-95 | 98-100 |
| **Build complexity** | High (TS + JSX + RSC) | Low (Astro: static, Hono: simple) |
| **Vendor lock-in** | Vercel preferred | None |
| **Migration cost (if needed)** | N/A | Low (~1-3 days) |

**Recommendation: Hybrid stack pre 90% prípadov víťazí. Next.js si nechaj na potom keď budeš mať konkrétny dôvod (sophisticated app UX, multiplayer features).**
