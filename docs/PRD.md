# Mentivue - Product Requirements Document

**Version:** 1.0 (MVP)
**Date:** Máj 2026
**Owner:** Tomas
**Status:** In planning, Week 1 starting
**Language:** Slovak market only (CZ deferred to V2)

---

## 1. Vízia a problém

### 1.1 Problém

Marketing a digital lídri v slovenských e-commerce firmách nemajú spôsob, ako merať, ako sa ich brand zobrazuje v AI search nástrojoch (ChatGPT, Claude, Perplexity, Gemini). Tradičné SEO tools (Ahrefs, Semrush) merajú Google SERP, ale neukazujú čo AI odpovedá pri otázkach typu "kde kúpiť iPhone v SK". Pritom AI search v Európe rastie rýchlosťou ~15-20% mesačne (2026) a podiel z celkového search traffic už presahuje 15%.

CMOs nevedia:
- Či sa ich brand v AI search vôbec zobrazuje
- Ako sa porovnávajú voči konkurencii
- Aké zdroje AI cituje
- Či AI o ich brande nehalucinuje (cenu, dostupnosť, kvalitu)
- Aké content gaps treba zaplniť

### 1.2 Riešenie

Mentivue je B2B SaaS / Research firma, ktorá týždenne meria AI search visibility brandov v slovenskom e-commerce trhu a vydáva:
- **Industry Reports** (verejné, prvých 10 strán zadarmo, plná verzia €299-499) - PR engine + lead magnet
- **Per-Brand Custom Audits** (€1 990-3 990 jednorázovo, alebo subscription €990-1 990/mes) - hlavný revenue stream

### 1.3 Diferenciácia

Voči existujúcim hráčom (Profound, Peec AI, Otterly):
- **Lokálny jazyk** - SK natívne, nie ako edge case
- **CEE expertíza** - hĺbka kontextu pre regionálne brandy
- **Industry-first reporty** - verejné publikácie ako moat (longitudinálne dáta)
- **AI-first firma** - zero employees, plne automatizovaná operácia

---

## 2. Target persona

**Primárny buyer:** CMO / Marketing Director slovenských elektronických eshopov.

**Profile:**
- 35-50 rokov, 5-15 rokov v marketingu
- Riadi rozpočet €500k-5M ročne na marketing
- Pozná SEO, googluje "AI search optimization"
- Má pocit, že AI niečo mení, ale nevie čo presne
- Reportuje na CEO/board, potrebuje zrozumiteľné metriky
- Disponuje rozpočtom na "research/competitive intelligence"

**Sekundárny buyer:** Digital / E-commerce Manager (rovnaký profil, mladší, technicky orientovanejší).

**Negative persona (nepredávame):**
- IT/CTO (potrebujú iný typ dát)
- Performance marketing manageri (zaujímajú ich konverzie, nie visibility)
- CEO bez marketing background

---

## 3. Scope - prvá verzia (V1)

### 3.1 Geografický rozsah

**V1:** Iba SK trh, slovenský jazyk.
**V2 (mesiac 3-4):** CZ.
**V3 (mesiac 6+):** PL, HU.

### 3.2 Vertikálka

**V1:** Elektronika eshopy (Alza, Datart, Nay, Planeo, Andrea Shop, Hej, Okay, Mall, Electro World, iStores, atď).
**V2:** Banky.
**V3:** Retail (Kaufland, Lidl, Tesco).

### 3.3 LLM coverage - asymetrický mix

V1 sleduje 4 LLM, ale **nie všetky daily**:

| LLM | Model | Daily | Weekly | Monthly |
|---|---|:---:|:---:|:---:|
| **Anthropic Claude** | Haiku 4.5 | ✓ | ✓ | ✓ |
| **Perplexity** | Sonar | ✓ | ✓ | ✓ |
| **OpenAI ChatGPT** | GPT-5.4 mini | - | ✓ | ✓ |
| **Google Gemini** | 3.1 Flash-Lite + Grounding | - | ✓ | ✓ |

**Tier 1 (daily, 2 LLMs):** Claude Haiku + Perplexity Sonar
- Pokrýva ~70% AI search trhu (ChatGPT-style + native search)
- Daily náklad: ~$7.50/deň

**Tier 2 (weekly, 4 LLMs):** všetky 4
- Plný coverage pre methodology completeness
- Weekly batch s Batch API (50% off)

