# Mentivue - Analysis Pipeline & Queries

**Companion to PRD.md** - detailný popis Layer 2 (Analysis) a Layer 3 (Aggregation).

---

## 1. LLM provider stratégia - asymetrický mix

### 1.1 Tier 1 (denne, ~150 promptov × 2 LLMs = 300 calls/deň)

**Prečo iba 2 LLM denne:** 4 LLM × 150 = 600 calls/deň je zbytočne veľa pri dennej kadencii. Pre trend tracking stačia 2 dominantní hráči denne.

**Tier 1 modely:**
- **Anthropic Claude Haiku 4.5** - $1.0/$5.0 per MTok, +$0.005/search call
- **Perplexity Sonar** - $1.0/$1.0 per MTok, search inkludovaný v request fee

Daily náklad: ~150 × 2 × $0.025 = **~$7.50/deň = ~$225/mes**

### 1.2 Tier 2 (týždenne, ~630 promptov × 4 LLMs = 2520 calls/týždeň)

Plný coverage 4 LLMs ale iba 1× týždenne.

**Tier 2 modely (pridávame k Tier 1):**
- **OpenAI GPT-5.4 mini** - $0.75/$4.50 per MTok, search built-in
- **Google Gemini 3.1 Flash-Lite + Grounding 3.x** - $0.10/$0.40 + $0.014/query

Weekly náklad: ~630 × 4 × $0.020 = **~$50/týždeň = ~$215/mes**

### 1.3 Tier 3 (mesačne, ~220 promptov × 4 LLMs = 880 calls/mes)

Long-tail coverage, plné 4 LLM 1× za mesiac.

Monthly náklad: ~220 × 4 × $0.020 = **~$18/mes**

### 1.4 Analytical layer (Claude Haiku - sekundárna úloha)

Pre brand extraction, sentiment, citation parsing.

Náklad: ~1500-3000 analytical calls/deň × $0.003 = **~$15/deň = ~$450/mes**

### 1.5 Celkový mesačný compute budget

| Vrstva | Mesačný náklad |
|---|---|
| Tier 1 (daily collection) | $225 |
| Tier 2 (weekly collection) | $215 |
| Tier 3 (monthly collection) | $18 |
| Analytical layer (extraction, sentiment, scoring) | $450 |
| Report generation (Sonnet pre narratívu, 1× týždenne) | $30 |
| **Total raw** | **~$940/mes** |
| S Batch API (50% off na non-realtime) | **~$520/mes** |
| S Batch API + prompt caching (~25% off na inputs) | **~$420/mes** |

**Realistic monthly cost target: $400-500/mes pre 1000 promptov.**

To je v line s tým čo sme dohodli. Gemini v Tier 2 pridáva ~$50/mes (~10% celkového bilu), čo je akceptovateľné pre completeness metodológie.

---

## 2. Layer 2: Analysis Pipeline

### 2.1 Architektúra

```
Raw Response (PostgreSQL)
        ↓
[Trigger: new row in raw_responses]
        ↓
┌──────────────────────────────────────┐
│  Analysis Worker (BullMQ job)        │
│  ─────────────────────────────────── │
│  Step 1: Brand Extraction (Claude)   │
│  Step 2: Sentiment per Brand (Claude)│
│  Step 3: Citation Parsing (regex+LLM)│
│  Step 4: Quality Scoring (Claude)    │
│  Step 5: Hallucination Detection     │
└──────────────────────────────────────┘
        ↓
Insert into:
- brand_mentions (per detected brand)
- response_quality (per llm_call)
- hallucination_flags (per claim)
```

Každý krok je samostatná Claude Haiku call (batch friendly). Možno 2-3 kroky kombinovať do jedného promptu pre cost optimization (-30%).

### 2.2 Step 1: Brand Extraction Prompt

**Cieľ:** Z LLM odpovede vytiahnuť všetky spomenuté brandy s pozíciou a kontextom.

```typescript
const BRAND_EXTRACTION_PROMPT = `
Si analytik AI search visibility. Tvojou úlohou je extraktovať brand mentions
z odpovede AI asistenta na otázku o slovenských e-shopoch s elektronikou.

TRACKED BRANDS (s aliases):
- Alza: alza, alza.sk, alza.cz, alza shop
- Datart: datart, datart.sk, datart.cz
- Nay: nay, nay.sk, nay elektrodom
- Planeo: planeo, planeo elektro, planeo.sk
- Andrea Shop: andrea, andrea shop, andreashop.sk
- Hej.sk: hej, hej.sk, hejsk
- Okay: okay, okay.sk, okay elektro
- Mall: mall, mall.sk, mall.cz, mall group
- Electro World: electro world, electroworld, ew.sk
- iStores: istores, istores.sk
- Mironet: mironet, mironet.sk, mironet.cz
- Megapixel: megapixel, megapixel.sk
- TPD: tpd, tpd.sk
- Faxcopy: faxcopy, faxcopy.sk
- Notebooky.sk: notebooky, notebooky.sk
- Amazon: amazon, amazon.de, amazon.com
- AliExpress: aliexpress, ali, ali express

