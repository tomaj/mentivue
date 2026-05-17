# Mentivue - Reports Portfolio & Customer Journey

**Companion to PRD.md and ANALYSIS.md** - definuje aké reporty produkujeme, ako vyzerajú, čo je free vs paid, a ako sa klient k nim dostane.

---

## 1. Produktové portfolio - prehľad

Mentivue vydáva 6 typov reportov, štruktúrovaných ako **pyramída autoritou**:

```
                    [TIER 0 - FREE PUBLIC]
                    ─────────────────────
                    Mentivue Pulse (weekly insights)
                    Mentivue Index Snapshot (live page)
                            ↓
                    [TIER 1 - LEAD MAGNET]
                    ─────────────────────
                    Industry Report - Free Preview (10 strán)
                            ↓
                    [TIER 2 - LOW COMMITMENT]
                    ─────────────────────
                    Industry Report - Full Edition (€299/štvrťrok)
                    Annual Subscription (€999/rok)
                            ↓
                    [TIER 3 - CORE REVENUE]
                    ─────────────────────
                    Per-Brand Audit (€1 990 one-off)
                    Per-Brand Subscription (€990/mes)
                            ↓
                    [TIER 4 - ENTERPRISE]
                    ─────────────────────
                    Competitive Benchmark (€3 990)
                    Custom Research (€1 500-5 000)
```

**Filozofia:** Free obsah buduje autoritu a generuje leadov. Paid obsah konvertuje signál do revenue.

---

## 2. Customer Journey - od neznámeho k platiacemu klientovi

### 2.1 Štandardná cesta (organická akvizícia)

```
1. DISCOVERY (Awareness)
   - Google search "ChatGPT vs Perplexity slovenský eshop"
   - LinkedIn share od kolegu CMO
   - Tlačová správa v Trende/Etrende
   - "Som CMO v Datart, čo na nás hovorí AI?"
                ↓
2. LANDING (mentivue.sk hlavná stránka)
   - Vidí live Index Snapshot (top 10 brandov so SoV)
   - "Wow, sme až 7. - prečo?"
   - Vidí free preview industry report
                ↓
3. LEAD CAPTURE (email gate)
   - Stiahne free 10-stranový preview
   - Zaregistruje sa na weekly newsletter
                ↓
4. NURTURING (Mentivue Pulse newsletter, 6 týždňov)
   - Týždeň 1: weekly insight + AI search trends
   - Týždeň 2: brand spotlight príklad
   - Týždeň 3: methodology deep-dive
   - Týždeň 4: case study (anonymizovaný)
   - Týždeň 5: cenová ponuka full industry report
   - Týždeň 6: invite na Per-Brand Audit
                ↓
5. CONVERSION (kúpa)
   - €299 industry report (low commitment, testuje hodnotu)
   - alebo priamo €1 990 Per-Brand Audit (ak má rozpočet)
                ↓
6. EXPANSION (upsell)
   - Quarterly subscription (€990/mes)
   - Competitive Benchmark voči konkurentom (€3 990)
   - Custom Research projekty
```

### 2.2 Outbound cesta (priame oslovenie)

```
1. Tomas pošle LinkedIn správu CMO
   "Pripravil som vám free krátky snapshot
    ako sa [Brand] zobrazuje v AI search"
              ↓
2. Posiela 1-page PDF (anonymizovaný náhľad,
   ich brand + 2 konkurenti, base metrics)
              ↓
3. Calls/Meeting:
   "Plný report 80+ promptov, 4 LLM,
    90-day action plan = €1 990"
              ↓
4. Conversion alebo follow-up
```

### 2.3 Tlačová cesta (PR amplification)

```
1. Quarterly Mentivue Index vyjde
              ↓
2. PR pitch do 5 médií (Trend, Etrend, Živé, DSL, Forbes SK)
              ↓
3. Médiá publikujú článok s referenciou na Mentivue
              ↓
4. Brandy spomenuté v článku googlujú Mentivue
              ↓
5. Landing → Lead → Conversion
```

---

## 3. Report Catalogue - detailné popisy

### 3.1 TIER 0: Mentivue Index Snapshot (FREE, public, always live)

**URL:** mentivue.sk (homepage hero section)

**Cieľ:** Hook návštevníka, ukázať autoritu na prvý pohľad.

**Obsah:**
- Live dashboard ukazujúci top 10 SK e-shopov by Mentivue Index
- Vždy aktualizované za posledných 30 dní
- Žiadny email gate, žiadny paywall
- Kliknutie na brand otvorí "free 1-page mini profil"

**Mockup:**

