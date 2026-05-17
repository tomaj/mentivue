# Mentivue - Sales Value & Marketing Actionability

**Companion to PRD.md, REPORTS.md, METRICS.md, ANALYSIS.md, VALIDATION.md**

Tento dokument adresuje **najdôležitejšiu otázku celého produktu:**

> "OK, vidím že naša AI visibility je 42%. **A teraz čo? Ako mi to pomôže zarobiť viac peňazí?**"

Bez odpovedí na túto otázku je Mentivue len "drahý dashboard". S nimi je to **business-critical tool ktorý si CMO/Sales obhájia pred CFO**.

---

## 1. Mental model - kto čo s reportom robí

Predtým ako rozšírime reporty, musíme presne pochopiť **kto** ich číta a **prečo**.

### 1.1 Persona 1: CMO / Marketing Director

**Práca:** Riadi brand visibility, content, PR, paid acquisition.

**Tlak na neho:**
- Quartal review: "Why is SoV dropping?"
- Board: "How are we adapting to AI search?"
- CFO: "Justify the €X budget request"

**Čo z reportu potrebuje:**
- Visibility metrics aby reportoval na board
- Strategic context aby vysvetlil "prečo"
- Actionable items aby ukázal pôvodný plán
- **ROI projections** aby obhájil budget

**Cesta k peniazom:**
- Lepšia visibility → viac organic traffic → viac conversions
- Lepšia citation coverage → vyššia brand authority → vyšší CTR
- Lepšia AI presence → menej závislosti na paid ads → nižšie CAC

### 1.2 Persona 2: Sales Director / E-commerce Manager

**Práca:** Riadi konverzie, AOV, kategórie, pricing.

**Tlak:**
- Týždeň review: "Konkrétne čo predávame nedostatočne?"
- Predaj sa nesplnil v segmente X - prečo?
- Akú kampaň spustiť aby sme dohnali Q2 plán?

**Čo z reportu potrebuje:**
- Per-category breakdown
- Specific weak spots aby vedel kde sa dotlačiť
- Competitor moves aby reagoval
- **Predictive signals** aby si predpovedal predaje

**Cesta k peniazom:**
- AI search captures pre-purchase research → ovplyvňuje rozhodnutia
- Brand mention v top-3 LLM = ekvivalent SERP top-3
- Negative sentiment skutočne stráca predaje

### 1.3 Persona 3: Content / SEO Manager (často underestimated)

**Práca:** Píše content, optimalizuje SEO, riadi digital PR.

**Tlak:**
- Aký content tento mesiac priorizovať?
- Ktoré keywords?
- Aké tech publikácie pitchovať?

**Čo potrebuje:**
- Konkrétne **content briefs** s topics
- Konkrétne **keywords s estimated value**
- Konkrétne **publication targets s contact suggestions**
- Konkrétne **citation gaps** to fill

---

## 2. Súčasný gap analysis - report ako "diagnostika" vs "playbook"

### 2.1 Current state - report je "diagnostika"

Súčasné reporty hovoria **WHAT** (čo sa deje):
- "Tvoja SoV je 42.1%"
- "Si #1 v discovery"
- "Strácaš v B2B segment"

Toto je **knowledge transfer**, nie **value creation**.

### 2.2 Target state - report je "playbook"

Hodnota vznikne keď reportujeme aj **WHAT TO DO** (s ROI estimate):

- "Tvoja SoV je 42.1%. Pri current trajectory padá -0.7pp mesačne, čo do Q4 znamená -€340k revenue loss (based on Y conversion math). **Aby si to zastavil, urob X, Y, Z.** Estimated cost: €25k. Estimated upside: €380k. ROI: 15:1."

To je **business case**, nie "research insight".

---

## 3. Pridané sekcie do reportov - blueprint

Tu je čo presne pridávame, kde, a aké data sources potrebujeme.

### 3.1 PER-BRAND AUDIT - 12 nových sekcií

Pôvodný 25-stranový report rozšírime na **35 strán** s týmito sekciami:

#### NEW SECTION A: "Revenue Impact Model" (3 pages)

**Pozícia:** Za pôvodnou sekciou "Your AI Visibility Score" (page 5-7).

**Cieľ:** Premeniť SoV na € odhad.

**Obsah:**

