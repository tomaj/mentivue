# Mentivue - Complete File Bundle

Toto je **kompletný balík** pre spustenie Mentivue projektu. Stiahni všetky súbory a postupuj podľa návodu nižšie.

---

## 🚀 Quick Start

```bash
# 1. Stiahni všetky súbory z tohto bundle
# 2. Daj im executable práva
chmod +x setup-monorepo.sh

# 3. Spusti setup script (vytvorí mentivue/ folder)
./setup-monorepo.sh

# 4. Skopíruj všetky .md dokumenty do mentivue/docs/
cp *.md mentivue/docs/

# 5. Skopíruj prompts file
cp prompts-sk.yaml mentivue/prompts/sk-electronics.yaml

# 6. Otvor v VS Code a začni stavať
cd mentivue
code .
```

---

## 📦 Čo obsahuje tento bundle

### 1. Setup automation (NEW)

| Súbor | Účel |
|---|---|
| **`setup-monorepo.sh`** | Bash script ktorý vytvorí celú monorepo štruktúru za 2-3 min |
| **`CLAUDE.md`** | Navigation guide pre Claude Code (skopíruj do root `mentivue/`) |

### 2. Strategy documentation (12 súborov)

Tieto idú do `mentivue/docs/`:

| Súbor | Účel |
|---|---|
| **`PRD.md`** | Master document - product strategy, decisions, scope |
| **`REPORTS.md`** | Product portfolio - 6 typov reportov, customer journeys |
| **`METRICS.md`** | Per-metric deep dive (SoV, Sentiment, Citations, atď.) |
| **`ANALYSIS.md`** | Data pipeline (Step 1-6), SQL queries, materialized views |
| **`VALIDATION.md`** | 22 validation methods (M1-M22), quality control |
| **`SALES_VALUE.md`** | Actionability layer - 12 sekcií ktoré premieňajú report na playbook |
| **`SUBSCRIPTION.md`** | 3-tier subscription model, 5 hodnotových pilierov, retention |
| **`PHASED_GTM.md`** | 4-fázový crescendo (M0-3, M3-6, M6-12, M12+) s decision gates |
| **`AUTOMATION.md`** | 12 AI agentov, Tomas Command Center, self-critic patterns |
| **`READINESS_AUDIT.md`** | Status audit, 5 critical gaps, vertical expansion priority |
| **`STACK_COMPARISON.md`** | Prečo Astro + Hono + Bun namiesto Next.js |
| **`MONOREPO.md`** | Prečo a ako monorepo s pnpm workspaces |

### 3. Data files

| Súbor | Účel |
|---|---|
| **`prompts-sk.yaml`** | 1 176 SK promptov v 8 kategóriách (skopíruj do `prompts/sk-electronics.yaml`) |

### 4. Brand assets

| Súbor | Účel |
|---|---|
| **`mentivue-logo.svg`** | Primary logo (geometric eye + coral dot) |
| **`mentivue-brand-identity.html`** | Kompletný brand book s live preview homepage |

### 5. Design handoff (pre claude.ai/design)

| Súbor | Účel |
|---|---|
| **`PAGE_INVENTORY.md`** | Zoznam 40 stránok, 14 unique templates, fázová priorita |
| **`DESIGN_PROMPTS.md`** | 3 ready-to-paste prompty (Marketing, Dashboard, PDF Report) |
| **`BRAND_TOKENS.md`** | Compact design system reference pre upload do claude.ai/design |

---

## 📋 Krok-za-krokom návod

### Step 1: Pripravte si prostredie

Pred spustením setup scriptu sa uisti že máš:

```bash
# Skontroluj prerequisites
which bun        # Should output path. If not: visit bun.sh
which pnpm       # If not: npm install -g pnpm
which docker     # For local Postgres + Redis
which git        # Should be installed
```

### Step 2: Stiahni všetky súbory

Stiahni si tento celý bundle do jedného foldra (napr. `~/Downloads/mentivue-bundle/`).

### Step 3: Spusti setup script