USER PROMPT bol:
"""
{prompt_text}
"""

AI ODPOVEĎ bola:
"""
{response_text}
"""

Tvoja úloha:
1. Identifikuj všetky tracked brandy spomenuté v odpovedi
2. Pre každý brand určí:
   - position: poradové číslo (1 = prvý spomenutý, 2 = druhý, atď.)
   - context: krátky úryvok textu kde sa brand spomína (max 200 znakov)
   - mention_strength: "primary" (hlavné odporúčanie), "secondary" (vedľajšie),
     alebo "passing" (iba mimochodom spomenutý)

Vráť VÝLUČNE JSON v tomto formáte (žiadny text okolo):
{
  "brands_mentioned": [
    {
      "brand_id": "alza",
      "position": 1,
      "context": "...",
      "mention_strength": "primary"
    }
  ],
  "untracked_brands_seen": ["nejaký_neznámy_obchod"],
  "language_detected": "sk" | "cz" | "en" | "mixed",
  "refused_to_answer": false
}

Ak AI odmietla odpovedať alebo dala nerelevantný output, nastav refused_to_answer: true.
`;
```

**Cost per call:** input ~1500 tokens + output ~300 tokens = $0.003

**Frekvencia:** každá nová raw_response (= ~150-600/deň podľa tieru)

### 2.3 Step 2: Sentiment Analysis Prompt

**Cieľ:** Per brand, určiť sentiment ako AI o ňom hovorí.

```typescript
const SENTIMENT_PROMPT = `
Analyzuj sentiment AI odpovede voči konkrétnym brandom.

AI ODPOVEĎ:
"""
{response_text}
"""

EXTRAHOVANÉ BRANDY a ich kontext:
{brands_with_context_json}

Pre každý brand urči:
- sentiment: "positive" | "neutral" | "negative"
- sentiment_score: -1.0 (very negative) až 1.0 (very positive)
- reasoning: krátka justifikácia (max 100 znakov)

Pravidlá:
- "najlepší", "odporúčam", "spoľahlivý", "kvalitný" → positive (0.5-1.0)
- "ponúka", "predáva", "patrí medzi" → neutral (~0.0)
- "drahý", "pomalý", "problémy", "nespoľahlivý" → negative (-1.0 to -0.3)
- Ak je brand iba spomenutý v zozname bez kvalifikácie → neutral

Vráť JSON:
{
  "sentiments": [
    {
      "brand_id": "alza",
      "sentiment": "positive",
      "sentiment_score": 0.7,
      "reasoning": "AI ho označila ako najlepší pre rýchle doručenie"
    }
  ]
}
`;
```

**Cost per call:** $0.002

### 2.4 Step 3: Citation Parsing

**Hybrid approach:** Regex pre URL extraction + Claude pre kontext.

```typescript
// Regex pre URL detection
const URL_REGEX = /https?:\/\/[^\s\]\)]+/g;

// Claude prompt pre context per citation
const CITATION_CONTEXT_PROMPT = `
Pre každú URL v zozname identifikuj:
- domain (napr. "alza.sk")
- citation_type: "official" (oficiálny brand site), "review" (recenzia), 
  "comparison" (porovnávač), "news" (správa), "forum" (diskusia), "other"
- relevance_score: 0-1, ako relevantná je citácia k téme otázky
- supports_brand_id: ktorý brand citácia podporuje (ak applicable)

URLs:
{urls_json}

CONTEXT (odpoveď AI):
"""
{response_text}
"""

Vráť JSON pole citations.
`;
```

**Citation domains taxonomy (precomputed):**