```
REVENUE IMPACT MODEL

📊 ESTIMATED AI SEARCH TRAFFIC

Naše modelové predpoklady (transparentne):
- AI search v SR Q2 2026: ~8% celkového search traffic
- Konvergencia s Google: AI search rastie +12% MoM
- Pre [Alza] - implied AI-influenced visits/mes: ~145,000
- Estimated conversion rate (AI vs traditional): 1.6× (lebo pre-qualified intent)

╔══════════════════════════════════════════════════════════╗
║ AI SEARCH FUNNEL ESTIMATE (Q2 2026)                     ║
║                                                          ║
║ Total AI queries about [Alza] category in SR    ~890k  ║
║ × Your SoV in those queries                      42.1%  ║
║ = Brand-influenced AI conversations              ~375k  ║
║ × Click-through to your site (AI-CTR estimate)   ~32%   ║
║ = Estimated AI-influenced visits                 ~120k  ║
║ × Site conversion rate                           ~2.1%  ║
║ = Estimated AI-influenced orders                 ~2,520 ║
║ × Avg Order Value                                €185   ║
║ = AI-influenced revenue                          €466k  ║
║                                                          ║
║ As % of Q2 total revenue (klient-provided): ~14%        ║
╚══════════════════════════════════════════════════════════╝

⚠️ Tieto čísla sú modeled estimates, nie measured. 
   Confidence interval: ±25%.
   
   Pre presnejšie čísla, klient musí poskytnúť:
   - Google Analytics 4 referrer data
   - Branded search volume trend
   - Direct-load vs referral split
```

**Data sources:**
- Klient form fill při objednávke: priemerný AOV, conversion rate, traffic
- Naše modeled query volume (z prompt library volume × LLM market share)
- Naša SoV measurement
- Industry conversion rate benchmarks (AI search 1.5-2× vs traditional)

**Implementácia:**
- Pri objednávke Per-Brand Audit pridať form s 5 otázkami pre klienta
- Pre brandy bez data použiť industry averages s disclaimer

#### NEW SECTION B: "Lost Revenue from Visibility Gaps" (1 page)

**Pozícia:** Page 8.

**Cieľ:** Quantifikovať cost of doing nothing.

**Obsah:**

```
LOST REVENUE FROM CURRENT GAPS

Top 5 high-volume queries kde si NIE JE mentioned:

QUERY                              VOLUME    CONK MENTION    LOST €
─────────────────────────────────────────────────────────────────
"refurbished iPhone v SR"          ~12k/mes  Refurbed (64%)  €38k/Q
"firemný nákup elektroniky"        ~8k/mes   TPD (51%)       €52k/Q
"audio high-end Slovensko"         ~3k/mes   Sonos (38%)     €18k/Q
"3D tlačiarne v SR"                ~5k/mes   Mironet (44%)   €11k/Q
"Apple Authorized Reseller"        ~7k/mes   iStores (71%)   €24k/Q

TOTAL ESTIMATED QUARTERLY LOSS: ~€143k

Toto sú zákazníci, ktorí ti uniknú k iným eshopom 
priamo kvôli tvojej AI visibility gap.
```

**Data sources:**
- Sekcia 3.8 ANALYSIS.md (Topic Gap query)
- Konkurent-by-konkurent attribution
- Klient AOV × conversion math

#### NEW SECTION C: "Competitive Playbook Reverse Engineering" (3 pages)

**Pozícia:** Page 12-14 (po Competitive Position).

**Cieľ:** Ukázať čo presne robia konkurenti čo im dáva výhodu.

**Obsah:**

```
WHAT'S WORKING FOR YOUR COMPETITORS

🔍 DATART - prečo vyhráva v "Veľké spotrebiče" (+8pp SoV vs ty)

Citation sources favorizujúce Datart (ktoré ťa NECITUJÚ):
1. praktickazena.sk         - 14 articles citing Datart
2. zenskeveci.sk            - 9 articles
3. dobreesposluzby.sk       - 7 articles
4. uvarme.sk                - 5 articles

Pattern: Datart pestuje content v lifestyle/cooking médiách 
ktoré ty ignoruješ.

Content pattern (Datart's edge):
- "Aké spotrebiče potrebuje moderná kuchyňa?" articles
- Co-branded contests s lifestyle bloggerkami
- Recenzie spotrebičov v praktická žena style

🎯 ACTIONABLE STEAL THIS:
1. Pitch praktickazena.sk editor s 3 article ideas
2. Spustiť "Smart Kitchen" content seriálu na blogu
3. Sponzoring Tatiana Pauhofová (top lifestyle influencer SK)
   pre cooking equipment content

Estimated time to close gap: 4-6 mesiacov
Estimated cost: €15-25k content + €10k PR
Estimated SoV gain: +6-8pp v category
Estimated revenue impact: €85-120k Q1 next year
```

