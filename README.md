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

## Deploy

### Marketing site (`packages/site`) — static, deploys anywhere

The site is **9 static HTML pages**, ~1 MB total, zero server requirements.

**Recommended: Cloudflare Pages** (free, global CDN, auto-deploys on git push)

1. Sign in to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Connect to Git
2. Select `tomaj/mentivue`, configure build:
   - **Framework preset:** Astro
   - **Build command:** `pnpm --filter @mentivue/site build`
   - **Build output:** `packages/site/dist`
   - **Root directory:** `/` (monorepo root)
   - **Node version env var:** `NODE_VERSION = 22`
3. Add custom domain: `mentivue.sk` (DNS pointed at Cloudflare auto-configures SSL)

Alternative one-shot CLI deploy from local machine:

```bash
pnpm --filter @mentivue/site build
npx wrangler pages deploy packages/site/dist --project-name=mentivue
```

**Other targets** — `dist/` is plain static; works on Vercel, Netlify, GitHub
Pages, S3+CloudFront, any nginx host.

### Password-protect the site (pre-launch staging)

While the brand and content are still being polished, lock the deployment so
only invited people can see it. Two zero-config options on Cloudflare:

**Option A — Cloudflare Access** (recommended, free for up to 50 users, magic-link login):

1. After deploying to Pages, go to **Cloudflare dashboard → Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Application domain: `mentivue.sk` (or `mentivue.pages.dev` for the preview URL).
3. **Identity provider:** add **One-time PIN** (no SSO setup needed — Cloudflare emails a 6-digit code).
4. **Policy:** Action `Allow`, selector `Emails` → list addresses (`tomas@mentivue.sk`, reviewers, etc.) or `Email domain ends with @mentivue.sk`.
5. Save. Visitors get a "Sign in with email" page until you remove the policy.

Cost: **€0** (Self-Hosted plan covers up to 50 users).

**Option B — Basic Auth via a tiny Worker** (faster to set up, single shared password):

```js
// infra/access-worker.js — bind in front of the Pages domain via Workers Routes
export default {
  async fetch(req, env) {
    const auth = req.headers.get('authorization');
    const expected = 'Basic ' + btoa(`${env.USER}:${env.PASS}`);
    if (auth !== expected) {
      return new Response('Auth required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Mentivue staging"' },
      });
    }
    return fetch(req); // pass through to Pages
  },
};
```

Deploy with `wrangler deploy infra/access-worker.js`, set `USER` + `PASS` as
Worker secrets, then add a route `mentivue.sk/*` → this worker. Remove the
route when launching publicly.

### App + workers (`packages/app`, `packages/workers`) — Hetzner CX22

Stub `infra/deploy.sh` is checked in for SSH-based deploys. Wire up once the
production VM is provisioned. See
[`docs/STACK_COMPARISON.md`](./docs/STACK_COMPARISON.md) for full topology.

## SEO + GEO checklist

The site head ships:

- Per-page `<title>`, `<meta description>`, `<link canonical>`
- Open Graph (`og:title`/`description`/`url`/`image` 1200×630 with width/height/alt, `og:type=website|article`, `og:locale=sk_SK`, `og:site_name`)
- Twitter Card (`summary_large_image`, `@mentivue` site + creator)
- Article OG extras on blog posts (`article:published_time`, `article:modified_time`, `article:author`)
- JSON-LD: site-wide `Organization` + `WebSite`, per-article `Article` + `BreadcrumbList`
- Robots: `index,follow,max-image-preview:large,max-snippet:-1`
- Generator hint, theme-color, color-scheme, apple-touch-icon
- Auto sitemap at `/sitemap-index.xml` (excludes internal `/og-card` render page)
- `public/robots.txt` — explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, anthropic-ai (Mentivue's whole thesis is being read by these — we don't block)
- `public/llms.txt` — concise crawl map for AI engines, lists every public page

The OG card lives at `packages/site/src/pages/og-card.astro` (1200×630 branded
template). Regenerate the PNG by booting the dev server and screenshotting that
URL, e.g.:

```bash
pnpm dev:site
# in another terminal, headless:
npx playwright cli screenshot --viewport-size=1200,630 http://localhost:4321/og-card packages/site/public/og-default.png
```

## Status

End-to-end pipeline live: 24 brands × 1 176 prompts × 4 LLMs (Anthropic /
OpenAI / Perplexity / Gemini) → brand_mentions + sentiment + citations →
aggregation queries. BullMQ scheduler wired with auto-chained collection →
analysis workers. 9 marketing pages ported from claude.ai/design, build clean,
SEO/OG/GEO meta in place.

Next: cron registration for daily tier, first paid batch (~$8.60), Astro
homepage live Index widget reading from DB. See
[`docs/PRD.md`](./docs/PRD.md) §9 and
[`docs/AUTOMATION.md`](./docs/AUTOMATION.md) for roadmap.