**Rationale pre Gemini ako weekly-only:**
- Grounding fee $14/1K queries robí denné dopytovanie drahým
- Slovak language coverage je slabšia než ChatGPT/Claude
- Pre quarterly report stačí weekly frequency

Všetky 4 search-enabled. Žiadny headless browser. Detailný cost breakdown a queries v `ANALYSIS.md`.

### 3.4 Tracked brands (V1)

15 brandov pokrývajúcich ~85% SK e-commerce elektronika trhu:

1. Alza.sk
2. Datart.sk
3. Nay.sk
4. Planeo Elektro
5. Andrea Shop
6. Hej.sk
7. Okay.sk
8. Mall.sk
9. Electro World
10. iStores
11. Mironet.sk
12. Megapixel.sk
13. TPD.sk
14. Faxcopy.sk
15. Notebooky.sk

Plus 2 cross-border (Amazon, AliExpress) ako reference.

### 3.5 Prompt library

**V1:** 1 176 SK promptov, 8 kategórií. Distribúcia:
- Product-Specific: 300 (26%)
- Discovery / Vendor Recommendations: 250 (21%)
- Comparison / Versus: 150 (13%)
- Trust & Service: 100 (9%)
- Use Case / Persona-driven: 100 (9%)
- Long-tail / Niche: 100 (9%)
- Validation (hallucination, negative sentiment, citations, stock): 96 (8%)
- **Commercial Intent (decision journey, purchase, price, evaluation): 80 (7%)**

Commercial intent kategória je kľúčová pre revenue-focus reportov (SALES_VALUE.md). Validation kategória pre quality assurance (VALIDATION.md). Detail v `ANALYSIS.md`.

### 3.6 Frekvencia spustenia

**Tiered approach:**
- Tier A (15% promptov = ~150): denne
- Tier B (60% = ~600): týždenne
- Tier C (25% = ~250): mesačne

Pri 4 LLM:
- Daily: 600 calls/deň
- Weekly: 2400 calls/týždeň
- Monthly: 1000 calls/mes
- **Total monthly: ~30k calls** (pred Batch API úsporami)

### 3.7 Čo V1 NEROBÍ

Explicitne mimo scope:
- ❌ Auto-fix content (schema generation, CMS push)
- ❌ Real-time dashboard (iba weekly reports)
- ❌ Mobile app
- ❌ White-label pre agentúry
- ❌ Google AI Overviews tracking (vyžaduje SERP API, V2)
- ❌ Sentiment analysis nad rámec pos/neutral/neg buckets
- ❌ Multi-tenant SaaS (každý report je custom delivery)

---

## 4. Tech stack

### 4.1 Backend

- **Runtime:** Bun (TypeScript native, rýchle)
- **Framework:** Fastify (HTTP API ak treba)
- **ORM:** Drizzle (TypeScript-first, lightweight)
- **Queue:** BullMQ + Redis
- **Tests:** Vitest

### 4.2 Frontend

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Data fetching:** TanStack Query
- **Charts:** Recharts (server-side rendered pre PDF)
- **PDF:** Puppeteer (headless Chrome)

### 4.3 Database

- **Primary:** PostgreSQL 16 + pgvector extension
- **Dev:** Docker Compose local
- **Production:** Hetzner Cloud CX22 (€5/mes) alebo Neon serverless

### 4.4 Hosting

- **Frontend:** Vercel (Next.js native)
- **Worker + DB:** Hetzner Cloud CX22 Ubuntu 24.04
- **Storage:** Cloudflare R2 (report PDFs)
- **DNS + CDN:** Cloudflare (free tier)
- **Email:** Resend (transactional + newsletter)

### 4.5 LLM API providers

Direct API access, žiadny aggregator pre V1:
- Anthropic Console API
- OpenAI Platform API
- Google AI Studio API
- Perplexity API

**Žiadne subscription bypass.** Čisto API keys, plne ToS-compliant.

### 4.6 Observability

- **LLM call logs:** vlastná `llm_calls` tabuľka v Postgres
- **Application logs:** Better Stack alebo Axiom (free tier)
- **Optional proxy layer:** Helicone alebo Langfuse (later, nice-to-have)

---

## 5. Architektúra - 4 vrstvy