**Data sources:**
- Per-competitor citation analysis (Section 5.7 METRICS.md)
- Manual research na top citation sources (kto píše, akým tone)
- Optional: scrape competitor blog headlines (legal/ethical considerations)

**Effort:** Veľká - manual analysis. Možno premium add-on (€500 extra)?

#### NEW SECTION D: "Content Calendar - Next 90 Days" (3 pages)

**Pozícia:** Page 19-21.

**Cieľ:** Konkrétny týždňový plán s deliverables.

**Obsah:**

```
RECOMMENDED CONTENT CALENDAR - Q3 2026

🗓️ WEEK 1-4 (Júl)
Theme: "Refurbished elektronika" deep coverage

PRIORITY 1 ARTICLES (target: top 3 organic results pre keyword):
□ Week 1: "Repasovaný iPhone 17 - oplatí sa? Kompletný guide 2026"
   - Target keywords: "repasovaný iphone", "renovovaný iphone sk"
   - Estimated AI mentions gain: +12 mentions/week
   - Estimated revenue impact: €8-12k/Q
   - Internal links: /apple, /iphone-15, /iphone-16
   
□ Week 2: "Refurbished MacBook - test 5 modelov"
   - Target: "repasovaný macbook"
   - Expected: +8 AI mentions/week
   - Internal links: /macbook, /apple-care
   
□ Week 3: "Repasované zariadenia - kompletný proces v Alze"  
   - Target: "alza repasovaný", branded
   - Expected: +5 branded queries
   - This is YOUR moat - own this topic

□ Week 4: "Eco-friendly nákup elektroniky - refurbished alternative"
   - Target: "ekologický nákup", "udržateľná elektronika"
   - Expected: lateral SoV gain v sustainability segment

📰 PR PITCHES (parallel):
□ Pitch to Živé.sk: "Trend repasovaných iPhonov v SR 2026"
□ Pitch to DSL.sk: "Ako rozoznať dobre repasovaný MacBook"
□ Pitch to Trend: business angle "Eco-friendly e-commerce"

🗓️ WEEK 5-8 (August)
Theme: "Back to School" + Smart Home

[continuation similar pattern...]

🗓️ WEEK 9-12 (September)
Theme: "Pre-Christmas prep" + B2B segment
```

**Data sources:**
- Per-brand topic gap analysis (Section 9 METRICS.md)
- Manual content planning by Claude Sonnet (with brief from Tomas)
- Slovak SEO keyword data (manual lookup, no Ahrefs needed)

**Effort:** Velká - vyžaduje content strategy znalosti. Quality template by mal pomôcť.

#### NEW SECTION E: "PR & Outreach Targets" (2 pages)

**Pozícia:** Page 22-23.

**Cieľ:** Konkrétny zoznam novinárov, blogerov, publikácií s contact suggestions.

**Obsah:**

```
PR & OUTREACH TARGETS - PRIORITIZED LIST

Pre maximálny visibility gain v AI search, zacieľ na 
zdroje ktoré AI najviac cituje pri otázkach o tvojej kategórii.

🥇 TIER A - HIGH IMPACT (cite frequency >20/Q for competitors)

1. ZIVE.SK
   - Topic specialist: Martin Kováč (tech editor)
   - Estimated AI citation power: 4.2× (vs. average source)
   - Currently citing Datart: 18 articles, Alza: 7 articles
   - PITCH IDEA: "Trendy elektroniky 2026 - top 10 inovácií"
   - Suggested approach: email + 1-2 product samples
   - Expected outcome: +5-8 AI mentions Q1

2. DSL.SK
   - Topic specialist: Peter Hudec
   - AI citation power: 3.8×
   - Currently citing Nay: 12, Alza: 9
   - PITCH IDEA: "Audit slovenských eshopov 2026"
   - Approach: cold pitch + reference k Mentivue data
   
3. HEUREKA.SK editorial
   - Editorial calendar: quarterly "Top eshops" feature
   - AI citation power: 5.1× (najsilnejšia)
   - Current Heureka rating: 4.7/5 (you), 4.6/5 (Datart)
   - ACTION: zúčastniť sa "Overený zákazníkmi" certifikácie
   - Investment: €4-8k Q
   - Expected: +6pp SoV v general discovery

🥈 TIER B - MEDIUM IMPACT (cite frequency 5-20/Q)

[5-7 more sources with same detail level]

🥉 TIER C - LATERAL OPPORTUNITIES

[Lifestyle / niche sources unique to your category]
```