```bash
cd ~/Downloads/mentivue-bundle/
chmod +x setup-monorepo.sh
./setup-monorepo.sh
```

Toto vytvorí `mentivue/` folder s kompletnou monorepo štruktúrou. Trvá to 2-3 minúty (väčšina je pnpm install).

### Step 4: Skopíruj dokumenty

```bash
# Z tohto bundle do mentivue/docs/
cp PRD.md REPORTS.md METRICS.md ANALYSIS.md VALIDATION.md \
   SALES_VALUE.md SUBSCRIPTION.md PHASED_GTM.md AUTOMATION.md \
   READINESS_AUDIT.md STACK_COMPARISON.md MONOREPO.md \
   mentivue/docs/

# Prompts file
cp prompts-sk.yaml mentivue/prompts/sk-electronics.yaml

# Brand assets
mkdir -p mentivue/brand
cp mentivue-logo.svg mentivue-brand-identity.html mentivue/brand/

# Design handoff (zostane na bundle úrovni - to nie je code)
# Tieto súbory budú slúžiť pre claude.ai/design sessions
```

### Step 5: Nakonfiguruj environment

```bash
cd mentivue
nano .env  # alebo code .env
```

Vyplň API keys:
- `ANTHROPIC_API_KEY` - z console.anthropic.com
- `OPENAI_API_KEY` - z platform.openai.com  
- `PERPLEXITY_API_KEY` - z perplexity.ai/settings/api
- `GEMINI_API_KEY` - z ai.google.dev
- `RESEND_API_KEY` - z resend.com (Y1 môže byť prázdne)
- `STRIPE_SECRET_KEY` - z stripe.com (Y1 môže byť prázdne)
- `AUTH_SECRET` - vygeneruj: `openssl rand -hex 32`

### Step 6: Spusti lokálnu infraštruktúru

```bash
pnpm docker:up
```

Toto spustí Postgres 16 + Redis 7 v Dockeri.

### Step 7: Inicializuj databázu

```bash
# Generuj prvú migráciu z Drizzle schema
pnpm db:generate

# Aplikuj migráciu
pnpm db:migrate

# Seed initial data (15 značiek elektroniky)
pnpm db:seed
```

### Step 8: Spusti všetky services

```bash
pnpm dev
```

Toto spustí naraz:
- Marketing site na http://localhost:4321
- App server na http://localhost:3000
- Workers (background processes)

### Step 9: Otvor v VS Code

```bash
code .
```

V VS Code:
1. Otvor Claude Code panel
2. First prompt: **"Read CLAUDE.md and docs/PRD.md, then we'll start with Week 1 task #1 from AUTOMATION.md"**

---

## 🎯 Čo robiť ďalej

### Priorita 1: Build core infrastructure (Week 1)

Per `AUTOMATION.md` Phase 1 priorities:
1. Importuj prompts z `prompts-sk.yaml` do databázy
2. Implementuj Report Writer agent (Industry Report PDF)
3. Implementuj Pulse Writer agent (weekly newsletter)
4. Spusti prvý collection cycle (1 prompt × 4 LLMs)
5. Verify data extraction pipeline

### Priorita 2: Marketing site (Week 2-3)

- Adaptuj `mentivue-brand-identity.html` design do Astro komponentov
- Implementuj 5 launch-essential stránok (Homepage, Pricing, Audit, Report, Methodology)
- Setup Cloudflare Pages deploy

### Priorita 3: Legal + Operations (Week 3-4)

Per `READINESS_AUDIT.md` critical gaps:
- Termly.io subscription pre Terms/Privacy/DPA
- Email templates (12 scenárov)
- FAQ document
- Onboarding form questions

### Priorita 4: Soft launch (Week 5-6)

- Public Industry Report download
- First Per-Brand Audit sales
- LinkedIn content engine starts
- PR outreach to 5 SK tech publications

---

## 💡 Tips pre Claude Code workflow

### Always read CLAUDE.md first

V root foldri máš `CLAUDE.md` s navigačnými inštrukciami. Pri každom novom Claude Code session pošli:

> "Read CLAUDE.md to understand the project."

