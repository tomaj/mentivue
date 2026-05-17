# Mentivue - Readiness Audit & Expansion Roadmap

**Companion document analyzing:**
1. Sú dokumenty + prompty pripravené na launch? (Audit)
2. Čo treba ešte doplniť pred Week 1? (Critical gaps)
3. Sú existujúce štruktúry pripravené na rozšírenie do iných segmentov? (Architecture review)

---

## 1. Stav existujúcej dokumentácie - executive summary

| Doménia | Status | Score |
|---|---|---|
| **Technická pripravenosť** | Ready to build | 9/10 |
| **Biznisová stratégia** | Robust | 8/10 |
| **Operations & policies** | Partial | 4/10 |
| **Legal/compliance** | Not addressed | 1/10 |
| **Vertical expansion architecture** | Solid foundation | 7/10 |

**Verdikt:** Môžeš zajtra otvoriť Claude Code a začať stavať Week 1 tasks. Ale **5 kritických vecí musíš doplniť pred public launch v Week 5-6**.

---

## 2. Detailná analýza - čo máme

### 2.1 Technical readiness (9/10)

**Dobré:**
- DB schema kompletná (7 tabuliek, indexy, relations)
- LLM API endpoints + pricing zdokumentované
- 1 176 SK promptov ready
- SQL queries pre každú reportovanú metriku
- Self-critic patterns pre quality
- Cost tracking architecture
- 12 AI agentov špecifikovaných
- Tech stack rozhodnutý (Bun, TS, Postgres, BullMQ, Drizzle)

**Chýba:**
- CI/CD pipeline (GitHub Actions setup)
- Monitoring stack (Sentry, Better Stack špecifikácia)
- Backup stratégia (Postgres dumps, R2 retention)
- Disaster recovery plán

**Vyriešenie:** Pridať `OPERATIONS.md` (kapitola 5 nižšie).

### 2.2 Business strategy (8/10)

**Dobré:**
- 3-tier subscription pricing
- Customer journey 3 paths (organic, outbound, PR)
- 4-fázový GTM plán s decision gates
- Revenue projections Y1-Y3
- Sales talk tracks + objection handling
- 5 hodnotových pilierov pre subscription stickiness

**Chýba:**
- **Detailný hiring plán** (kedy, kto, ako screening)
- **Cap table strategy** (founder split, ESOP, investor terms)
- **Reseller/partner program** (agentúry ako channel?)
- **Klient referral program** (incentivize referrals?)

**Vyriešenie:** Pridať `BIZ_OPS.md` (kapitola 6 nižšie).

### 2.3 Operations & policies (4/10) - CRITICAL GAP

**Toto je tvoj biggest blind spot.**

**Chýba úplne:**
- **Legal:** Terms of Service, Privacy Policy, Data Processing Agreement (DPA)
- **GDPR compliance** dokumentácia
- **Security policy** (kto má prístup k čomu, incident response)
- **Email templates** napísané (welcome, audit delivery, renewal, churn, support)
- **Website wireframes** - vieme čo má byť na mentivue.sk?
- **Onboarding form questions** detailne definované
- **FAQ pre klientov** (top 30 otázok)
- **Support runbook** (ako handlovať reklamácie)
- **Brand identity kit** (logo varianty, typography, color tokens)

**Vyriešenie:** Pridať `LAUNCH_KIT.md` (kapitola 4 nižšie).

### 2.4 Measurement & learning (5/10)

**Dobré:**
- Success KPIs definované (NRR, churn, NPS)
- Quality validation metódy (M1-M22)
- Anomaly detection

**Chýba:**
- A/B testing framework
- Cohort analysis SQL
- Marketing attribution tracking (UTM, conversion paths)
- Win/loss analysis template
- Klient feedback loops (post-delivery surveys)

**Vyriešenie:** Pridať do `OPERATIONS.md`.

---

## 3. The 5 critical things to add before public launch