```typescript
const CITATION_DOMAINS = {
  // Oficiálne brand sites (high authority pre daný brand)
  "alza.sk": { type: "official", brand: "alza", weight: 1.0 },
  "datart.sk": { type: "official", brand: "datart", weight: 1.0 },
  "nay.sk": { type: "official", brand: "nay", weight: 1.0 },
  // ... ostatné brandy
  
  // Slovenské cena/review weby
  "heureka.sk": { type: "comparison", weight: 0.8 },
  "najnakup.sk": { type: "comparison", weight: 0.7 },
  "pricemania.sk": { type: "comparison", weight: 0.7 },
  
  // Tech média
  "zive.sk": { type: "news", weight: 0.6 },
  "dsl.sk": { type: "news", weight: 0.6 },
  "etrend.sk": { type: "news", weight: 0.5 },
  "trend.sk": { type: "news", weight: 0.5 },
  "techbox.dennikn.sk": { type: "news", weight: 0.6 },
  "mojandroid.sk": { type: "news", weight: 0.6 },
  
  // CZ ekvivalenty
  "alza.cz": { type: "official", brand: "alza", weight: 0.7 },
  "zive.cz": { type: "news", weight: 0.5 },
  
  // Forums
  "reddit.com": { type: "forum", weight: 0.4 },
  "modrykonik.sk": { type: "forum", weight: 0.5 },
};
```

### 2.5 Step 4: Quality Scoring Prompt

Hodnotí kvalitu samotnej AI odpovede.

```typescript
const QUALITY_PROMPT = `
Hodnotíš kvalitu AI odpovede na zákaznícku otázku o slovenských e-shopoch.

OTÁZKA: {prompt_text}
AI ODPOVEĎ: {response_text}

Skóruj 0-10 podľa kritérií:

1. Relevance (0-3 body): rieši odpoveď otázku?
   - 0: úplne off-topic
   - 1: čiastočne relevantná
   - 2: relevantná ale povrchná
   - 3: presne odpovedá

2. Specificity (0-3 body): konkrétne brandy/produkty/ceny?
   - 0: žiadne konkrétnosti, iba generické rady
   - 1: spomenutý 1 brand
   - 2: spomenuté 2-4 brandy
   - 3: spomenuté 5+ brandy s kontextom

3. Citation quality (0-2 body):
   - 0: žiadne zdroje
   - 1: 1-2 zdroje
   - 2: 3+ zdrojov, z toho aspoň 1 autoritatívny

4. Language correctness (0-2 body):
   - 0: nesprávny jazyk (česká/anglická namiesto SK)
   - 1: SK ale s gramatickými chybami
   - 2: korektná slovenčina

REFUSAL FLAG: ak AI odmietla odpovedať alebo dala "nemôžem ti pomôcť" odpoveď,
quality_score = 0 a refused = true.

Vráť JSON:
{
  "quality_score": 8.5,
  "relevance": 3,
  "specificity": 3,
  "citation_quality": 1,
  "language_correctness": 2,
  "refused": false,
  "reasoning": "krátky komentár max 150 znakov"
}
`;
```

### 2.6 Step 5: Hallucination Detection

Najnáročnejšia časť. Detekuje keď AI tvrdí o brande nepravdu.

**Strategia:**
1. Pred-pripravená "facts database" pre top 15 brandov (manuálne kurátorované)
2. Claude porovnáva claims v AI odpovedi s facts DB
3. Flagne kontradikčné claims

**Facts DB structure:**

```typescript
const BRAND_FACTS = {
  "alza": {
    headquarters: "Praha, CZ (sklady v SK)",
    founded: 1994,
    apple_authorized: true,
    physical_stores_sk: ["Bratislava", "Košice", "Žilina", "Banská Bystrica"],
    delivery_options: ["kuriér", "AlzaBox", "osobný odber"],
    payment_methods: ["karta", "prevod", "splátky", "kupón"],
    warranty_years: 2,
    return_period_days: 14,
  },
  "datart": {
    headquarters: "Praha, CZ",
    founded: 2000,
    apple_authorized: true,
    physical_stores_sk: ["Bratislava", "Košice", "Žilina", "Nitra"],
    delivery_options: ["kuriér", "osobný odber v predajni"],
    warranty_years: 2,
    return_period_days: 14,
  },
  // ... ostatné brandy
};

const HALLUCINATION_PROMPT = `
Analyzuj AI odpoveď a nájdi tvrdenia o konkrétnych brandoch, ktoré sú
faktografické (cena, lokácia, služby, vlastnosti).

AI ODPOVEĎ:
"""
{response_text}
"""

VERIFIED FACTS pre spomenuté brandy:
{facts_json}

Pre každé faktografické tvrdenie v odpovedi:
- claim: presné znenie tvrdenia z odpovede
- brand: ktorého brandu sa týka
- claim_type: "price" | "location" | "service" | "feature" | "company_info"
- contradicts_facts: true ak je v rozpore s verified facts
- contradiction: ak true, vysvetli ako (max 100 znakov)
- confidence: 0-1, ako si istý že je to hallucination (vs. naša DB je neaktuálna)

Vráť JSON pole claims. Ak žiadne faktografické claims, vráť prázdne pole.
`;
```

**Cost per call:** $0.005 (vyšší pretože context je väčší)