```
╔══════════════════════════════════════════════════════════╗
║                  MENTIVUE INDEX                          ║
║          Slovak E-commerce Electronics                   ║
║                    Q2 2026                               ║
║                                                          ║
║  Týždenne meriame ako ChatGPT, Claude, Perplexity        ║
║  a Gemini odpovedajú na 1000+ otázok o slovenských      ║
║  e-shopoch s elektronikou.                              ║
║                                                          ║
║  Aktualizované: 12. mája 2026                           ║
╚══════════════════════════════════════════════════════════╝

┌─────┬──────────────────┬──────────┬──────────┬──────────┐
│ Rank│ Brand            │ Index    │ SoV %    │ Trend    │
├─────┼──────────────────┼──────────┼──────────┼──────────┤
│  1  │ Alza.sk          │  87.3    │  42.1%   │  ↑ +2.1  │
│  2  │ Datart           │  72.8    │  28.4%   │  ↓ -0.8  │
│  3  │ Nay              │  68.2    │  24.7%   │  ↑ +1.4  │
│  4  │ Planeo           │  54.1    │  18.2%   │  ↓ -3.2  │
│  5  │ Andrea Shop      │  48.6    │  15.9%   │  → 0.0   │
│  6  │ Mall.sk          │  41.2    │  12.8%   │  ↑ +0.9  │
│  7  │ Hej.sk           │  38.7    │  11.2%   │  ↓ -1.1  │
│  8  │ Electro World    │  32.4    │   8.9%   │  ↑ +0.4  │
│  9  │ Okay.sk          │  28.1    │   7.3%   │  → 0.0   │
│ 10  │ iStores          │  24.6    │   5.8%   │  ↑ +3.2  │
└─────┴──────────────────┴──────────┴──────────┴──────────┘

[PLACEHOLDER: Bar chart vizualizácia top 10 SoV]

📥 Stiahnite si plný 40-stranový report
   Industry Report Q2 2026 - prvých 10 strán zdarma

[ EMAIL ___________ ] [ STIAHNUŤ ]
```

**Data source:** Section 4.1 z ANALYSIS.md (Mentivue Index query)

**Refresh frequency:** Daily (auto-update z materialized view)

**Cost to produce:** ~$0 (precomputed)

---

### 3.2 TIER 0: Mentivue Brand Cards (FREE, public, click-through)

**URL:** mentivue.sk/brand/[brand-slug]

**Cieľ:** SEO magnet + lead capture per brand. Niekto googli "alza ai search" a pristane priamo na profil.

**Obsah per brand (1 strana):**
- Header s logom + Mentivue Index score + rank
- 30-day SoV trend chart (mini)
- Top 3 sentiment moments (positive/negative quotes z AI odpovedí)
- Top 3 citation sources
- CTA: "Get the full audit for [Brand] - €1 990"

**Mockup:**

```
╔══════════════════════════════════════════════════════════╗
║  [LOGO ALZA]                          Mentivue Index #1  ║
║                                       Score: 87.3        ║
║                                                          ║
║  ALZA.SK - AI Search Visibility Profile                  ║
║  Sledujeme od: 15. apríla 2026                          ║
╚══════════════════════════════════════════════════════════╝

📊 30-DAY VISIBILITY TREND
[PLACEHOLDER: line chart SoV % v čase za 30 dní]

KEY METRICS (last 30 days)
─────────────────────────────────────
Share of Voice:        42.1%
Avg Position:          1.8 (top 2 in most queries)
Avg Sentiment:         +0.6 (positive)
Total Mentions:        1 247 z 2 962 responses

🎯 KDE ALZA DOMINUJE
─────────────────────────────────────
✓ Discovery queries: 67% SoV
✓ Smartphones: 71% SoV
✓ Laptops: 64% SoV

⚠️  KDE ALZA STRÁCA
─────────────────────────────────────
✗ Refurbished elektronika: 12% SoV
✗ B2B nákupy: 8% SoV
✗ Audio high-end: 21% SoV

💬 AI HOVORÍ
─────────────────────────────────────
"Alza.sk patrí medzi najspoľahlivejšie 
slovenské eshopy s rýchlym doručením..."
- ChatGPT, 8. mája 2026

"Pre nákup MacBook by som odporúčal 
Alza alebo iStores, ktoré sú Apple 
Authorized Resellers..."
- Claude, 9. mája 2026

🔗 TOP CITATION SOURCES (AI cituje)
─────────────────────────────────────
1. heureka.sk (43 citácií)
2. zive.sk (28 citácií)
3. dsl.sk (19 citácií)

═══════════════════════════════════════════════════════════
🎯 CHCETE FULL AUDIT PRE ALZA?
   25-stranový report, 90-day action plan, €1 990
   [ ZÍSKAŤ AUDIT ]
═══════════════════════════════════════════════════════════
```

**Data source:** ANALYSIS.md queries 3.1, 3.4, 3.5, 4.2A-D

**Generation:** Server-side rendering z DB, kešované 24h

**SEO Strategy:** 
- 15 brand cards (pre každý tracked brand)
- Title: "Alza.sk AI Search Visibility - Mentivue Index"
- Cieľová keyword: "[brand] ai search", "[brand] AI viditeľnosť"

---

### 3.3 TIER 0: Mentivue Pulse Newsletter (FREE, weekly email)

**Cadence:** Každý štvrtok 09:00

**Cieľ:** Nurturing, autorita building, soft conversion driver.

**Obsah (~600 slov per issue):**
- 1 týždenný insight ("Tento týždeň ChatGPT začal odporúčať Hej.sk - tu je prečo")
- 1 brand spotlight (1 odsek o konkrétnom brande)
- 1 link na fresh blog post
- 1 quote z AI ktorý prekvapil
- Soft CTA: "Hľadáte plný audit? Mám 30 min slot tento týždeň"

**Generation:** Claude Sonnet píše každý týždeň z agregátnych dát (anomaly query 3.9 + sentiment shifts)

**Mockup:**