**Data sources:**
- Citation source analysis (Section 5 METRICS.md)
- Manual research na editorial structure (kto píše o čom)
- Public information o tech editors v SK médiách

**Effort:** Stredná. Treba mať pre-built database editorov + topics.

#### NEW SECTION F: "AI vs Paid Search - Cost Comparison" (1 page)

**Pozícia:** Page 24.

**Cieľ:** ROI math voči Google Ads.

**Obsah:**

```
AI SEARCH vs PAID SEARCH - COST EQUIVALENCE

Pri kľúčových otázkach, koľko by ťa stál ekvivalentný 
paid traffic?

QUERY: "kde kúpiť iPhone 17 Pro"
─────────────────────────────────────────────────────
Tvoja AI position:                   #2 (sentiment +0.7)
AI conversation share:               18%
Estimated AI visits captured:        ~1,200/mes
Google Ads CPC (SK, this query):     €1.80
Ekvivalentná Google Ads investícia:  €2,160/mes

Bez AI visibility, na ekvivalent traffic by si potreboval 
€2,160 mesačne v paid ads PRE TÚTO JEDNU QUERY.

AGREGÁTNY VÝPOČET pre tvoj brand:
─────────────────────────────────────────────────────
Top 50 high-volume queries × avg position math:

Total AI-driven equivalent visits/mes:       ~14,500
Average Google Ads CPC (weighted):           €1.42
Monthly paid search equivalent value:        €20,590
Quarterly value of current AI presence:      €61,770

Annual estimated value of AI visibility:     €247,080

If you lost 5pp SoV (current trajectory):    -€68k loss
If you gained 5pp SoV (with this report):    +€68k gain
```

**Data sources:**
- AI traffic modeling (Section A above)
- Google Ads CPC data (manual lookup pre 50 top queries, ~2h research)
- Cross-validation with klient's actual ad spend

#### NEW SECTION G: "Predictive Trajectory - Where You'll Be in 90 Days" (1 page)

**Pozícia:** Page 25.

**Cieľ:** Forecasting based on trend extrapolation.

**Obsah:**

```
WHERE YOU'LL BE IN 90 DAYS

Pri current trajectory (extrapolating from last 90 days):

📈 PROJECTED METRICS (no action scenario)

Metric              Current   Projected Q4    Delta
──────────────────────────────────────────────────
SoV (general)       42.1%     39.8%          -2.3pp
Position (avg)      1.8       2.1            +0.3
Sentiment           +0.62     +0.58          -0.04
Mentivue Index      87.3      83.6           -3.7

⚠️ Bez intervencie predpokladáme pokles v všetkých 
kľúčových metrikách. Hlavné drivery:

1. Konkurencia investuje v citation building 
   (sledujeme +12% nárast Datart citations Q-o-Q)
2. Refurbed.sk získava momentum v eco segment
3. ChatGPT trend toward "smaller players" 
   (general AI behavior, diversification)

✨ WITH-ACTION SCENARIO (implementing all opportunities)

Metric              Current   Projected Q4    Delta
──────────────────────────────────────────────────
SoV (general)       42.1%     45.8%          +3.7pp
Position (avg)      1.8       1.6            -0.2
Sentiment           +0.62     +0.71          +0.09
Mentivue Index      87.3      92.1           +4.8

Estimated revenue swing between scenarios: €380-520k Q4
```

**Data sources:**
- Time-series linear regression na current trends
- Anomaly detection insights (Section 12 METRICS.md)
- Sonnet generates scenarios based on opportunity impacts

**Caveat:** Toto je modelled, NIE measured. Disclose limitations.

---

### 3.2 INDUSTRY REPORT - 4 nové sekcie

Pôvodný 40-stranový Industry Report doplníme na **48 strán**:

#### NEW SECTION H: "Industry Revenue Impact Estimate" (2 pages)

Total market AI search value, distributed across top brands.