**Frekvencia:** iba pre Tier 1 (denné) a high-priority Tier 2 (~50% weekly). Mesačné nemajú hallucination check.

### 2.7 Kombinovaný Analysis Prompt (cost optimization)

Pre zníženie nákladov môžeš Step 1-2-4 (extraction + sentiment + quality) skombinovať do **jedného Claude call**:

```typescript
const COMBINED_ANALYSIS_PROMPT = `
Si analytik AI search visibility. Analyzuj odpoveď AI a vráť kompletnú analýzu.

OTÁZKA: {prompt_text}
AI ODPOVEĎ: {response_text}
TRACKED BRANDS: {brand_list_json}

Vráť JSON:
{
  "brands_mentioned": [...],     // Step 1
  "sentiments": [...],            // Step 2
  "quality_score": 8.5,           // Step 4
  "language_detected": "sk",
  "refused_to_answer": false,
  "citation_urls": ["https://..."]  // raw URLs, parse later
}
`;
```

**Cost:** ~$0.005 per call (kombinovaný namiesto ~$0.010 v 3 samostatných).

**Recommendation:** Začni s kombinovaným promptom. Ak pri quality testing zistíš že je menej presný, rozdeľ späť.

---

## 3. Layer 3: Aggregation Queries

### 3.1 Share of Voice (SoV) - core metric

**Definícia:** % responses v ktorých sa brand spomína, z celkového počtu responses pre danú kategóriu/dimenziu.

**Daily SoV per brand per provider:**

```sql
-- SoV per brand za včerajší deň, per LLM provider
SELECT
  b.name AS brand_name,
  lc.provider AS llm_provider,
  COUNT(DISTINCT lc.id) AS total_responses,
  COUNT(DISTINCT bm.raw_response_id) AS responses_with_mention,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
    2
  ) AS share_of_voice_pct
FROM llm_calls lc
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
CROSS JOIN brands b
WHERE lc.created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND lc.created_at < CURRENT_DATE
  AND lc.status = 'success'
  AND b.country = 'SK'
GROUP BY b.id, b.name, lc.provider
ORDER BY share_of_voice_pct DESC;
```

### 3.2 SoV trend (week over week)

```sql
-- Týždenný trend SoV pre top 10 brandov
WITH weekly_sov AS (
  SELECT
    DATE_TRUNC('week', lc.created_at) AS week,
    b.id AS brand_id,
    b.name AS brand_name,
    COUNT(DISTINCT lc.id) AS total_responses,
    COUNT(DISTINCT bm.raw_response_id) AS mentions,
    ROUND(
      COUNT(DISTINCT bm.raw_response_id)::numeric / 
      NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
      2
    ) AS sov_pct
  FROM llm_calls lc
  LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
  LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id
  CROSS JOIN brands b
  WHERE lc.created_at >= NOW() - INTERVAL '12 weeks'
    AND lc.status = 'success'
    AND b.country = 'SK'
  GROUP BY DATE_TRUNC('week', lc.created_at), b.id, b.name
)
SELECT
  brand_name,
  week,
  sov_pct,
  LAG(sov_pct) OVER (PARTITION BY brand_id ORDER BY week) AS prev_week_sov,
  sov_pct - LAG(sov_pct) OVER (PARTITION BY brand_id ORDER BY week) AS wow_change_pct
FROM weekly_sov
WHERE brand_id IN (
  SELECT brand_id FROM weekly_sov 
  WHERE week = DATE_TRUNC('week', NOW())
  ORDER BY sov_pct DESC LIMIT 10
)
ORDER BY brand_name, week;
```

### 3.3 Position Score (weighted by mention position)

Brand spomenutý prvý má väčšiu váhu než spomenutý piaty.

```sql
-- Average position score per brand (lower = better)
SELECT
  b.name AS brand_name,
  COUNT(bm.id) AS mention_count,
  ROUND(AVG(bm.position)::numeric, 2) AS avg_position,
  -- Weighted score: 1/position with cap
  ROUND(AVG(1.0 / GREATEST(bm.position, 1))::numeric, 3) AS position_score
FROM brand_mentions bm
JOIN brands b ON b.id = bm.brand_id
JOIN raw_responses rr ON rr.id = bm.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '7 days'
GROUP BY b.id, b.name
ORDER BY position_score DESC;
```

### 3.4 Sentiment Score per Brand