```
══════════════════════════════════════════════════════════
                  MENTIVUE PULSE
                  Týždeň 19 / 2026
══════════════════════════════════════════════════════════

📌 TÝŽDŇOVÝ INSIGHT
─────────────────────────────────────────────────────────
Hej.sk +18% SoV v Discovery queries

Tento týždeň sa stalo niečo zaujímavé. ChatGPT 
začal Hej.sk spomínať v 71% odpovedí na otázku 
"najlepší eshop na elektroniku v SR" - 
zo 53% pred týždňom.

Prečo? Naša analýza citácií ukázala že Heureka.sk 
publikovala v apríli novú stránku "Top eshopy 2026" 
kde Hej.sk skončil v top 5. ChatGPT to "objavil" 
v týždni 18-19.

Lekcia: Citácie z autoritatívnych zdrojov (heureka, 
zive, dsl) sú teraz najsilnejším signálom pre AI 
search v SR.

📊 BRAND SPOTLIGHT: PLANEO ELEKTRO
─────────────────────────────────────────────────────────
Planeo padá. Z #3 v marci na #4 v máji, -3.2 bodu 
v Mentivue Indexe. Hlavná príčina: AI ich prestáva 
spomínať pri otázkach o veľkých spotrebičoch 
(práčky, chladničky), kde dominuje Nay.

Trend pozorovaný v ChatGPT a Claude, Perplexity 
ho zatiaľ stále zaraďuje do top 3.

💬 CITÁT TÝŽDŇA
─────────────────────────────────────────────────────────
"Mironet.sk je menej známy ale ak hľadáte 
gaming komponenty, často má lepšie ceny 
než Alza alebo Datart."
- Perplexity, 7. mája 2026

(Interesting - prvýkrát sme videli AI explicitne 
recommend Mironet pre gaming use case. Trend k 
sledovaniu.)

📖 NA BLOGU
─────────────────────────────────────────────────────────
"Ako AI search mení e-commerce: 5 zistení 
z prvých 30 dní Mentivue Index"
[ Read more → ]

═══════════════════════════════════════════════════════════
Máte konkrétnu otázku o vašom brande?
Odpovedzte na tento email - prečítam každú správu.

Tomas / Mentivue
═══════════════════════════════════════════════════════════
[ Unsubscribe ]
```

---

### 3.4 TIER 1: Industry Report - Free Preview (10 strán, lead magnet)

**URL:** mentivue.sk/report/q2-2026 (po zadaní emailu)

**Cieľ:** Lead capture + showcase plnej kvality.

**Obsah - 10 strán:**

1. **Cover page** - veľký titulok, dátum, methodology snippet
2. **Executive Summary** (1 strana) - 5 kľúčových zistení
3. **Methodology** (1 strana) - 1000 promptov, 4 LLM, 30 brandov, 90 dní
4. **The Mentivue Index** (2 strany) - top 15 tabuľka + bar chart vizualizácia
5. **Per-LLM Breakdown** (1 strana) - high level "ChatGPT preferuje X, Perplexity Y"
6. **Brand Spotlights** (3 strany) - len top 3 brandy (Alza, Datart, Nay)
7. **CTA page** - "Plná verzia má 40 strán, kúpte si za €299"

**Čo CHÝBA vs full version (= dôvod kúpiť):**
- 7 ďalších brand spotlights (Planeo, Andrea, Mall, Hej, Electro World, iStores, Mironet)
- Citation Source Deep Dive (4 strany)
- Hallucination & Sentiment Report (3 strany)
- 5 Biggest Opportunities (3 strany)
- Strategic Implications (3 strany)
- Appendix s 30 vzorovými promptami a AI odpoveďami (3 strany)

**Mockup (sample Executive Summary):**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              MENTIVUE INDEX                             │
│                                                         │
│   AI Search Visibility Report                           │
│   Slovak E-commerce Electronics                         │
│                                                         │
│   Q2 2026 - FREE PREVIEW (10 of 40 pages)              │
│                                                         │
│   Mentivue.sk                                          │
│   Issued: 12. máj 2026                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

[PAGE 2 - EXECUTIVE SUMMARY]

EXECUTIVE SUMMARY
═════════════════════════════════════════════════════════

Toto je prvá nezávislá analýza AI search visibility 
slovenského e-commerce trhu s elektronikou. Týždenne 
sledujeme 1 000 reálnych nákupných otázok v 4 hlavných 
AI vyhľadávačoch (ChatGPT, Claude, Perplexity, Gemini) 
a meriame, ako sa v odpovediach zobrazujú 15 hlavných 
slovenských e-shopov.

📍 5 KĽÚČOVÝCH ZISTENÍ Q2 2026

1. **Alza.sk dominuje, ale jej náskok klesá.** 
   Alza má 42.1% Share of Voice (vs 47.3% v Q1), 
   čo signalizuje, že AI začína odporúčať diverzifikovanejšie.

2. **Datart vs Nay - battle for #2 sa rozhoduje.** 
   Datart drží #2 (28.4% SoV), ale Nay rastie 
   o +1.4 bodu za štvrťrok a v ChatGPT už predbieha.

3. **Citation source matter more than ever.** 
   Brandy s prítomnosťou na Heureke a v technických 
   médiách (zive.sk, dsl.sk) majú 3.2× vyššiu 
   pravdepodobnosť AI mention než tie bez.