```
SLOVAK E-COMMERCE ELECTRONICS - AI MARKET SIZE Q2 2026

Total e-commerce electronics market SR (estimate):  €580M/Q
Online share: ~78% = €452M/Q
AI-influenced share (current Q2 2026):    ~14% = €63M/Q

DISTRIBUTION ACROSS TOP 10 BRANDS BY AI SHARE:

Brand          AI Revenue Share    Q2 € Estimate
────────────────────────────────────────────────
Alza           42.1% × 0.6      = €15.9M
Datart         28.4% × 0.6      = €10.7M
Nay            24.7% × 0.6      = €9.3M
Planeo         18.2% × 0.4      = €4.6M
[...]

(Multipliers reflect conversion rate differences)

⚠️ Toto je market-level estimate. Per-brand estimates 
v Per-Brand Audit reportoch.
```

#### NEW SECTION I: "Market Trends & Predictions" (3 pages)

Cross-brand observations a forward-looking insights.

```
6 MARKET TRENDS WE'RE WATCHING

📈 TREND #1: AI search SoV se distributes
Top 3 brand share padá z 78% (Q1) na 73% (Q2).
AI is "discovering" smaller players. Niche brands win.

📈 TREND #2: Heureka.sk stále dominuje citation share
Naprieč 60% AI odpovedí Heureka cited. Single point of failure?

📈 TREND #3: Czech brands invading SK AI search
Alza.cz, Mall.cz citation rate +18% Q-o-Q.
Cross-border AI optimization opportunity.

📈 TREND #4: Refurbished segment exploding
Query volume up 145% Y-o-Y. Top 5 dominant brands 
si chybu uchopiť tento trend.

📈 TREND #5: B2B AI search neexistuje (yet)
TPD, Alza Business citation share <8% v B2B queries.
Education gap on consumer-vs-business AI search.

📈 TREND #6: Sentiment polarization
Top 5 brands +0.6 avg sentiment.
Bottom 10 brands +0.1 avg.
Gap widening. Winner-take-most dynamics emerging.

PREDICTIONS FOR Q3-Q4 2026:
- AI search share v total e-commerce funnel: 18-22%
- Citation diversity will increase (less Heureka dependence)
- Refurbished segment will see new dedicated brand
- B2B AI search wil emerge as Big Trend
```

#### NEW SECTION J: "Cross-Brand Tactical Patterns" (2 pages)

Patterns observed across brands, applicable as universal tactics.

```
6 PATTERNS THAT BRANDS WITH GROWING SoV SHARE

Pattern 1: HEUREKA TOP ESHOP CERTIFICATION
Brands s certifikáciou: +14pp avg SoV
Brands bez: baseline

Pattern 2: WEEKLY TECH BLOG PUBLISHING
Brands publishing 1+ tech articles/week: +9pp SoV YoY
Static blogs: -3pp YoY

Pattern 3: PR ACTIVITY (>4 mentions/Q in tier-1 media)
Active PR brands: +12pp SoV
Quiet brands: -2pp

Pattern 4: AUTHORIZED RESELLER STATUS
Apple Authorized resellers: 2.3× SoV in Apple-related queries
Same applies to Samsung, Bosch, etc.

Pattern 5: LONG-TAIL CONTENT INVESTMENT
Brands s 50+ specific product guides: +18pp SoV
Brands s <10 guides: -4pp

Pattern 6: REVIEW VOLUME ON HEUREKA
Brands s 500+ reviews: 1.8× citation rate
Brands s <100 reviews: 0.5× citation rate
```

#### NEW SECTION K: "Editor's Picks - Where Smart Money Is Going" (1 page)

```
WHERE WE'D INVEST IF WE WERE YOU

Based on cross-brand analysis, 5 highest-conviction bets:

#1 PRESS RELATIONS - 25% CMO budget allocation
ROI: 10-15× over 2 quarters
Investment: €15-25k Q
Expected SoV gain: +6-9pp

#2 SLOVAK TECH BLOG CONTENT - 30% allocation
ROI: 8-12×
Investment: €20-30k Q for 12 articles
Expected SoV gain: +5-8pp

#3 HEUREKA OVERENÝ STATUS - 5% allocation
ROI: 20-25× (highest)
Investment: €4-8k Q
Expected SoV gain: +6-8pp

[continuation...]
```

---

### 3.3 BRAND CARDS (free public) - 1 nová sekcia