```sql
SELECT
  b.name AS brand_name,
  COUNT(bm.id) AS total_mentions,
  ROUND(AVG(bm.sentiment_score)::numeric, 3) AS avg_sentiment,
  COUNT(CASE WHEN bm.sentiment = 'positive' THEN 1 END) AS positive_count,
  COUNT(CASE WHEN bm.sentiment = 'neutral' THEN 1 END) AS neutral_count,
  COUNT(CASE WHEN bm.sentiment = 'negative' THEN 1 END) AS negative_count,
  ROUND(
    COUNT(CASE WHEN bm.sentiment = 'positive' THEN 1 END)::numeric / 
    NULLIF(COUNT(bm.id), 0) * 100,
    2
  ) AS positive_pct
FROM brand_mentions bm
JOIN brands b ON b.id = bm.brand_id
JOIN raw_responses rr ON rr.id = bm.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name
ORDER BY avg_sentiment DESC;
```

### 3.5 Citation Source Analysis

```sql
-- Top citované domény za posledných 30 dní
WITH citation_data AS (
  SELECT
    rr.id AS response_id,
    jsonb_array_elements(rr.citations) AS citation
  FROM raw_responses rr
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE lc.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  citation->>'domain' AS domain,
  COUNT(*) AS citation_count,
  ROUND(
    COUNT(*)::numeric / (SELECT COUNT(*) FROM citation_data) * 100,
    2
  ) AS citation_share_pct
FROM citation_data
WHERE citation->>'domain' IS NOT NULL
GROUP BY citation->>'domain'
ORDER BY citation_count DESC
LIMIT 20;
```

### 3.6 Per-LLM Brand Preference

```sql
-- Ktorý LLM preferuje ktorého brand
SELECT
  lc.provider AS llm_provider,
  b.name AS brand_name,
  COUNT(bm.id) AS mention_count,
  ROUND(AVG(bm.sentiment_score)::numeric, 2) AS avg_sentiment,
  ROUND(AVG(bm.position)::numeric, 2) AS avg_position
FROM llm_calls lc
JOIN raw_responses rr ON rr.llm_call_id = lc.id
JOIN brand_mentions bm ON bm.raw_response_id = rr.id
JOIN brands b ON b.id = bm.brand_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY lc.provider, b.id, b.name
ORDER BY lc.provider, mention_count DESC;
```

### 3.7 Category-specific SoV

```sql
-- SoV per kategória promptu
SELECT
  p.category AS prompt_category,
  b.name AS brand_name,
  COUNT(DISTINCT bm.raw_response_id) AS mentions,
  COUNT(DISTINCT lc.id) AS total_responses_in_category,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
    2
  ) AS sov_pct
FROM llm_calls lc
JOIN prompts p ON p.id = lc.prompt_id
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id
CROSS JOIN brands b
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  AND b.country = 'SK'
GROUP BY p.category, b.id, b.name
ORDER BY p.category, sov_pct DESC;
```

### 3.8 Topic Gap Analysis

Identifikuje témy kde má brand nízku/nulovú visibility.

```sql
-- Pre konkrétny brand (Alza), ukázať kategórie kde má najnižšiu SoV
WITH brand_category_sov AS (
  SELECT
    p.category,
    p.subcategory,
    COUNT(DISTINCT lc.id) AS total_responses,
    COUNT(DISTINCT bm.raw_response_id) AS mentions,
    ROUND(
      COUNT(DISTINCT bm.raw_response_id)::numeric / 
      NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
      2
    ) AS sov_pct
  FROM llm_calls lc
  JOIN prompts p ON p.id = lc.prompt_id
  LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
  LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = (
    SELECT id FROM brands WHERE name = 'Alza'
  )
  WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.category, p.subcategory
)
SELECT * FROM brand_category_sov
ORDER BY sov_pct ASC
LIMIT 10;
```

### 3.9 Anomaly Detection

Detect náhle zmeny SoV (možný hallucination, model update, content gap).

```sql
-- Brandy s najväčším day-over-day skokom
WITH daily_sov AS (
  SELECT
    DATE(lc.created_at) AS day,
    b.id AS brand_id,
    b.name AS brand_name,
    ROUND(
      COUNT(DISTINCT bm.raw_response_id)::numeric / 
      NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
      2
    ) AS sov_pct
  FROM llm_calls lc
  CROSS JOIN brands b
  LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
  LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
  WHERE lc.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(lc.created_at), b.id, b.name
)
SELECT
  brand_name,
  day,
  sov_pct,
  LAG(sov_pct) OVER (PARTITION BY brand_id ORDER BY day) AS prev_day_sov,
  sov_pct - LAG(sov_pct) OVER (PARTITION BY brand_id ORDER BY day) AS dod_change,
  CASE
    WHEN ABS(sov_pct - LAG(sov_pct) OVER (PARTITION BY brand_id ORDER BY day)) > 15
    THEN 'ANOMALY'
    ELSE 'NORMAL'
  END AS flag
FROM daily_sov
WHERE day = CURRENT_DATE - 1
ORDER BY ABS(dod_change) DESC NULLS LAST
LIMIT 10;
```