V poradí naliehavosti, čo musíš vyriešiť **pred Week 5-6 public launch**:

### Critical Gap 1: Legal & GDPR

**Status:** 0% covered.

**Risk if ignored:**
- GDPR fine up to €20M alebo 4% obratu (theoretical, prakticky tens of thousands)
- Klient nebude môcť podpísať B2B kontrakt bez DPA (Data Processing Agreement)
- Stratíš banky aj enterprise klientov

**Solution:**

```
Dokumenty potrebné:
1. Terms of Service (general SaaS terms)
2. Privacy Policy (GDPR compliant, dual SK + EN)
3. Data Processing Agreement (DPA) template pre B2B klientov
4. Cookie Policy + cookie consent banner
5. Imprint / Tiráž (business info)

Riešenia:
A. Use templates: termly.io ($10/mes) - generates GDPR-compliant docs
B. Lawyer review: ~€500-1000 jednorázovo (SK právnik B2B SaaS)
C. Copy from peers: pozri si Profound, Peec AI, ich legal pages

Time to fix: 1 týždeň part-time
Cost: €500-1500
```

**Recommendation:** **Path A + lawyer review**. Termly generate, lawyer over.

### Critical Gap 2: Email templates

**Status:** Mentioned but not written.

**Risk:** Klient po platbe dostane silence → bad first impression. Onboarding sa nepohne.

**Solution:** Vytvoriť 12 core email templates pred launch:

```
1. Free Industry Report download → "Welcome to Mentivue"
2. Newsletter signup confirmation
3. Audit purchase confirmation → "Your audit is being prepared"
4. Audit delivery → "Your Per-Brand Audit is ready"
5. Subscription welcome (Watch tier)
6. Subscription welcome (Pro tier) + kickoff scheduling
7. Monthly Action Report delivery
8. Pulse newsletter weekly
9. Renewal upcoming (30 dní pred renewal)
10. Renewal confirmation
11. Churn save / win-back (post-cancel)
12. Support reply template
```

**Time to fix:** 4-6 hodín (Claude Sonnet generuje, Tomas finalizes)

### Critical Gap 3: Website wireframes + content

**Status:** Concept defined but not designed.

**Risk:** Nemôžeš predať z PDF dokumentu. Klient potrebuje vidieť mentivue.sk.

**Solution:** Definovať wireframes pre 5 kľúčových stránok:

```
1. Homepage (hero, Mentivue Index live, pricing tiers, CTA)
2. /report - Industry Report landing (preview, buy)
3. /audit - Per-Brand Audit landing (process, pricing, FAQ)
4. /pricing - Subscription tier comparison
5. /brand/[slug] - Brand cards (SEO landing, 15 brandov)

Plus:
6. /methodology - Transparent methodology (autorita)
7. /blog - Content marketing hub
8. /about - O nás (Tomas-led story)
```

**Time to fix:** 1-2 týždne (paralelne s coding)
**Tooling:** Claude Code generuje Next.js komponenty z wireframe specs

### Critical Gap 4: Onboarding form design

**Status:** Mentioned, not specified.

**Risk:** Akú info pýtať od klienta? Bez toho neviete generovať custom audit.

**Solution:** Definovať 2 forms:

**Form 1: Free Industry Report download (low friction)**
```
- Meno
- Pracovný email
- Pozícia (dropdown: CMO, CEO, Digital Manager, Other)
- Firma
- "Akú vertikálku sledujete?" (multi-select: E-commerce elektronika, ...)
- Opt-in newsletter
```

**Form 2: Per-Brand Audit setup (post-purchase)**
```
Klient firma:
- Brand name (váš sledovaný brand)
- Brand website
- 3 hlavní konkurenti (named)
- Vaše kategórie focus (multi-select)
- Geografické zameranie (SR, SR+CZ, EU)

Pre Revenue Impact Model:
- Mesačný online traffic (cca)
- Average Order Value (€)
- Conversion rate (cca %)
- Mesačný online revenue (€, cca)
- Top 3 produktové kategórie

Strategické:
- Top 3 obchodné výzvy
- Aké rozhodnutia pomôže audit informovať?
- Kto bude report čítať? (multi-select: CMO, Sales, Board, ...)
```