```
LAYER 1: Collection (cron-driven)
─────────────────────────────────
Prompt Library → BullMQ Job Queue → Worker Pool (4 LLM clients)
→ Raw Responses (PostgreSQL) + Cost Log

LAYER 2: Analysis (event-driven)
─────────────────────────────────
New Response → Claude Haiku Pipeline:
- Brand mention extraction
- Sentiment per brand
- Citation parsing
- Hallucination flags
→ Structured Insights (PostgreSQL)

LAYER 3: Aggregation
─────────────────────
Daily/Weekly Aggregator:
- Share of Voice per brand
- Trends (WoW, MoM)
- Citation source rankings
- Anomaly detection
→ Aggregated Metrics Tables

LAYER 4: Report Generation
───────────────────────────
Template Engine (Claude Sonnet narrative) + Recharts → 
Puppeteer PDF → R2 Storage → Email Delivery + Public Landing
```

Každá vrstva stateless. Komunikujú cez DB. Vieš škálovať/debugovať každú zvlášť.

**Detailný popis Layer 2 a Layer 3 (analysis prompts, SQL queries, aggregation logic) je v samostatnom dokumente `ANALYSIS.md`.** PRD pokrýva architektonické rozhodnutia, ANALYSIS implementačné detaily.

**Validation methodology, traceability matrix a quality control proces sú v `VALIDATION.md`.** Pre každú metriku v reportoch je definované odkiaľ pochádza, ako sa overuje a aká je naša confidence.

**Per-metric deep dive (každá metrika v reportoch s jej promptmi, LLM behavior patterns, extraction, aggregation, cross-LLM weighting) je v `METRICS.md`.** Toto je referencia ktorá uzatvára kruh medzi REPORTS, ANALYSIS a VALIDATION dokumentmi - bez nej Claude Code nemá traceability medzi reportom a SQL queries.

**Sales value layer a marketing actionability sú v `SALES_VALUE.md`.** Tento dokument premieňa reporty z "diagnostiky" (čo sa deje) na "playbook" (čo urobiť aby som zarobil viac). Pridáva 12 nových sekcií do Per-Brand Audit (Revenue Impact Model, Lost Revenue from Gaps, Competitive Playbook Reverse Engineering, Content Calendar, PR Targets, AI vs Paid Search math, Predictive Trajectory, ...). Bez tejto vrstvy je report len drahý dashboard. S ňou je to business-critical tool.

**Subscription model a recurring revenue stratégia sú v `SUBSCRIPTION.md`.** Tento dokument transformuje Mentivue z "report sellera" na "advisory business" s 3-tier subscription (Watch €490, Pro €1 490, Enterprise €4 990 monthly). Definuje 5 hodnotových pilierov, 6 stickiness mechanisms, content delivery rhythm, retention KPIs, churn handling, killer features a Y1-Y3 revenue projekcie. Y1 target prešiel z €273k jednorázovo na €650-800k subscription-first. Y3 ARR target €8-12M.

**Phased go-to-market stratégia je v `PHASED_GTM.md`.** Tento dokument je kritický - rieši ako začať realisticky bez vyhorenia a postupne pridať subscription elements. Definuje 4-fázový crescendo: Phase 1 (M0-3, Authority + Audits, €25-35k), Phase 2 (M3-6, + Watch tier €490/mes), Phase 3 (M6-12, + Pro tier €1 490/mes, €270k revenue), Phase 4 (M12+, + Enterprise €4 990/mes). Každá fáza má decision gates ktoré musia byť splnené pred prechodom. Realistic Y1 outcome: €200-300k revenue, €240-360k ARR exit. Y3 trajectory: €3-6M ARR, €15-30M valuácia.

**AI-native automation playbook je v `AUTOMATION.md`.** Tento dokument je čo robí Mentivue scalable - definuje 12 AI agentov (Content, Ops, Sales), Tomas Command Center dashboard, self-critic patterns pre quality control, bottleneck analysis a riešenia. Cieľ: redukovať Tomas-time o 60-70% (Phase 1: 6-8h/týž namiesto 10-12, Phase 3: 10-15h/týž namiesto 22-25). Posúva scaling ceiling z 80-100 klientov na 200+ pred prvým hire. Reálnejšie sustainable popri Telekome.

---

## 6. Data model

### 6.1 Core tables