---

## 4. Layer 4: Report Data Queries

Tieto queries feedujú PDF generator s číslami pre Industry Report a Per-Brand Audit.

### 4.1 Industry Report - The Mentivue Index (top 15)

```sql
-- Master SoV ranking pre Industry Report
SELECT
  b.name,
  b.website,
  COUNT(DISTINCT bm.raw_response_id) AS total_mentions,
  ROUND(AVG(bm.position)::numeric, 1) AS avg_position,
  ROUND(AVG(bm.sentiment_score)::numeric, 2) AS avg_sentiment,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF((SELECT COUNT(*) FROM llm_calls WHERE status = 'success' 
            AND created_at >= NOW() - INTERVAL '90 days'), 0) * 100,
    2
  ) AS overall_sov_pct,
  -- Composite Mentivue Index Score
  ROUND(
    (
      0.4 * (COUNT(DISTINCT bm.raw_response_id)::numeric / 100) +
      0.3 * (1.0 / GREATEST(AVG(bm.position), 1)) * 10 +
      0.3 * (AVG(bm.sentiment_score) + 1) * 50
    )::numeric,
    1
  ) AS mentivue_index_score
FROM brands b
LEFT JOIN brand_mentions bm ON bm.brand_id = b.id
LEFT JOIN raw_responses rr ON rr.id = bm.raw_response_id
LEFT JOIN llm_calls lc ON lc.id = rr.llm_call_id
  AND lc.created_at >= NOW() - INTERVAL '90 days'
WHERE b.country = 'SK'
GROUP BY b.id, b.name, b.website
ORDER BY mentivue_index_score DESC NULLS LAST;
```

### 4.2 Per-Brand Audit Queries

**Pre konkrétny brand (napríklad Alza):**

```sql
-- A) Visibility trend (12 weeks)
SELECT 
  DATE_TRUNC('week', lc.created_at) AS week,
  COUNT(DISTINCT bm.raw_response_id) AS mentions,
  COUNT(DISTINCT lc.id) AS total_responses,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
    2
  ) AS sov_pct
FROM llm_calls lc
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id 
  AND bm.brand_id = (SELECT id FROM brands WHERE name = $1)
WHERE lc.created_at >= NOW() - INTERVAL '12 weeks'
  AND lc.status = 'success'
GROUP BY DATE_TRUNC('week', lc.created_at)
ORDER BY week;

-- B) Top 5 competitors with comparative SoV
SELECT
  b.name,
  COUNT(DISTINCT bm.raw_response_id) AS mentions,
  ROUND(AVG(bm.sentiment_score)::numeric, 2) AS avg_sentiment
FROM brand_mentions bm
JOIN brands b ON b.id = bm.brand_id
JOIN raw_responses rr ON rr.id = bm.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  AND b.country = 'SK'
GROUP BY b.id, b.name
ORDER BY mentions DESC
LIMIT 5;

-- C) Topic coverage map for brand
SELECT
  p.category,
  p.subcategory,
  COUNT(DISTINCT lc.id) AS total_responses,
  COUNT(DISTINCT bm.raw_response_id) AS brand_mentions,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
    2
  ) AS coverage_pct
FROM llm_calls lc
JOIN prompts p ON p.id = lc.prompt_id
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id 
  AND bm.brand_id = (SELECT id FROM brands WHERE name = $1)
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.category, p.subcategory
ORDER BY coverage_pct ASC;

-- D) Top citation sources mentioning brand
SELECT
  citation->>'domain' AS domain,
  COUNT(*) AS citation_count
FROM raw_responses rr
JOIN llm_calls lc ON lc.id = rr.llm_call_id
JOIN brand_mentions bm ON bm.raw_response_id = rr.id
CROSS JOIN LATERAL jsonb_array_elements(rr.citations) AS citation
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  AND bm.brand_id = (SELECT id FROM brands WHERE name = $1)
GROUP BY citation->>'domain'
ORDER BY citation_count DESC
LIMIT 10;
```

### 4.3 Strategic Insights queries

```sql
-- "Where brand is invisible" - top 10 prompts kde brand mentioned 0 times
SELECT
  p.text AS prompt,
  p.category,
  COUNT(DISTINCT lc.id) AS responses,
  COUNT(DISTINCT bm.id) AS brand_mentions
FROM prompts p
JOIN llm_calls lc ON lc.prompt_id = p.id
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id
  AND bm.brand_id = (SELECT id FROM brands WHERE name = $1)
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.text, p.category
HAVING COUNT(DISTINCT bm.id) = 0 AND COUNT(DISTINCT lc.id) >= 5
ORDER BY responses DESC
LIMIT 10;
```