**Time to fix:** 2-3 hodiny

### Critical Gap 5: Klient FAQ

**Status:** Not written.

**Risk:** Klient má otázky pred kúpou, nikto neodpovedá → strata predaja.

**Solution:** Vytvoriť 30-otázkový FAQ dokument:

```
Kategórie:
1. Methodology (10 otázok) - "Ako vlastne meriame? Aké LLM používame?"
2. Reports (8) - "Ako dlho trvá audit? Čo dostanem?"
3. Pricing (5) - "Prečo €1490/mes? Aké su garancie?"
4. Privacy & data (4) - "Aké dáta o nás zbierate?"
5. Subscription mechanics (3) - "Ako zruším? Refund policy?"
```

**Time to fix:** 4 hodiny (Claude Sonnet draft, Tomas review)

---

## 4. LAUNCH_KIT.md - kompletný launch checklist

Toto je nový dokument ktorý odporúčam pridať. Štruktúra:

```
LAUNCH_KIT.md sekcie:

A. Legal & Compliance
   A.1 Terms of Service (full text)
   A.2 Privacy Policy (full text)
   A.3 DPA template
   A.4 Cookie Policy
   A.5 Imprint

B. Email Templates (12 templates, ready to send)
   B.1 Welcome series
   B.2 Transactional emails
   B.3 Lifecycle emails
   B.4 Support templates

C. Website Content
   C.1 Homepage copy (headers, CTAs, hero copy)
   C.2 Pricing page copy
   C.3 Audit landing page copy
   C.4 Brand card template copy
   C.5 Methodology page (transparent)
   C.6 About page (founder story)

D. Forms & Surveys
   D.1 Newsletter signup form
   D.2 Free download form
   D.3 Audit setup form
   D.4 Subscription onboarding form
   D.5 Post-delivery NPS survey
   D.6 Churn exit survey

E. FAQ (30 questions)

F. Brand Identity
   F.1 Logo specifications
   F.2 Color tokens
   F.3 Typography rules
   F.4 Voice & tone guidelines
   F.5 Image style references

G. Support Runbook
   G.1 Common issues + resolutions
   G.2 Escalation procedures
   G.3 SLA definitions
   G.4 Klient communication templates
```

**Time to build:** ~2-3 týždne part-time. Mostly Claude Sonnet drafts + Tomas finalizes.

**Critical:** **Toto sa dá robiť paralelne s coding.** Nie blocker pre Week 1-2 build, ale blocker pre public launch.

---

## 5. OPERATIONS.md - operational guardrails

Druhý nový dokument. Sekcie:

```
A. DevOps & Deployment
   A.1 Git workflow (branching, PRs)
   A.2 CI/CD pipeline (GitHub Actions)
   A.3 Environment strategy (dev/staging/prod)
   A.4 Database migrations
   A.5 Deployment process

B. Monitoring & Observability
   B.1 Application logs (Better Stack / Axiom)
   B.2 LLM observability (Langfuse)
   B.3 Error tracking (Sentry)
   B.4 Uptime monitoring
   B.5 Performance metrics

C. Backup & Recovery
   C.1 Postgres backup schedule
   C.2 R2 storage retention
   C.3 Recovery procedures
   C.4 Disaster scenarios

D. Security
   D.1 Access control (who sees what)
   D.2 Secrets management (env vars, vaults)
   D.3 API key rotation
   D.4 Incident response procedure
   D.5 Penetration testing schedule

E. Measurement Infrastructure
   E.1 Analytics setup (Plausible / Posthog)
   E.2 A/B testing framework
   E.3 Conversion tracking
   E.4 Cohort analysis SQL templates
   E.5 Marketing attribution

F. Klient Lifecycle Management
   F.1 Onboarding milestones
   F.2 Engagement scoring
   F.3 Health scores
   F.4 Renewal calendar
   F.5 Churn signals + interventions
```