4. **Refurbished a B2B segmenty sú dier v trhu.** 
   Top 5 brandov má dohromady iba 31% SoV v týchto 
   kategóriách. Príležitosť pre niche hráčov 
   (Refurbed.sk, TPD.sk).

5. **Gemini je outsider, ale rastúci.** 
   Aktuálne podiel ~12% AI search traffic v SR, 
   ale rastie najrýchlejšie. CMO by ho nemali ignorovať.

🎯 ČO Z TOHO PLYNIE PRE CMO

Ak vaša značka:
- Nie je v Mentivue Index top 5 → strácate viditeľnosť 
  v AI search a treba konať
- Je v top 5 ale klesá → konkurencia robí niečo 
  čo vy nie
- Nie je vôbec spomenutá → AI o vás nevie 
  (citation gap)

Plný report obsahuje strategic recommendations 
per segment a 5 konkrétnych "biggest opportunities" 
s vyčíslením impactu.

[continued on page 3...]

═════════════════════════════════════════════════════════
        STIAHNUŤ PLNÚ VERZIU - 40 STRÁN - €299
              [ KÚPIŤ FULL REPORT ]
═════════════════════════════════════════════════════════
```

**Data source:** ANALYSIS.md sekcia 4.1, 6.2 (Exec Summary prompt)

**Generation pipeline:**
```
SQL queries → JSON aggregate → Claude Sonnet narrative → 
Markdown → Puppeteer HTML/CSS → PDF → R2 storage → 
Email delivery via Resend
```

**Cost to produce per edition:** ~$15 (Sonnet narrative + PDF rendering)

---

### 3.5 TIER 2: Industry Report - Full Edition (€299/štvrťrok)

**URL:** mentivue.sk/report/q2-2026/full (po platbe)

**Cieľ:** Convert lead capture do prvého reálneho revenue, etablovať platobnú relationship.

**Obsah - 40 strán:**

```
1. COVER PAGE                              (1 page)
2. EXECUTIVE SUMMARY                       (2 pages)
3. METHODOLOGY                             (1 page)
4. THE MENTIVUE INDEX                      (3 pages)
   4.1 Top 15 Leaderboard
   4.2 Composite Score Explanation
   4.3 90-Day Trend Analysis
5. PER-LLM BREAKDOWN                       (4 pages)
   5.1 ChatGPT preferences
   5.2 Claude preferences
   5.3 Perplexity preferences
   5.4 Gemini preferences
6. CITATION SOURCE DEEP DIVE               (4 pages)
   6.1 Top 30 most-cited domains
   6.2 Domain category analysis
   6.3 Brand-to-source affinity matrix
7. HALLUCINATION & SENTIMENT REPORT        (3 pages)
   7.1 Where AI gets facts wrong
   7.2 Sentiment leaderboard
   7.3 Brand reputation risks
8. THE 5 BIGGEST OPPORTUNITIES             (3 pages)
   - Specific, data-backed, actionable
9. BRAND SPOTLIGHTS (top 10)               (10 pages)
   1 page per brand: profile, key metrics, 
   competitive position, recommendations
10. STRATEGIC IMPLICATIONS FOR CMOs        (3 pages)
    10.1 If you're in top 5
    10.2 If you're in top 6-15
    10.3 If you're not mentioned
11. APPENDIX                               (6 pages)
    11.1 30 vzorových promptov s odpoveďami
    11.2 Glossary
    11.3 Methodology details
    11.4 About Mentivue
```

**Mockup - Brand Spotlight page (1 z 10):**

```
┌─────────────────────────────────────────────────────────┐
│  Page 19/40                              ALZA.SK        │
│                                          Mentivue #1    │
└─────────────────────────────────────────────────────────┘

BRAND SPOTLIGHT: ALZA.SK
═════════════════════════════════════════════════════════

🎯 HEADLINE FINDING
─────────────────────────────────────────────────────────
Alza si udržiava pozíciu #1 v slovenskom AI search, 
ale jej dominancia sa eroduje rýchlejšie ako 
očakávaná - SoV padol z 47.3% v Q1 na 42.1% v Q2.

📊 VISIBILITY METRICS (Q2 2026)

[PLACEHOLDER: Time series line chart "Alza SoV 90 dní"]

┌──────────────────────────────────┐
│ Mentivue Index Score    87.3 ✓  │
│ Overall SoV             42.1%   │
│ Avg Position            1.8     │
│ Avg Sentiment           +0.62   │
│ Total Mentions          1 247   │
│ Positive Mentions       73%     │
└──────────────────────────────────┘

🏆 KDE ALZA DOMINUJE
─────────────────────────────────────────────────────────
[PLACEHOLDER: Horizontal bar chart "SoV per category"]

Top 3 kategórie kde má Alza najvyššiu SoV:
1. Discovery queries general:     67%
2. Smartphones (iPhone, Samsung): 71%
3. Laptops a MacBooky:            64%

⚠️ KDE ALZA STRÁCA
─────────────────────────────────────────────────────────
1. Refurbished elektronika:       12% (vs Refurbed: 64%)
2. B2B nákupy:                     8% (vs TPD: 51%)
3. Audio high-end:                21% (vs Sonos.com: 38%)