Pridáme **"Improvement Opportunities Preview" placeholder section** ako teaser pre paid audit.

```
🚀 IMPROVEMENT OPPORTUNITIES (preview)

We identified 8 specific gaps where Alza could gain SoV.
Get full audit s konkrétnymi action items:

🔒 [LOCKED] B2B segment: +6-8pp SoV potential (€85k Q impact)
🔒 [LOCKED] Refurbished category: +8-12pp potential (€140k Q impact)
🔒 [LOCKED] 5 more specific opportunities...

[ GET FULL AUDIT - €1 990 ] [ LEARN MORE ]
```

---

### 3.4 PULSE NEWSLETTER - new recurring sections

Pridáme 3 new sections do weekly newsletter:

#### "Action of the Week"
Konkrétny tactical recommendation pre toho-týždňového featured brand.

#### "Industry Move of the Week"
Identifikovaný competitive move (např. "Datart spustil novú PR kampaň v Trend.sk").

#### "Revenue Math of the Week"
Jeden konkrétny calculation, ktorý ukáže € value AI visibility.

---

## 4. Data sources potrebné pre tieto sekcie

Sumarizácia čo nové data sources musíme získať / build:

### 4.1 Klient-provided (pri objednávke Per-Brand Audit)

Form fill s týmito otázkami:
- Average Order Value (€)
- Conversion rate (web visits → orders)
- Monthly online revenue ((€))
- Top 3 product categories by revenue
- Current marketing budget (€/mes)
- Top 3 competitive concerns (text)

### 4.2 Industry data (manual research, refreshed quarterly)

Maintain reference data:
- Slovak market size estimates (online elektronika)
- Google Ads CPC pre top 100 queries
- Tech editor contacts (50 names, contact preferences)
- Lifestyle/niche publication map
- Heureka editorial calendar

### 4.3 Time-series data (existujúce, len treba history)

- Brand SoV trends (90+ days)
- Citation patterns over time
- Sentiment shifts
- Competitor moves history

### 4.4 NEW analytical primitives

- Predictive trajectory modeling (linear regression baseline, ML later)
- Counterfactual scenario simulator
- ROI calculator s industry-specific multipliers

---

## 5. ROI calculator framework

Pre každú opportunity v reportoch, štandardizovaný ROI calc:

```python
def calculate_opportunity_roi(opportunity, klient_data):
    # Inputs
    sov_gain_estimate = opportunity["estimated_sov_gain"]  # %pp
    investment = opportunity["estimated_cost"]  # €
    timeline_months = opportunity["timeline_months"]
    
    # Convert SoV gain to € revenue
    monthly_ai_visits = klient_data["monthly_visits"] * AI_TRAFFIC_SHARE
    incremental_visits = monthly_ai_visits * (sov_gain_estimate / 100)
    monthly_incremental_revenue = (
        incremental_visits * 
        klient_data["conversion_rate"] * 
        klient_data["aov"]
    )
    
    # Annual impact
    annual_impact = monthly_incremental_revenue * 12
    
    # ROI
    roi_multiplier = annual_impact / investment if investment > 0 else None
    payback_months = investment / monthly_incremental_revenue if monthly_incremental_revenue > 0 else None
    
    return {
        "annual_revenue_impact": annual_impact,
        "investment_required": investment,
        "roi_multiplier": roi_multiplier,
        "payback_months": payback_months,
        "confidence": opportunity["confidence_level"]  # high/medium/low
    }
```

---

## 6. Sales presentation - jak komunikovat hodnotu

### 6.1 Elevator pitch (15 sec)

**Pred:** "Mentivue meria AI search visibility tvojho brandu."

**Po:** "Mentivue ti ukáže, koľko biznisu strácaš lebo AI ťa nespomína - a presne čo urobiť aby si to zvrátil. Náš priemerný klient identifikuje €200k+ ročného revenue uplift v prvom reporte."

### 6.2 ROI talk track pre sales calls

```
"Pán [CMO], typický CMO investuje €15-25k Q do content + PR + 
SEO snahy o AI visibility. Bez Mentivue diagnostiky to je 
strieľanie naslepo - 60% tých rozpočtov ide na taktiky 
ktoré nemajú impact.

Náš audit za €1 990 ti ukáže:
- Presne kde strácaš €€ tento moment (Lost Revenue from Gaps)
- Konkrétne čo robiť (90-day content + PR calendar)
- ROI math pre každú akciu
- Predictive trajectory s/bez akcie

Priemerne klienti identifikujú €200-400k ročného revenue 
uplift v prvom audite. €1 990 investícia s 100-200× return."
```