---

## 5. Materialized Views (performance)

Niektoré queries sú časté, treba ich precomputovať:

```sql
-- Refresh každú hodinu
CREATE MATERIALIZED VIEW mv_daily_brand_sov AS
SELECT
  DATE(lc.created_at) AS day,
  lc.provider,
  b.id AS brand_id,
  b.name AS brand_name,
  COUNT(DISTINCT lc.id) AS total_responses,
  COUNT(DISTINCT bm.raw_response_id) AS mentions,
  ROUND(
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
    NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
    2
  ) AS sov_pct,
  ROUND(AVG(bm.position)::numeric, 2) AS avg_position,
  ROUND(AVG(bm.sentiment_score)::numeric, 3) AS avg_sentiment
FROM llm_calls lc
CROSS JOIN brands b
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
WHERE lc.status = 'success'
GROUP BY DATE(lc.created_at), lc.provider, b.id, b.name;

CREATE INDEX idx_mv_daily_sov ON mv_daily_brand_sov(day, brand_id);

-- Refresh cez cron každú hodinu
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_brand_sov;
```

---

## 6. Report Generation Pipeline

### 6.1 Generation flow

```
Aggregation queries → Structured JSON → Claude Sonnet narrative → 
Recharts (server-side) → Puppeteer PDF → R2 Storage
```

### 6.2 Claude Sonnet Narrative Prompt (Executive Summary)

```typescript
const EXEC_SUMMARY_PROMPT = `
Si senior research analyst píšuci executive summary pre Mentivue Index Q2 2026 
- analýzu AI search visibility slovenských e-shopov s elektronikou.

DATA POINTS:
- Top 5 brands by Mentivue Index: {top_5_brands_json}
- Biggest movers WoW: {movers_json}
- Most cited sources: {citations_json}
- Surprise findings: {surprises_json}
- Time period: posledných 90 dní

ÚLOHA:
Napíš executive summary 2 strany (cca 800 slov) v slovenčine.

ŠTÝL:
- Bloomberg/McKinsey ton - autoritatívny, dátovo podložený
- Žiadne marketing buzzwords ("revolučné", "game-changing")
- Konkrétne čísla v každom odseku
- Per-paragraph štruktúra: téza → dôkaz → implikácia pre CMO
- Vyhni sa generickým AI frázam typu "in this rapidly evolving landscape"

FORMÁT:
- Krátky úvodný odstavec (key finding)
- 4-5 odsekov s konkrétnymi insights
- Záverečný odstavec s "what this means for you" pre CMO

ZACHOVAJ:
- Žiadne tvrdenia ktoré nie sú podložené v dátach
- Žiadne predikcie do budúcnosti bez data backing

Vráť čistý markdown, žiadne JSON wrappery.
`;
```

### 6.3 Brand Spotlight Prompt (1 page per top 10)

```typescript
const BRAND_SPOTLIGHT_PROMPT = `
Napíš 1-page Brand Spotlight pre Mentivue Index report.

BRAND: {brand_name}
DATA:
- Mentivue Index Rank: {rank}
- Overall SoV: {sov_pct}%
- Avg position: {avg_position}
- Avg sentiment: {sentiment_score}
- Strongest category: {best_category} ({best_category_sov}% SoV)
- Weakest category: {worst_category} ({worst_category_sov}% SoV)
- Top citations: {top_citations}
- WoW trend: {wow_trend}

ŠTRUKTÚRA (1 strana, ~400 slov):
1. **Headline finding** (1-2 vety) - najdôležitejšie zistenie o brand
2. **Visibility profile** (3-4 vety) - kde dominuje, kde stráca
3. **Key competitive position** (3-4 vety) - vs hlavní konkurenti
4. **Strategic recommendation** (2-3 vety) - 1 konkrétna akcia

ŠTÝL: faktický, decision-grade, žiadny marketing fluff.
`;
```

### 6.4 Per-Brand Audit Optimization Recommendations Prompt

```typescript
const OPTIMIZATION_PROMPT = `
Si senior digital strategy consultant pripravujúci optimization recommendations
pre {brand_name} v rámci Per-Brand Audit reportu.

DÁTA O BRAND:
- Top 10 promptov kde brand SoV = 0%: {invisible_prompts_json}
- Top 5 konkurentov ktorí v týchto prompts vyhrávajú: {competitor_winners_json}
- Top 10 citation sources ktoré favorizujú konkurentov: {competitor_citations_json}
- Brand sentiment problematics: {negative_sentiments_json}