```
brands
├── id (uuid, PK)
├── name (text, unique)
├── country (text: 'SK')
├── category (text: 'electronics')
├── website (text)
├── aliases (jsonb: ["alza", "alza.sk"])
└── created_at

prompts
├── id (uuid, PK)
├── external_id (text, unique: "sk-discovery-001")
├── category (text)
├── subcategory (text)
├── language (text: 'sk')
├── text (text)
├── frequency_tier (text: 'daily', 'weekly', 'monthly')
├── is_active (boolean)
└── created_at

llm_calls
├── id (uuid, PK)
├── prompt_id (FK → prompts)
├── provider (text)
├── model (text)
├── input_tokens (int)
├── output_tokens (int)
├── cached_input_tokens (int)
├── search_fee_usd (numeric)
├── estimated_cost_usd (numeric)
├── latency_ms (int)
├── status (text: 'success', 'error', 'rate_limited')
├── error_message (text, nullable)
├── is_batch (boolean)
└── created_at

raw_responses
├── id (uuid, PK)
├── llm_call_id (FK → llm_calls, unique)
├── response_text (text)
├── citations (jsonb: [{url, title, domain}])
├── metadata (jsonb)
└── created_at

brand_mentions
├── id (uuid, PK)
├── raw_response_id (FK)
├── brand_id (FK)
├── position (int: 1=first mentioned)
├── context (text: úryvok)
├── sentiment (text: 'positive', 'neutral', 'negative')
├── sentiment_score (numeric: -1.00 to 1.00)
└── created_at

response_quality
├── id (uuid, PK)
├── llm_call_id (FK, unique)
├── response_length (int)
├── brands_mentioned_count (int)
├── citations_count (int)
├── refused_to_answer (boolean)
├── language_correct (boolean)
├── quality_score (numeric: 0-10)
└── created_at

daily_cost_summary (materialized view aktualizovaný cronom)
├── date (date)
├── provider (text)
├── total_calls (int)
├── total_cost_usd (numeric)
├── avg_latency_ms (int)
├── error_count (int)
└── PK: (date, provider)
```

### 6.2 Indexes (kritické pre performance)

- `llm_calls.created_at` (denné queries)
- `llm_calls.provider` (filter per provider)
- `llm_calls.prompt_id` (per-prompt analytics)
- `brand_mentions.brand_id` (per-brand reports)
- `brand_mentions.raw_response_id`
- `raw_responses.llm_call_id` (unique)

---

## 7. Cost tracking system - kritické

### 7.1 Princíp

**Každý jediný API call sa loguje s tokens a cost calculation pred a po.** Bez výnimky. Cost je first-class data, nie afterthought.

### 7.2 Cost calculation per model (May 2026 pricing)

```typescript
const PRICING = {
  'anthropic:claude-haiku-4-5': {
    input: 1.0,    // $/MTok
    output: 5.0,
    searchFeePerCall: 0.005,
  },
  'openai:gpt-5.4-mini': {
    input: 0.75,
    output: 4.50,
    searchFeePerCall: 0,  // built-in
  },
  'google:gemini-3.1-flash-lite': {
    input: 0.10,
    output: 0.40,
    searchFeePerCall: 0.014,  // grounding
  },
  'perplexity:sonar': {
    input: 1.0,
    output: 1.0,
    searchFeePerCall: 0.005,
  },
};
```

Pricing config updates pravidelne, lebo providery menia ceny.

### 7.3 Budget alerts

- **Daily soft warning:** $12 (80% z hard limit)
- **Daily hard kill:** $15 (pauzni BullMQ workers, pošli email)
- **Monthly soft:** $300
- **Monthly hard:** $400

Kill switch musí byť atomický - keď spend prekročí limit, ďalšie job-y v queue sa zastavia, ale bežiace dokončia (graceful).

### 7.4 Cost dashboard sekcie

V `apps/admin`:
- **Today widget:** spend doteraz / limit, % progress
- **7-day trend:** stĺpcový graf
- **Per-provider breakdown:** koláč
- **Top 10 expensive prompts:** tabuľka
- **Failure rate per provider:** alert sa nestane bug, ale cost
- **Monthly projection:** linear extrapolation z current rate

---

## 8. Quality tracking system

### 8.1 Princíp

Lacný junk je horší ako drahý quality. **Každá odpoveď dostane quality score 0-10**, aby sme videli ktorý prompt a ktorý LLM dáva užitočné odpovede.

### 8.2 Quality scoring pipeline