🔗 TOP CITATION SOURCES (kde AI berie info o Alze)
─────────────────────────────────────────────────────────
[PLACEHOLDER: Donut chart "Citation sources"]

1. heureka.sk             43 citácií
2. zive.sk                28 citácií  
3. dsl.sk                 19 citácií
4. alza.sk (direct)       17 citácií
5. mojandroid.sk          14 citácií

📈 COMPETITIVE POSITION
─────────────────────────────────────────────────────────
Alza vs hlavní konkurenti (SoV last 30 days):

Alza        ████████████████████████ 42.1%
Datart      ████████████████ 28.4%
Nay         █████████████ 24.7%
Planeo      ██████████ 18.2%
Andrea      █████████ 15.9%

🎯 STRATEGIC RECOMMENDATION
─────────────────────────────────────────────────────────
Alza potrebuje zabojovať v 3 oblastiach kde 
stráca pôdu:

1. Posilniť presence v Heureka top eshop listingoch 
   pre refurbished kategóriu
2. Vytvoriť content pre B2B nákupný proces 
   (firemné účty, faktúry)
3. Spolupracovať s zive.sk a dsl.sk na audio 
   high-end content série
```

**Data source:** Sections 4.1, 4.2A-D, 3.7 z ANALYSIS.md + Brand Spotlight prompt (6.3)

**Generation:** Týždenne vygeneruje sa "current" version, kvartálne sa zaarchivuje a urobí cover page update

**Distribution:**
- PDF download po platbe (Stripe)
- Email auto-delivery (Resend)
- Klient dostane aj všetky predošlé edície (4 quarters back)

---

### 3.6 TIER 3: Per-Brand Audit (€1 990 one-off / €990 mes)

**Cieľ:** Hlavný revenue driver. Custom report špecificky pre jeden brand.

**URL:** mentivue.sk/audit (sales page) → po platbe email s linkom na PDF

**Obsah - 25 strán pre konkrétny brand:**

```
1. COVER + EXECUTIVE SUMMARY               (2 pages)
2. YOUR AI VISIBILITY SCORECARD            (2 pages)
   - Mentivue Index Score
   - Rank vs market
   - 90-day trend
   - All 5 dimensions visualized
3. PER-LLM PERFORMANCE BREAKDOWN           (3 pages)
   - How you perform in ChatGPT, Claude, 
     Perplexity, Gemini separately
   - LLM-specific recommendations
4. COMPETITIVE POSITION                    (3 pages)
   - Head-to-head vs 3-5 named competitors
   - Win/Loss matrix per query category
5. TOPIC COVERAGE MAP                      (2 pages)
   - All 6 categories breakdown
   - Where you win, where you're invisible
   - Heatmap visualization
6. CITATION FOOTPRINT ANALYSIS             (2 pages)
   - Top sources AI cites about you
   - Top sources AI cites about competitors
   - Gaps to close
7. SENTIMENT & POSITIONING                 (2 pages)
   - Avg sentiment per category
   - Negative mentions deep dive
   - Reputation risks
8. THE 10 BIGGEST OPPORTUNITIES            (4 pages)
   - Each opportunity:
     * Title + impact level
     * Problem statement
     * Specific action
     * Expected outcome
     * Effort estimate
9. 90-DAY ACTION PLAN                      (3 pages)
   - Week 1-2: Quick wins (3 actions)
   - Week 3-6: Mid-term (3 actions)
   - Week 7-12: Strategic (4 actions)
10. APPENDIX                               (2 pages)
    - Methodology
    - 20 sample prompts where you appear
    - 10 sample prompts where you don't
```

**Mockup - "10 Biggest Opportunities" page:**

```
┌─────────────────────────────────────────────────────────┐
│ Per-Brand Audit: PLANEO ELEKTRO              Page 17/25 │
└─────────────────────────────────────────────────────────┘

THE 10 BIGGEST OPPORTUNITIES FOR PLANEO
═════════════════════════════════════════════════════════

#1 │ HIGH IMPACT │ MEDIUM EFFORT
─────────────────────────────────────────────────────────
🎯 Zaplniť B2B segment - 0% SoV súčasná, 8% addressable

PROBLEM: 
AI search vás nikdy nespomenie pri otázkach typu 
"firemný nákup elektroniky v SR" (testovali sme 
40 promptov, 0/40 mentions). Konkurencia: 
Alza Business (51%), TPD (22%), Datart Business (18%).

ACTION:
Vytvoriť /firmy landing page s týmito sekciami:
- Firemné účty + faktúry s 14-dňovou splatnosťou
- Volumové zľavy od 5 ks
- Dedikovaný account manager
- Case studies z 3-5 zákazníkov (Slovak Telecom, Tatra banka, ...)
Plus PR push na zive.sk a etrend.sk s case study.

EXPECTED OUTCOME:
+6-8% SoV v B2B segment do 90 dní.
Estimated annual revenue impact: €180-240k.

────────────────────────────────────────────

#2 │ HIGH IMPACT │ LOW EFFORT
─────────────────────────────────────────────────────────
🎯 Heureka.sk top eshop status - misses 3 z 5 kategórií