---

## 6. BIZ_OPS.md - business operations playbooks

Tretí nový dokument. Sekcie:

```
A. Hiring Plan
   A.1 Role priority (jr analyst → CSM → engineer)
   A.2 Compensation philosophy
   A.3 Interview process per role
   A.4 ESOP/equity strategy
   A.5 Remote vs on-site

B. Partner & Reseller Program
   B.1 Marketing agency partner tier
   B.2 Consultant referral program
   B.3 Tech integration partners
   B.4 Revenue split structure

C. Capital Strategy
   C.1 Bootstrap vs raise
   C.2 Angel round target (timing, amount)
   C.3 VC seed considerations
   C.4 Founder dilution acceptable limits

D. Pricing Operations
   D.1 Discount approval matrix
   D.2 Custom pricing scenarios
   D.3 Annual increase strategy
   D.4 Competitive pricing response

E. Klient Success Operations
   E.1 Engagement metrics tracking
   E.2 Quarterly business reviews (QBR) template
   E.3 Klient advisory board structure
   E.4 Case study development process
   E.5 Reference klient management

F. Crisis Management
   F.1 Data breach response
   F.2 Klient escalation procedures
   F.3 PR crisis playbook
   F.4 Tomas absence protocol (vacations, sickness)
```

---

## 7. Vertical expansion - existing architecture analysis

Teraz druhá časť tvojej otázky: **vieme rozšíriť na iné segmenty bez prepisovania všetkého?**

### 7.1 Aké veci sa menia per vertikálku

**Universally needs change:**
- Brand list (10-30 brandov per vertikálka)
- Prompt library (1000+ promptov per vertikálka)
- Facts DB (brand-specific facts)
- Citation domain taxonomy (lifestyle sources vs financial)
- Pricing tiers (banks afford more než SMB eshop)
- Sales positioning (different ICP, different pain)

**Stays same (architecture wins):**
- DB schema (brands, prompts, llm_calls, brand_mentions table)
- LLM client wrappers
- Analysis pipeline (Step 1-6)
- Aggregation SQL templates
- Report generation engine
- 12 AI agents
- Cost tracking
- Quality validation methods

**Score for expansion readiness: 7/10.** Foundation is solid, but need vertical-specific configuration layers.

### 7.2 Architecture refactoring needed

Pre clean expansion, DB schema potrebuje **vertical concept**:

```sql
-- New table
CREATE TABLE verticals (
  id uuid PRIMARY KEY,
  slug text UNIQUE,  -- 'sk-electronics', 'sk-banking', 'cz-electronics'
  name text,
  country text,
  category text,
  language text,
  is_active boolean DEFAULT true,
  config jsonb,  -- vertical-specific config
  created_at timestamp DEFAULT now()
);

-- Existing tables get vertical_id
ALTER TABLE brands ADD COLUMN vertical_id uuid REFERENCES verticals(id);
ALTER TABLE prompts ADD COLUMN vertical_id uuid REFERENCES verticals(id);
ALTER TABLE brand_facts ADD COLUMN vertical_id uuid REFERENCES verticals(id);

-- Citation domain taxonomy can be vertical-specific
CREATE TABLE citation_domains (
  domain text,
  vertical_id uuid REFERENCES verticals(id),
  type text,
  weight numeric,
  PRIMARY KEY (domain, vertical_id)
);
```

**Time to refactor:** 2-3 dni pred Week 1 (alebo refactor v Week 3-4 keď máme 1 vertikálku running).

**Recommendation:** **Refactor v Week 1**. Lacnejšie teraz než migrácia neskôr.

### 7.3 Per-vertical assets needed

Pre každú novú vertikálku potrebujeme:

```
NEW VERTICAL CHECKLIST:

1. Brand list (15-25 brandov) - 4 hodiny research
2. Prompt library (~1000 promptov) - 1-2 týždne (alebo 4 hod s Claude Sonnet)
3. Facts DB (per brand, 8-12 facts) - 4-8 hodín
4. Citation taxonomy (50-100 relevant domains) - 4 hodín
5. Aliases pre brand extraction - 2 hodín
6. Industry sizing data (market size €, AI search penetration) - 4 hodín
7. PR contact list (relevant journalists) - 8 hodín
8. Sample report design adaptation - 4 hodín
9. Sales positioning (ICP, pain points, talk track) - 8 hodín
10. Pricing tier review (per vertical purchasing power) - 2 hodín

TOTAL TIME per new vertical: 40-60 hodín = 1-1.5 týždeň part-time
```

S našou Claude Code automation + templates, **realisticky 30-40 hodín** = **1 týždeň intensive**.

### 7.4 Vertical expansion priority matrix

Ranking proti dvom kritériám:
- **Revenue potential** (market size × willingness to pay)
- **Strategic fit** (similar buyer, similar workflow)

| Vertical | Revenue potential | Strategic fit | Total | Priority |
|---|---|---|---|---|
| **CZ Electronics** (same vertical, new geo) | 8/10 | 10/10 | 18/20 | **#1** |
| **SK Banks** | 9/10 | 7/10 | 16/20 | **#2** |
| **SK Real Estate** | 8/10 | 6/10 | 14/20 | **#3** |
| **SK Insurance** | 7/10 | 7/10 | 14/20 | **#4** |
| **SK Automotive** | 7/10 | 6/10 | 13/20 | **#5** |
| **SK Healthcare/Pharma** | 8/10 | 4/10 | 12/20 | #6 |
| **SK Retail FMCG** | 6/10 | 6/10 | 12/20 | #7 |
| **SK Education** | 5/10 | 5/10 | 10/20 | #8 |
| **SK Hotels/Travel** | 4/10 | 5/10 | 9/20 | #9 |
| **SK Energy** | 3/10 | 4/10 | 7/20 | #10 |
| **SK Telco** | N/A | N/A | **BLOCKED** | Conflict |

### 7.5 Recommended expansion sequence

**Y1 - Phase 1: Focus**
- Q1-Q4: SK Electronics only
- Goal: 30+ Pro klientov, prove model
- Deferring all expansion

**Y2 - Phase 2: Geographic doubling**
- Q1 Y2: Launch CZ Electronics
- Same vertical, new geography
- Lowest expansion cost (similar prompts, just translated)
- Doubles addressable market

**Y2 - Phase 3: Second vertical**
- Q2-Q3 Y2: Launch SK Banks
- Higher-value segment
- Different buyer (CMO of bank)
- Use Y1 learnings about content quality

**Y3 - Phase 4: Selective expansion**
- Q1 Y3: SK Real Estate alebo Insurance
- Based on Y2 success patterns
- One new vertical per quarter max

### 7.6 Hold off on these even if tempting

- **Telco** - Tomas konflikt
- **Travel/Hotels** - too commoditized
- **Energy** - too small market
- **Education** - low budgets
- **Government/Public sector** - long sales cycles, political risk

---

## 8. Bank vertical - deep dive (Y2 prep)

Keďže banky sú #2 priority, pripravím čo špecifického treba.

### 8.1 SK Banking brand list

**Universal banks (~10):**
- Tatra banka
- Slovenská sporiteľňa (Erste)
- VÚB (Intesa Sanpaolo)
- ČSOB
- Prima banka (Penta)
- mBank
- Privatbanka

**Online-first/digital (~5):**
- 365 banka (Mailand-Frankfurt)
- Fio banka
- Air Bank
- Revolut (cross-border but heavy SK use)
- N26 (DE but available)

**Niche/specialized (~5):**
- J&T Banka
- Wüstenrot stavebná sporiteľňa
- Prvá stavebná sporiteľňa
- ZUNO (UniCredit)
- Cetelem (consumer credit)