### 6.3 Common objections handling

**"Máme vlastnú agentúru / SEO tím."**
→ "Skvelé. Mentivue nie je náhrada agentúry - sme **brief pre vašu agentúru**. Bez nás kreatívne, ale slepé. S nami targeted s data."

**"€1 990 je veľa za PDF."**
→ "€1 990 vs €25k ročne plytváte na nesprávne taktiky bez data. Dovoľte mi ukázať konkrétny príklad v sample reporte."

**"Nemáme rozpočet teraz."**
→ "OK, dovoľte mi poslať vám free Industry Report ako začiatok. Keď uvidíte hodnotu, vrátime sa k auditu."

**"Aké data máte na podporu týchto čísel?"**
→ "Vynikajúca otázka. Stránka methodology je verejne dostupná. Plus všetky čísla v audite sú s confidence intervals. Nie sme magic black box - sme transparent research firm."

---

## 7. Implementačný plán pre tieto rozšírenia

### 7.1 Quick wins (T6 launch ready)

✓ ROI calculator framework (Python class)
✓ Klient form fill pri objednávke
✓ Section A: Revenue Impact Model (template)
✓ Section B: Lost Revenue from Gaps (auto-computed)
✓ Section G: Predictive Trajectory (linear regression baseline)

### 7.2 Medium effort (T8-10)

- Section D: Content Calendar (template + Sonnet generation)
- Section E: PR & Outreach Targets (manual research data)
- Section F: AI vs Paid Search (CPC database)

### 7.3 Heavy lift (post-launch)

- Section C: Competitive Playbook Reverse Engineering (manual research)
- Section I: Market Trends (cross-brand pattern detection)
- Section J: Tactical Patterns (correlational analysis)

---

## 8. Risk a caveats

### 8.1 Riziká pre kredibility

1. **Predikcie sa nevyplnia** - klient nás cituje "you said +€200k, we got +€50k"
2. **Wrong recommendations** - Spuštená kampaň ne-funguje
3. **Industry data outdated** - market size estimates sú off

### 8.2 Mitigation

1. **Vždy confidence intervals**, nie point estimates
2. **Methodology transparent** - klient vidí ako sa to počíta
3. **Quarterly refresh** industry data
4. **Disclaimer:** "Estimates assume average market conditions. Actual results depend on execution quality."

---

## 9. Pricing impact - prečo zvýšiť ceny?

S týmto rozšíreným hodnotovým prísľubom, **pricing možeš zdvihnúť**:

| Original | Updated | Justification |
|---|---|---|
| Per-Brand Audit €1 990 | **€2 990** | 35 vs 25 strán, ROI proof, action plans |
| Subscription €990/mes | **€1 490/mes** | Includes monthly mini-Action Update |
| Competitive Benchmark €3 990 | **€5 990** | Includes Steal Playbook section |

S týmito cenami, Y1 revenue target **€350-450k** namiesto €273k.

---

## 10. Summary - report transformation matrix

| Element | Before | After |
|---|---|---|
| Style | Research report | Strategic playbook |
| Tone | Descriptive | Prescriptive |
| Value prop | "We measure" | "We measure → recommend → quantify" |
| Length | 25 pages | 35 pages |
| Sections | 10 | 15-17 |
| Includes ROI math | No | Yes (every recommendation) |
| Includes timeline | No | Yes (90-day calendar) |
| Includes contacts | No | Yes (PR targets) |
| Predictive layer | No | Yes (trajectory model) |
| Client-specific math | Limited | Extensive (klient data input) |
| Price justified | €1 990 | €2 990 |

**Bottom line:** Súčasné reporty odpovedajú "**čo sa deje s mojou AI visibility**".
Updated reporty odpovedajú "**ako z toho urobím viac peňazí**".

---

## 11. Open questions

- [ ] Klient form fill - povinné, alebo skip-able s industry averages?
- [ ] PR contact database - build it sami, alebo licenz Cision / Muck Rack?
- [ ] Predictive models - linear regression Q1, ARIMA Q3, ML Q4+?
- [ ] Content calendar - generic templates, alebo per-brand customized?
- [ ] ROI guarantees - dare we offer money-back if no measurable impact?