[continuation...]
```

**Data source:** 
- ANALYSIS.md 4.2A-D (per-brand queries)
- ANALYSIS.md 3.8 (Topic Gap)
- ANALYSIS.md 6.4 (Optimization Recommendations prompt)

**Generation pipeline:**
```
1. Order received → Stripe webhook
2. Klient zadá brand do form
3. Worker spustí 80+ brand-specific promptov
   (Tier 1 + Tier 2 LLM, ~600 calls)
4. Aggregation cez ANALYSIS.md queries
5. Claude Sonnet generuje narratívne sekcie
6. Recharts vygeneruje 12-15 grafov
7. Puppeteer rendering do PDF
8. Email delivery + invite call (15 min)
```

**Delivery timeline:** 5-7 pracovných dní od objednávky

**Cost to produce per audit:** ~$25-35 (compute + Sonnet narrative)
**Margin:** €1 990 - €30 = €1 960 (~98%)

**Subscription verzia (€990/mes):**
- Quarterly full refresh (každé 3 mesiace nový plný audit)
- Monthly mini-update (5-page snapshot, top 3 changes, new opportunities)
- Email alerts ak SoV padne >10% week-over-week

---

### 3.7 TIER 4: Competitive Benchmark (€3 990 one-off)

**Cieľ:** Predaj brandu, ktorý chce **explicitne porovnanie voči konkrétnym konkurentom**.

**Trigger:** Klient napíše "Chcem vedieť ako sa porovnávam voči Alze a Datart"

**Obsah - 35 strán:**
- Per-Brand Audit pre primárny brand (25 strán, ako v 3.6)
- + 10 strán dedicated comparison sekcia:
  - Head-to-head SoV chart per category
  - Win/Loss matrix
  - Citation source overlap analysis
  - "Steal these tactics" - čo robia konkurenti lepšie
  - Specific recommendations per competitor

**Mockup - sample comparison page:**

```
┌─────────────────────────────────────────────────────────┐
│ Competitive Benchmark: PLANEO vs ALZA, DATART, NAY      │
│                                              Page 22/35 │
└─────────────────────────────────────────────────────────┘

HEAD-TO-HEAD: PLANEO vs ALZA
═════════════════════════════════════════════════════════

📊 Share of Voice per Category

Category        Planeo    Alza     Gap      Action
───────────────────────────────────────────────────
Discovery       18%       67%      -49pt    HIGH
Smartphones     12%       71%      -59pt    HIGH
Laptops         15%       64%      -49pt    HIGH
TVs             34%       38%      -4pt     LOW
White Goods     41%       29%      +12pt    DEFEND
Audio           22%       45%      -23pt    MEDIUM
Gaming          8%        52%      -44pt    MEDIUM
Refurbished     2%        12%      -10pt    LOW
Accessories     19%       38%      -19pt    MEDIUM
Use Case        24%       55%      -31pt    HIGH

🎯 KEY TAKEAWAYS

✓ WHERE YOU WIN: White Goods (+12pt vs Alza)
  → Defend this. Doubble down on washing machines, 
    refrigerators content.
  
✗ WHERE YOU LOSE BIG: Smartphones, Laptops 
  (-59pt, -49pt)
  → These are Alza's home turf. Don't try to 
    out-compete on iPhone. Pick a specific niche 
    (e.g. "Samsung specialist", "gaming laptops").
  
⚡ STEAL THIS FROM ALZA:
  → Alza je citovaný 43× v heureka.sk vs vy 7×
  → Alza má 12 dedicated landing pages pre top 
    productové kategórie, vy 4
  → Alza investuje do alza.sk/recenzie/ content 
    s ~2 500 user reviews per category