**Total: ~20 brandov tracked.**

### 8.2 Banking prompt categories needed

```yaml
banking_prompt_categories:
  account_opening: 200      # "kde otvoriť bežný účet zadarmo"
  mortgages: 150            # "najlepší hypotekár v SR"
  loans: 100                # "spotrebný úver do 10k"
  cards: 100                # "kreditka s cashbackom"
  investments: 100          # "investovanie pre začiatočníkov v SR"
  business: 150             # "podnikateľský účet"
  digital_banking: 100      # "najlepšia banková aplikácia"
  insurance_via_bank: 50    # "životné poistenie u banky"
  trust_safety: 100         # "najbezpečnejšia banka v SR"
  comparison: 100           # "Tatra vs SLSP"
  validation: 100           # hallucination, negative
  commercial_intent: 80     # high-intent prompts
  
TOTAL: ~1330 banking prompts needed
```

### 8.3 Banking facts DB structure

Per banka:
- Sídlo + správna rada
- Počet pobočiek + bankomatov
- Mobile app rating + features
- Online services available
- Poplatky (account fees, transactions)
- Hypotéka rates (current)
- Spotrebný úver rates
- Account types available
- Insurance partnerships
- Investment products
- Notable scandals/incidents (compliance critical!)

### 8.4 Banking citation taxonomy

Klúčové domains pre banking AI search:
- **Comparison sites:** financnykompas.sk, financnyhit.sk, mojabanka.sk
- **News:** index.sme.sk, etrend.sk (financial), trend.sk
- **Authority:** NBS.sk (National Bank), DSS regulators
- **Reviews:** mojandroid.sk (apps), webdesignstudio.sk
- **Niche:** finančné poradenstvo blogy

### 8.5 Banking sales positioning differences

vs E-commerce klient, banks ICP shift:

| Aspect | E-commerce | Banking |
|---|---|---|
| **Buyer** | CMO / Digital Manager | CMO + Chief Risk Officer |
| **Concern** | Conversions | Brand trust + compliance |
| **Pricing tolerance** | €1 490/mes Pro | €4 990+/mes Pro (3x) |
| **Sales cycle** | 4-8 týždňov | 4-6 mesiacov |
| **Decision-makers** | 1-2 | 3-5 (CRO, CMO, COO, IT) |
| **Procurement** | Light | Heavy (RFP, contracts) |
| **References needed** | Few | Many (peer bank references) |
| **Customization** | Minimal | Often required |

### 8.6 Banking-specific report sections

Banks need different sections:

- **Compliance Risk Section** - kde AI o nás hovorí nepravdy s reputačným rizikom
- **Trust & Safety Index** - sentiment voči "bezpečnosť" v naších odpovediach
- **Product comparison watch** - ako sa porovnávajú naše hypotéky/úvery v AI
- **Regulatory mentions** - keď AI cituje NBS, sankcie, atď.

### 8.7 Banking pricing tier

Adjusted pricing per regulated industry:
- Watch: €1 490/mes (3x electronics tier)
- Pro: €4 990/mes (3x)
- Enterprise: €14 990/mes (3x)

Same product, premium pricing reflecting higher willingness to pay.

### 8.8 Bank-specific risks

Things to consider:
- **Compliance reporting** - banks may need GDPR + financial regulation
- **Confidentiality** - banks won't tolerate same vendor monitoring competitors visibly
- **PR sensitivity** - if our Industry Report says "Bank X is losing AI war", they'll be pissed
- **References** - need 1 bank logo before others trust us

**Mitigation:** First bank klient gets free year in exchange for becoming reference + case study.

---

## 9. CZ market - lowest-hanging expansion

### 9.1 Why CZ first