### Cross-cutting features

Najvačší benefit monorepa: cross-cutting features v jednom session.

Príklad task:
> "Add a new metric 'Citation Velocity' that tracks how fast a brand's citations grow over time. 
> Schema change, agent, query, dashboard component, all in one PR."

Claude Code môže urobiť všetko naraz lebo má prístup k celému kódu.

### Use shared package aggressively

Všetko čo môže byť shared, daj do `packages/shared/`:
- DB schema + queries
- LLM clients
- Types (Brand, Metric, Report)
- Utils (formatters, validators)
- Config (env validation)

App a workers iba **konzumujú** shared. Žiadne duplikovanie.

---

## 🔧 Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "bun: command not found"
```bash
curl -fsSL https://bun.sh/install | bash
```

### Docker compose nefunguje
```bash
# Ubuntu/Debian
sudo apt install docker.io docker-compose-plugin

# macOS
brew install docker docker-compose
# Plus install Docker Desktop
```

### "Cannot find module @mentivue/shared"
```bash
# Z root projektu
pnpm install
```

### Migrations failing
```bash
# Reset database
pnpm docker:down
docker volume rm mentivue_postgres_data
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

---

## 📚 File reference

### Reading order (recommended)

Ak začínaš od nuly, čítaj v tomto poradí:

1. **`README.md`** (toto v outputs folderi) - overview
2. **`MONOREPO.md`** - prečo táto štruktúra
3. **`STACK_COMPARISON.md`** - prečo tento tech stack
4. **`PRD.md`** - product strategy
5. **`PHASED_GTM.md`** - launch timeline
6. **`AUTOMATION.md`** - čo všetko stavať
7. **`READINESS_AUDIT.md`** - čo chýba pred launch

### Reference docs (čítaj keď potrebuješ)

- **`METRICS.md`** - keď pridávaš novú metriku
- **`ANALYSIS.md`** - keď riešiš data pipeline
- **`VALIDATION.md`** - keď riešiš quality control
- **`REPORTS.md`** - keď pridávaš nový typ reportu
- **`SALES_VALUE.md`** - keď premýšľaš o pricing/sales
- **`SUBSCRIPTION.md`** - keď pridávaš subscription features

### Design docs (pre claude.ai/design)

- **`PAGE_INVENTORY.md`** - aké stránky stavať
- **`DESIGN_PROMPTS.md`** - ready-to-paste prompty
- **`BRAND_TOKENS.md`** - design system reference

### Brand assets (pre design + dev)

- **`mentivue-logo.svg`** - logo SVG
- **`mentivue-brand-identity.html`** - kompletný brand book

---

## ✅ Final checklist

Pred prvým reálnym dev session, over:

- [ ] Setup script úspešne dobehol
- [ ] `.env` má všetky kľúče vyplnené
- [ ] `pnpm docker:up` spustil Postgres + Redis
- [ ] `pnpm db:migrate && pnpm db:seed` prebehol bez chyby
- [ ] `pnpm dev` spúšťa všetky 3 services
- [ ] http://localhost:4321 zobrazuje Astro site
- [ ] http://localhost:3000/health vracia JSON
- [ ] Workers logy ukazujú "Workers initialized"
- [ ] Všetky docs sú v `mentivue/docs/`
- [ ] `prompts-sk.yaml` je v `mentivue/prompts/sk-electronics.yaml`
- [ ] VS Code otvorený v root `mentivue/`
- [ ] Claude Code session má prečítané CLAUDE.md

Keď máš všetko ✓, môžeš začať Week 1 build.

---

## 🎉 Good luck

Pamätaj:
- **Phased GTM** - Phase 1 najprv (M0-3), validuj dopyt, potom expand
- **AI-native** - 70% práce robia agenti, ty si strategist
- **Solo developer mode** - Claude Code je tvoj senior engineer
- **Slovak-first** - target je SK CMO, nie global

Stavaj rýchlo, predaj prvý audit, iteruj na základe feedback.

---

*Toto je living document. Pridávaj si poznámky ako sa projekt vyvíja.*