[continuation - vs Datart on next page...]
```

**Data source:** ANALYSIS.md 4.2A-D pre každý brand + custom comparison queries

**Generation:** Manuálne kurátorovaný (4-6 hodín tomas time) + Claude assist

**Delivery:** 7-10 pracovných dní

---

### 3.8 TIER 4: Custom Research (€1 500-5 000 project-based)

**Cieľ:** Bespoke projekty pre špecifické otázky klienta.

**Príklady use cases:**
- "Ako sa zobrazujem v AI keď používateľ pýta o energy efficiency?"
- "Aký vplyv má sezónnosť na moju AI visibility?"
- "Test nového content piece - ako sa zmenil mention rate po 30 dňoch?"
- "Pre-launch analýza - aké sú gaps pre náš nový rad produktov?"

**Delivery:** Custom timeline, custom price (€1 500 entry, €5 000 deep)

**Generation:** Manuálne, custom queries, Tomas time + Claude assist

---

## 4. Routing - Otázky → Reports

Toto je kľúčové. Aké otázky klienta vedú k akým reportom?

### 4.1 Mapa otázok

| Klient sa pýta | Recommend report | Cena |
|---|---|---|
| "Kto je top v slovenskom e-commerce v AI search?" | Industry Report Free Preview | €0 |
| "Mám prehľad celkového trhu pre stratégiu" | Industry Report Full | €299 |
| "Som CMO Alza, čo na nás hovorí AI?" | Per-Brand Audit | €1 990 |
| "Ako sa porovnávam voči Datart a Nay?" | Competitive Benchmark | €3 990 |
| "Sledujem v čase ako sa nám darí" | Per-Brand Subscription | €990/mes |
| "Pred launchom nového rade chcem analýzu" | Custom Research | €1 500-5 000 |
| "Chcem byť v médiách spomenutý" | Tlačová správa s Mentivue Index (free) | €0 |
| "Idem na konferenciu prezentovať" | Industry Report + custom slide deck | €299 + €500 |

### 4.2 Sales discovery questions (pre identifikáciu správneho produktu)

**Q1: Pre koho hľadáte odpoveď?**
- "Pre mňa, chcem všeobecný prehľad" → Industry Report
- "Pre konkrétny brand (môj/klientov)" → Per-Brand Audit alebo Competitive Benchmark

**Q2: Aký je váš rozpočet?**
- €0-500 → Industry Report Full
- €500-2 500 → Per-Brand Audit
- €2 500-5 000 → Competitive Benchmark
- €5 000+ → Custom Research

**Q3: Čo s tým chcete robiť?**
- "Mat prehľad" → Industry Report
- "Konať konkrétne kroky" → Per-Brand Audit (s action plan)
- "Predbehnúť konkurenciu" → Competitive Benchmark
- "Mať dlhodobý monitoring" → Subscription

**Q4: Časový horizont?**
- "Hneď, do týždňa" → Industry Report (instant download)
- "Tento mesiac" → Per-Brand Audit (5-7 dní delivery)
- "Tento kvartál" → Custom Research, Subscription

---

## 5. Data → Report Mapping

Toto je linka medzi ANALYSIS.md queries a finálnym reportom.

### 5.1 Industry Report dáta (40 strán)

| Section | Source query (ANALYSIS.md) | Output type |
|---|---|---|
| Executive Summary | 4.1 + 3.9 (anomaly) | Sonnet narrative + 2 charts |
| Mentivue Index Table | 4.1 | Table + horizontal bar chart |
| Per-LLM Breakdown | 3.6 | 4 mini-tables + 1 heatmap |
| Citation Deep Dive | 3.5 | Top 30 list + treemap |
| Hallucination Report | Step 5 logs | Examples narrative + counts |
| 5 Opportunities | 3.8 (cross-brand) | Sonnet generated insights |
| Brand Spotlights | 4.2A-D × 10 | 10× 1-page templates |
| Strategic Implications | Sonnet on aggregate | Narrative |

### 5.2 Per-Brand Audit dáta (25 strán)

| Section | Source query | Output type |
|---|---|---|
| Scorecard | 4.2A + 3.4 (sentiment) | Big numbers + line chart |
| Per-LLM Performance | 3.6 filtered to brand | 4-column comparison |
| Competitive Position | 4.2B + 3.7 | Horizontal bar + matrix |
| Topic Coverage Map | 3.8 | Heatmap |
| Citation Footprint | 4.2D | Treemap + ranked list |
| Sentiment Analysis | 3.4 filtered | Donut + quote highlights |
| 10 Opportunities | 6.4 (Optimization prompt) | Sonnet narrative per opp |
| 90-day Plan | Sonnet from opportunities | Timeline visualization |

### 5.3 Competitive Benchmark dáta (35 strán)

Per-Brand Audit (25) + 10 strán comparison:

| Section | Source query | Output type |
|---|---|---|
| Head-to-Head Tables | 4.1 filtered to N brands | Tables × per category |
| Win/Loss Matrix | Custom JOIN on brand_mentions | 2D grid |
| Citation Overlap | Set operations on citations | Venn diagram |
| Steal These Tactics | Sonnet on competitor advantages | Narrative |

---

## 6. Production Schedule

### 6.1 Daily (automated)

- Mentivue Index Snapshot refresh (homepage)
- Brand Cards refresh (15 brandov)
- Daily SoV calculation (materialized view)
- Anomaly detection scan

### 6.2 Weekly

- Mentivue Pulse newsletter generation (každý štvrtok)
- Weekly internal report (anomalies, top movers, content ideas)

### 6.3 Monthly

- Per-Brand Subscription mini-updates (5 strán, posiela všetkým aktívnym subs)
- Internal review monthly cost vs revenue

### 6.4 Quarterly

- Industry Report new edition (preview + full)
- Per-Brand Subscription FULL refresh
- PR pitches do médií

### 6.5 On-demand

- Per-Brand Audit (5-7 dní)
- Competitive Benchmark (7-10 dní)
- Custom Research (custom timeline)

---

## 7. Generation Pipeline Detail

### 7.1 Industry Report (kvartálne)

```
Týždeň 13 končiaceho kvartálu:

Day 1 (Monday)
  ├─ Materialized views refresh
  ├─ Quarterly aggregation queries spustené
  ├─ JSON exports do /reports/quarterly-data/
  └─ Quality check (manuálne pozretie čísel)

Day 2 (Tuesday)  
  ├─ Claude Sonnet: Executive Summary draft
  ├─ Claude Sonnet: 5 Opportunities draft  
  ├─ Claude Sonnet: Strategic Implications draft
  └─ Manuálna review + edits

Day 3 (Wednesday)
  ├─ Brand Spotlights × 10 (parallel Claude calls)
  ├─ Per-LLM Breakdown narrative
  └─ Hallucination examples curation

Day 4 (Thursday)
  ├─ Recharts vizualizácie generated server-side
  ├─ Puppeteer HTML/CSS template populated
  ├─ PDF rendering
  └─ Internal QA