- **Same product, different geography** - smallest expansion delta
- **2x market size** (10.5M people vs 5.5M)
- **Higher per-capita IT budgets**
- **CZ klienti zaplatia 1-1.5x SK pricing** (no discount needed)
- **Cross-border brands already covered** (Alza, Datart, Mall)
- **Tomas hovorí česky** zo Slovak background

### 9.2 CZ-specific changes needed

```
CHANGES NEEDED:
1. Prompts translated SK → CZ (~3 dní s Claude Sonnet)
2. CZ-specific brands added (~30 CZ brands)
3. Facts DB extended (CZ brand data)
4. Citation domains taxonomy expanded (zive.cz, ihned.cz, etc.)
5. CZ language detection in extraction prompts
6. Pricing in CZK + EUR options
7. Stripe configuration for CZ market
8. Czech tax compliance (DPH)
```

**Total work:** 1-2 týždne (using existing SK as template).

### 9.3 CZ market sizing

**E-commerce electronics CZ market:**
- Total market: €1.2B+ (vs €580M SK)
- Top brands: Alza.cz, CZC.cz, Mironet.cz, Datart.cz, ETA, Czech-CZ
- AI search penetration: similar to SK (~14%)

**Estimated TAM for Mentivue CZ:** €1.5-2.5M ARR potential.

### 9.4 Recommendation

**Don't launch CZ Year 1.** Risk dilution.

**Launch Q1 Year 2** when:
- Have 30+ SK Pro klients (proven model)
- Have automation operating smoothly
- Have hired help (jr. analyst) for content production

---

## 10. Architecture readiness for multi-vertical

### 10.1 What's already vertical-agnostic ✅

These already work for any vertical:
- DB schema (brands, prompts, llm_calls structure)
- LLM API clients
- Analysis pipeline (extraction, sentiment, citation)
- SQL aggregation queries (parameterized by vertical)
- Report generation engine (template-based)
- Cost tracking
- All 12 AI agents
- Quality validation methods
- Subscription billing infrastructure

### 10.2 What needs refactoring ⚠️

For clean multi-vertical:

**Refactor in Week 2-3:**
```sql
-- Add vertical concept everywhere
CREATE TABLE verticals (...);
ALTER TABLE brands ADD vertical_id;
ALTER TABLE prompts ADD vertical_id;
ALTER TABLE brand_facts ADD vertical_id;

-- Make queries vertical-aware
-- All queries get WHERE vertical_id = $1 filter
```

**Time cost:** 2-3 dní in Week 2-3.
**Benefit:** Zero refactoring later when adding banking, CZ, etc.

### 10.3 What needs vertical-specific per launch

Per new vertical, need:
- Prompts file (1000+ vertical-specific)
- Brands seed data (15-25 brands)
- Facts DB seed (10 facts × brands)
- Citation taxonomy update (50-100 new domains)
- Sales materials (positioning, talk tracks)
- Pricing adjustment if applicable

**No code changes needed for new vertical.** Pure data + content.

### 10.4 Multi-tenancy considerations

If Mentivue goes multi-vertical, **same klient might want multiple verticals**:
- E.g., Slovenská sporiteľňa wants both Banking SK + Insurance SK monitoring
- Bundle pricing opportunity
- Multi-brand within single account architecture needed

**Solution:** Already designed in `subscriptions` table - `brand_ids[]` array supports it.

---

## 11. Summary - prioritized action list

### Pred Week 1 (this week)

1. ✅ Documentation review done (this audit)
2. ⏳ Decide: refactor DB pre vertical concept (2-3 days investment)
3. ⏳ Start: Legal docs through Termly (€10/mes + lawyer review)

### Week 1-2 (foundation build)

1. Build everything per AUTOMATION.md priority
2. Generate email templates pre 12 scenarios (4-6h)
3. Define onboarding form questions (2-3h)
4. Refactor DB with vertical concept (if not done pre-launch)

### Week 3-4 (sales + quality build)

1. Build sales agents per AUTOMATION.md
2. Generate website copy (16-20h)
3. Build wireframes + Next.js components
4. Lawyer review legal docs