Druhý Claude Haiku call ohodnotí response (cca $0.005/scoring):

```
INPUT: prompt text + LLM response text
PROMPT (Claude Haiku):
"Hodnotíš kvalitu AI odpovede na zákaznícku otázku 
o slovenských e-shopoch s elektronikou. 
Skóruj 0-10 podľa kritérií:
- Relevance: odpoveď rieši otázku
- Specificity: spomenuté konkrétne brandy/produkty
- Citation quality: má odpoveď zdroje?
- Slovak language correctness
- Refusal to answer (-5 ak áno)

Vráť JSON: {score: number, refused: boolean, reasoning: string}"
```

### 8.3 Quality dashboard sekcie

- **Avg quality score per LLM** (kto dáva najkvalitnejšie odpovede)
- **Top 10 high-quality prompts** (kandidáti na feature v reporte)
- **Top 10 low-quality prompts** (kandidáti na rewrite/drop)
- **Brand mention coverage map** (ktoré brandy AI ignoruje)
- **Refusal rate per LLM** (sentinel pre changes v safety policies)

---

## 9. Implementácia - 6 týždňov plán

### Týždeň 1: Foundations

**Goal:** PostgreSQL + Drizzle + 1 LLM client + 5 test promptov bežia denne.

**Deliverables:**
- Monorepo skeleton (Bun + Turborepo)
- Docker Compose local dev (Postgres + Redis)
- Drizzle schema deployed, brands + prompts seeded
- Anthropic Claude Haiku client funkčný
- Manual trigger script: 5 prompts → DB
- Logy a cost tracking working
- Basic SQL queries cez psql

**Acceptance:**
- [ ] `docker compose up -d` štartuje Postgres+Redis
- [ ] `drizzle-kit migrate` vytvorí všetky tabuľky
- [ ] Seed skript naplní 15 brandov a 10 prompts
- [ ] Manuálny test call vráti response a zapíše do DB
- [ ] Cost calculation je realistická (verifikuj manuálne)

**Budget:** ~$5 v API spend

### Týždeň 2: 4 LLM coverage + production prompts

**Goal:** Všetky 4 LLM API integrované, 50 promptov bežia denne.