Day 5 (Friday)
  ├─ Final design pass
  ├─ Upload preview (10 pages) na mentivue.sk
  ├─ Upload full PDF na R2
  ├─ Update Stripe products
  └─ Email blast subscribers + free leads

Day 6-7 (Weekend)
  └─ PR pitches do 5 médií
```

### 7.2 Per-Brand Audit (on-demand)

```
T+0h:  Klient platí cez Stripe checkout
T+0h:  Webhook triggered, klient dostáva form 
        "ktorý brand auditujete?"

T+12h: Klient vyplní form (brand + 3 named competitors)
T+12h: Worker queues 80 brand-specific promptov

T+24h: Collection complete (overnight cez Tier 1+2 LLM)
T+24h: Analysis pipeline kompletná

T+25h: Custom queries pre brand spustené
T+26h: Claude Sonnet píše narratívne sekcie
T+28h: Recharts grafy generated
T+30h: PDF render

T+32h: Internal review (Tomas 30 min)
T+36h: Final PDF + invite na 15 min call

T+5-7 days max: Email delivery + Calendly link
```

---

## 8. Pricing strategy + Bundling

### 8.1 Core pricing

| Product | Price | Margin | Target volume Y1 |
|---|---|---|---|
| Industry Report Free | €0 | -€15 (lead cost) | 500 downloads/Q |
| Industry Report Full | €299 | ~98% | 30 sales/Q |
| Annual Industry Sub | €999 | ~99% | 10 subs |
| Per-Brand Audit (one-off) | €1 990 | ~98% | 2-3/mes |
| Per-Brand Audit (sub) | €990/mes | ~99% | 5-10 subs |
| Competitive Benchmark | €3 990 | ~95% | 1-2/Q |
| Custom Research | €1 500-5 000 | varies | 1/Q |

### 8.2 Bundles

**Starter Bundle (€2 290):**
- Industry Report Full
- Per-Brand Audit (one-off)
- Save €99 vs separate

**Pro Bundle (€11 990/year):**
- Per-Brand Audit Subscription (€990 × 12 = €11 880)
- + 1 Custom Research credit (€1 500 value)
- Save €1 390

**Enterprise Bundle (€19 990/year):**
- Per-Brand Audit Subscription
- + 2 Competitive Benchmarks (€7 980 value)
- + 2 Custom Research credits
- Save €3 870

### 8.3 Year 1 revenue model

Konservatívny scenár:

| Q | Industry €299 | Audits €1990 | Subs €990/mes | Bench €3990 | Total Q |
|---|---|---|---|---|---|
| Q3 26 (launch) | 30 × €299 = €8 970 | 6 × €1 990 = €11 940 | 2 × €990 × 1 = €1 980 | 1 × €3 990 = €3 990 | **€26 880** |
| Q4 26 | 40 × €299 = €11 960 | 10 × €1 990 = €19 900 | 6 × €990 × 3 = €17 820 | 2 × €3 990 = €7 980 | **€57 660** |
| Q1 27 | 50 × €299 = €14 950 | 12 × €1 990 = €23 880 | 10 × €990 × 3 = €29 700 | 3 × €3 990 = €11 970 | **€80 500** |
| Q2 27 | 60 × €299 = €17 940 | 15 × €1 990 = €29 850 | 15 × €990 × 3 = €44 550 | 4 × €3 990 = €15 960 | **€108 300** |
| **Y1 Total** | **€53 820** | **€85 570** | **€94 050** | **€39 900** | **€273 340** |

Náklady: ~€500/mes compute × 12 = €6 000. Hosting/tooling ~€2 000. Tomas time: opportunity cost.

**Y1 gross profit estimate: ~€260 000.**

---

## 9. Open questions (decisions pending)

- [ ] Industry Report cadence: kvartálne určite, ale pridať aj monthly mini-report (€99) ako entry point?
- [ ] Brand Cards: má každý brand vlastný card alebo iba top 15? (SEO trade-off)
- [ ] Per-Brand Audit subscription: monthly mini-update má byť 5 strán alebo plný re-run?
- [ ] White label: predávame Mentivue reporty marketingovým agentúram pod ich brandom za premium? (V2)
- [ ] CZ expansion: kedy presne, ako financovať predĺženie compute na 2× dáta?
- [ ] Free tier limit: Mentivue Index Snapshot je vždy free aj long-term? (proti tomu: konkurenčné info)
- [ ] Brand cards CTA: "Request audit" vs "Buy audit" - test A/B
- [ ] Email gating: ktoré obsahy email-gated, ktoré úplne free?

---

## 10. Success metrics

Per quarter sleduj:

**Funnel metrics:**
- Mentivue.sk unique visitors
- Email captures (lead pool)
- Newsletter open rate (target: >40%)
- Newsletter CTR (target: >5%)

**Conversion metrics:**
- Free → Industry Report Full conversion (target: >5%)
- Industry → Per-Brand Audit conversion (target: >10%)
- Audit → Subscription conversion (target: >30%)

**Revenue metrics:**
- MRR (Monthly Recurring Revenue) growth
- ARR (Annual Recurring Revenue)
- Average revenue per account (ARPA)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)

**Product metrics:**
- Report NPS (post-delivery survey, target: >50)
- Brand cards SEO traffic (organic search)
- Time to deliver Per-Brand Audit (target: <5 days)