### Week 5 (launch prep)

1. FAQ document (30 questions)
2. Support runbook v1
3. Brand identity finalization
4. Security policy + incident response

### Week 6 (public launch)

1. Public launch
2. PR outreach
3. First klient onboardings

### Months 3-12 (Y1 Phase 1-3)

1. Maintain SK Electronics focus
2. Build operational track record
3. Prepare CZ launch materials (Q4)

### Year 2

1. Q1: CZ Electronics launch
2. Q2-Q3: SK Banking launch (pricing 3x)
3. Q4: Decision on third vertical (Real Estate or Insurance)

### Year 3

1. Multi-vertical operating model
2. Series A consideration
3. Team scaling

---

## 12. Recommended new docs to add (final list)

**HIGH PRIORITY - add this week:**

1. **LAUNCH_KIT.md** - email templates, legal, website copy, forms, FAQ, brand kit, support runbook
2. **OPERATIONS.md** - DevOps, monitoring, backup, security, measurement infra
3. **BIZ_OPS.md** - hiring, partnerships, capital strategy, pricing ops, crisis mgmt

**MEDIUM PRIORITY - within Phase 2 (M3-6):**

4. **VERTICAL_PLAYBOOK.md** - template pre adding new verticals (banks, real estate, insurance)
5. **CZ_EXPANSION.md** - specific CZ market plan (Q1 Y2)

**Architecture changes:**

6. Vertical concept v DB (refactor before Week 2)

---

## 13. Final readiness verdict

### Can Tomas start Monday? **YES**

Technická dokumentácia je 9/10 ready. Otvor Claude Code, daj mu PRD + AUTOMATION + ANALYSIS + METRICS + REPORTS + prompts-sk.yaml ako context. Spustite Week 1 task #1.

### Can Tomas launch v 6 týždňoch? **YES, if:**

- ✅ Pridáš LAUNCH_KIT.md content (paralelne s coding)
- ✅ Vyriešiš legal pred public access (Week 5)
- ✅ Máš email templates ready (Week 4)
- ✅ Wireframes + copy ready (Week 4-5)

### Can Tomas scale to multi-vertical? **YES, with minor refactor**

- Add `verticals` table v Week 2-3
- All queries parameterized
- Same code, different data per vertical

### Biggest risks remaining

1. **Legal exposure** ak skip Terms/Privacy/GDPR
2. **Klient onboarding chaos** bez email templates
3. **No website** = can't sell from PDF
4. **Burnout** ak Tomas tries to do everything sequentially

### Biggest opportunities

1. **CZ expansion v Y2 Q1** - lowest-cost geographic doubling
2. **Banking v Y2 Q2-Q3** - 3x pricing tier
3. **Multi-vertical klient packages** - bundle SK Banking + Insurance for Erste/Tatra group

---

## 14. Bottom-line recommendation

**3 things to do this weekend:**

1. **Decide:** refactor DB with vertical concept upfront? (Yes, recommend.)
2. **Start drafting:** LAUNCH_KIT.md with Claude Sonnet (8-12 hours over weekend)
3. **Order:** Termly subscription + budget €1k for lawyer review

**Then Monday:** open Claude Code, full speed ahead on Week 1.

**Total stack at launch (Week 6) will include:**

```
1. PRD.md
2. REPORTS.md
3. METRICS.md
4. ANALYSIS.md
5. VALIDATION.md
6. SALES_VALUE.md
7. SUBSCRIPTION.md
8. PHASED_GTM.md
9. AUTOMATION.md
10. LAUNCH_KIT.md ← NEW
11. OPERATIONS.md ← NEW
12. BIZ_OPS.md ← NEW (less critical, can be Week 3-4)
13. prompts-sk.yaml
14. brands-sk-electronics.yaml ← from current DB
15. facts-db.yaml ← needs creation Week 1
```

**You are ready. Just be honest about the 5 critical gaps and address them parallel to coding.**