**Deliverables:**
- OpenAI, Gemini, Perplexity clients
- Unified `LLMClient` interface
- 50 SK promptov z Kategórie 1 (Discovery) v DB
- BullMQ scheduler s daily cron 02:00
- Basic admin dashboard (Today's spend, calls count)

**Acceptance:**
- [ ] Všetky 4 clients vrátia response na test prompt
- [ ] Cron job spustí 50 × 4 = 200 calls automaticky
- [ ] Cost tracking pre všetky 4 providery presný
- [ ] Admin dashboard ukazuje totals z DB

**Budget:** ~$10-15

### Týždeň 3: Analysis pipeline

**Goal:** Raw responses sa parsujú do brand mentions + sentiment.

**Deliverables:**
- Brand extraction pipeline (Claude Haiku)
- Sentiment analysis per brand
- Citation URL extraction
- Quality scoring system
- Aggregation cron (daily SoV computation)
- Admin dashboard s brand visibility charts

**Acceptance:**
- [ ] 100% raw responses majú spracované brand mentions
- [ ] Quality score sa vypočíta pre každú response
- [ ] Dashboard ukazuje "Top 10 brands by SoV last 7 days"

**Budget:** ~$25-35

### Týždeň 4: Prompts expansion + first report draft

**Goal:** Všetky 1000 promptov v DB, prvý report draft vygenerovaný.

**Deliverables:**
- Plných 1000 SK promptov v DB s frequency tiers
- Tiered scheduling (daily/weekly/monthly cron jobs)
- Report generation engine (Claude Sonnet narrative)
- Recharts vizualizácie server-side
- Puppeteer PDF template
- Prvý "Industry Report Q2 2026 Draft" - 20-30 strán

**Acceptance:**
- [ ] 1000 prompts v DB s priradenými tiers
- [ ] Daily tier (150 prompts × 4 LLM = 600 calls) beží stabilne
- [ ] Weekly tier batch generates báze
- [ ] PDF generation produkuje legible report

**Budget:** ~$50-80

### Týždeň 5: Quality iteration + landing page

**Goal:** Report v publishable kvalite, mentivue.ai live.

**Deliverables:**
- 5-10 iterácií promptov pre report generation
- mentivue.ai landing page (Next.js + Vercel)
- Email gate pre report download (Resend)
- Sales page pre Per-Brand Audit
- Privacy policy + GDPR cookie banner

**Acceptance:**
- [ ] Report prešiel reading testom (3 ľudia z networku ho zhodnotia)
- [ ] mentivue.ai je live s SSL, custom doménou
- [ ] Email capture funguje, PDF sa pošle automaticky

**Budget:** ~$40-60

### Týždeň 6: Launch + outreach

**Goal:** Prvý publikovaný report, prvý sales conversation.

**Deliverables:**
- LinkedIn launch post (osobne od Tomas)
- PR pitch do Trend, Etrend, Živé, DSL.sk, Forbes SK
- Outreach na 20 CMOs/Digital Leadov
- Conversion tracking: download → email → call → buy

**Acceptance:**
- [ ] >100 lead emailov za 7 dní od launchu
- [ ] >5 outbound replies "zaujímavé, pošli viac"
- [ ] >1 person ktorá pýta cenovú ponuku

**Budget:** ~$60-100

**Total 6-týždňový spend: ~$190-310 USD** (~€175-285)

**Ongoing monthly cost po launch:** ~$400-500/mes pri 1000 promptoch (s Batch API + caching). Detailný breakdown v `ANALYSIS.md` sekcia 1.5.

---

## 10. Reporty - štruktúra

**Detailný popis všetkých 6 typov reportov, ich obsah, customer journey, generation pipeline a pricing je v samostatnom dokumente `REPORTS.md`.**

### 10.1 Quick overview portfolio

| Tier | Report | Cena | Cieľ |
|---|---|---|---|
| 0 (free) | Mentivue Index Snapshot (live) | €0 | SEO + autorita |
| 0 (free) | Mentivue Brand Cards (15×) | €0 | SEO + lead capture |
| 0 (free) | Mentivue Pulse Newsletter | €0 | Nurturing |
| 1 (lead magnet) | Industry Report - Free Preview | €0 | Lead capture |
| 2 | Industry Report - Full | €299/Q | First paid |
| 3 (core revenue) | Per-Brand Audit | €1 990 / €990 mes | Hlavný revenue |
| 4 | Competitive Benchmark | €3 990 | Premium |
| 4 | Custom Research | €1 500-5 000 | Bespoke |

### 10.2 Y1 revenue target

~€270k z 4 typov produktov, dominantne z Per-Brand Audits a Subscriptions. Detail v REPORTS.md sekcia 8.

---

## 11. Pricing

| Produkt | Cena | Cadence |
|---|---|---|
| Industry Report - first 10 pages | €0 | Quarterly |
| Industry Report - full | €299 | Quarterly |
| Industry Report - annual sub | €999 | Quarterly delivery |
| Per-Brand Audit - one-off | €1 990 | On demand |
| Per-Brand Audit - subscription | €990/mes | Monthly delivery, quarterly deep refresh |
| Competitive Benchmark (2-3 brandy) | €3 990 | One-off |
| Custom Research (specific question) | €1 500-5 000 | Project-based |

---

## 12. Go-to-market

### 12.1 Launch sequence (Týždeň 6)

**Deň 1 (Pondelok):** LinkedIn post od Tomas, founding story, link na report
**Deň 2:** Email outreach prvých 10 CMOs (warm intro cez network ak možný)
**Deň 3:** PR pitch 5 médiám
**Deň 4-5:** Follow-up na nereagujúce kontakty
**Deň 6-7:** Druhá vlna outreach na 10 ďalších CMOs

### 12.2 Outreach template (1:1)

```
Predmet: AI search visibility Vašej značky - krátka analýza

Dobrý deň [Meno],

vyrobili sme komplexný benchmark, ako sa zobrazuje 15 hlavných 
slovenských e-shopov s elektronikou v ChatGPT, Claude, Perplexity 
a Gemini. [Brand] sa umiestnil [pozícia] s [SoV] share of voice.

Zaujímavé zistenia pre [Brand]:
- [3 konkrétne body z dát]

Posielam Vám zadarmo prvých 10 strán reportu, plus krátky 
"executive snapshot" špecifický pre [Brand].

Ak by Vás zaujímal hlbší audit (90+ promptov priamo o [Brand], 
3 nominovaní konkurenti, 90-day action plan), radi pripravíme.

Pozdravujem,
Tomas
```

### 12.3 PR angles

- "Prvá nezávislá štúdia AI viditeľnosti slovenských eshopov"
- "Top 5 zistení o AI search v slovenskom retaile"
- "Prečo [najväčší underdog z dát] poráža [najväčší expected leader] v AI odpovediach"

---

## 13. Risk register

| Risk | Pravdepodobnosť | Impact | Mitigation |
|---|---|---|---|
| LLM API rate limits | High | Medium | BullMQ retry, exponential backoff |
| Cost runaway | Medium | High | Daily budget hard kill |
| Quality degradation undetected | High | High | Quality scoring automated |
| Provider API changes | Medium | Medium | Versioned API calls, abstraction layer |
| Telekom konflikt záujmov | Medium | High | Manželkina sro, no electronics overlap with telco, separate identity |
| Personal burnout | High | High | Realistic 10-15h/týždeň, kvalitnejšie ako rýchlejšie |
| Slow first revenue | Medium | High | Pricing tiers, free industry report ako lead magnet |
| Konkurencia copycat | Low first 6 months | Medium | Speed to publish, longitudinal data advantage |

---

## 14. Open questions / pending decisions

- [ ] Hosting: Hetzner CX22 od dňa 1, alebo Pi dev → cloud production?
- [ ] Doména: registrovať mentivue.ai + .com + .eu jednorázovo (€80)?
- [ ] EU Trademark: žiadame Class 9 + 42 (€850-1000) po prvom revenue?
- [ ] LLM provider mix: zostávame so 4, alebo experimentujeme s DeepSeek pre cost-optimization?
- [ ] Report dizajn: vlastný in-house, alebo pošleme designerovi raz na template (€500-1500)?
- [ ] Newsletter: launch hneď, alebo až po prvom reporte?

---

## 15. Glossary

- **SoV:** Share of Voice - % response v ktorých sa brand spomína
- **GEO:** Generative Engine Optimization (industry term pre AI search optimization)
- **LLM:** Large Language Model
- **Frequency tier:** Daily/Weekly/Monthly cadence spúšťania promptu
- **Grounding:** LLM mechanism pre real-time web search
- **Citation:** URL ktorú LLM uvádza ako zdroj
- **Hallucination:** AI tvrdenie o brande/produkte ktoré nie je pravda
- **Anchor customer:** Prvý platiaci klient, ktorý validuje produkt
- **ACV:** Annual Contract Value
- **Per-Brand Audit:** Custom report špecifický pre jeden brand

---

## 16. Príloha: kontext pre Claude Code

Tento PRD slúži ako primárny kontext pre Claude Code počas implementácie. Pravidlá:

1. **Vždy najprv PRD, potom kód.** Ak Claude Code chce robiť rozhodnutie ktoré nie je v PRD, najprv to konzultuj.
2. **Cost-conscious development.** Pri každom novom LLM call zváž či je nutný.
3. **Quality > Speed.** Lepšie pomalé a kvalitné než rýchle a zlé.
4. **Žiadne mock dáta v produkčnom kóde.** Test data jasne separuj.
5. **TypeScript strict mode** všade. Žiadne `any`.
6. **Atomic commits.** Jeden feature = jeden commit.
7. **Dokumentuj rozhodnutia v `/decisions/`** ako ADR (Architecture Decision Records).

**Repo štruktúra:**
```
mentivue/
├── apps/
│   ├── web/                  # mentivue.ai landing
│   ├── admin/                # Internal dashboard
│   └── worker/               # Cron + queue workers
├── packages/
│   ├── db/                   # Drizzle schemas
│   ├── llm-clients/          # 4 LLM API wrappers
│   ├── analysis/             # Brand extraction, sentiment
│   ├── report-gen/           # PDF + narrative
│   ├── cost-tracker/         # Cost logging, alerts
│   └── shared/               # Types, utils
├── prompts/
│   └── sk/                   # YAML prompt library
├── decisions/                # ADRs
├── docker-compose.yml
├── turbo.json
└── package.json
```

**Konvencie:**
- Filenames: `kebab-case.ts`
- Exports: named, žiadny default (okrem Next.js pages)
- Errors: throw custom error classes, nie strings
- Async: async/await, žiadne `.then()` chains
- Validation: Zod pre runtime, TypeScript pre compile-time