ÚLOHA:
Vygeneruj 10 konkrétnych optimization opportunities. Pre každú:
- title: krátky názov (max 60 znakov)
- impact: "high" | "medium" | "low"
- effort: "low" | "medium" | "high"  
- description: 3-4 vety problému a riešenia
- specific_action: konkrétny content/PR/SEO akčný krok
- expected_outcome: čo by sa zmenilo (napr. "+8% SoV v Discovery kategórii")

PRINCÍPY:
- Žiadne generické "create more content" odporúčania
- Vždy konkrétne: ktorý prompt, ktorá citation source, aký content gap
- Quantify wherever possible
- Sorting: impact DESC, effort ASC

Vráť JSON pole 10 opportunities.
`;
```

---

## 7. Cost & Performance Monitoring queries

### 7.1 Daily spend dashboard

```sql
SELECT
  DATE(created_at) AS day,
  provider,
  COUNT(*) AS calls,
  SUM(estimated_cost_usd::numeric) AS total_cost_usd,
  AVG(latency_ms) AS avg_latency_ms,
  COUNT(CASE WHEN status != 'success' THEN 1 END) AS error_count,
  ROUND(
    COUNT(CASE WHEN status != 'success' THEN 1 END)::numeric / COUNT(*) * 100,
    2
  ) AS error_rate_pct
FROM llm_calls
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), provider
ORDER BY day DESC, provider;
```

### 7.2 Cost per prompt (identify expensive queries)

```sql
SELECT
  p.external_id,
  p.text,
  COUNT(lc.id) AS total_calls,
  SUM(lc.estimated_cost_usd::numeric) AS total_cost_usd,
  ROUND(AVG(lc.estimated_cost_usd::numeric)::numeric, 4) AS avg_cost_per_call,
  AVG(lc.output_tokens) AS avg_output_tokens
FROM prompts p
JOIN llm_calls lc ON lc.prompt_id = p.id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.external_id, p.text
ORDER BY total_cost_usd DESC
LIMIT 20;
```

### 7.3 Provider efficiency comparison

```sql
SELECT
  provider,
  COUNT(*) AS total_calls,
  ROUND(AVG(estimated_cost_usd::numeric)::numeric, 4) AS avg_cost,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  ROUND(AVG(input_tokens)::numeric, 0) AS avg_input_tokens,
  ROUND(AVG(output_tokens)::numeric, 0) AS avg_output_tokens,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / COUNT(*) * 100,
    2
  ) AS success_rate_pct
FROM llm_calls
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider;
```

---

## 8. Implementation order (čo robiť kedy)

**Týždeň 1-2:** Skip analysis layer. Iba collection + cost tracking.

**Týždeň 3:**
1. Implementuj combined analysis prompt (extract + sentiment + quality v jednom Claude call)
2. SQL queries 3.1 (Daily SoV) - to je core metric
3. SQL queries 7.1-7.3 (cost monitoring)

**Týždeň 4:**
4. Citation parsing (regex + Claude context)
5. SQL queries 3.5 (Citation Source Analysis)
6. SQL queries 4.1 (Mentivue Index)

**Týždeň 5:**
7. SQL queries 3.6, 3.7 (per-LLM, per-category SoV)
8. SQL queries 4.2 (Per-Brand Audit)
9. Materialized views (3-4)

**Týždeň 6:**
10. SQL queries 3.8, 3.9 (Topic Gap, Anomaly)
11. Hallucination detection (Step 5)
12. Optimization recommendations prompt (6.4)

---

## 9. Cost mitigation - kde sa dá ušetriť

| Optimization | Saving |
|---|---|
| Combined analysis prompt (3-in-1) | -50% analytical cost |
| Batch API pre non-realtime calls | -50% on inputs+outputs |
| Prompt caching system prompts | -25% on cached portions |
| Materialized views (precompute) | -90% query latency, no LLM cost |
| Skip hallucination check for monthly tier | -$50/mes |
| Use Claude Haiku (not Sonnet) for extraction | -80% per call |

**Bottom line target:** analytical layer pod $300/mes pri 1000 promptoch.

---

## 10. Open questions

- [ ] Self-host Llama 3.3 70B pre analytical layer (Mac M-series alebo GPU)? Free, ale viac complexity.
- [ ] Skúsiť DeepSeek V3.2 ($0.14/$0.42) ako tretí Tier 1 model namiesto Sonar?
- [ ] Pridať Grok ako 5. LLM v Tier 3? Marketshare zatiaľ malý ale rastúci.
- [ ] Anomaly threshold (3.9 query): aký % skok je signal vs noise? Iterovať empiricky.
- [ ] Sentiment scoring kalibracia: testovať na 100 manuálne anotovaných príkladoch.
