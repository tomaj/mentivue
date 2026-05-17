# Mentivue - Metrics Deep Dive

**Companion to PRD.md, ANALYSIS.md, REPORTS.md, VALIDATION.md** - hlbký drill-down pre **každú metriku v reportoch**.

Pre každú metriku odpovieme:

1. **Definition** - čo presne meriame
2. **Source prompts** - aké konkrétne prompty túto metriku driveujú
3. **LLM response pattern** - aká odpoveď sa očakáva
4. **Extraction** - ako z odpovede vytiahneme čísla
5. **Aggregation** - ako kombinujeme cez 4 LLM a cez čas
6. **Weighting** - aké váhy a prečo
7. **Validation method** - ako overíme správnosť

---

## 0. Foundational decisions - cross-LLM aggregation

Pred jednotlivými metriky musíme definovať **základné princípy**.

### 0.1 LLM market share weighting

Reportujeme čísla cez 4 LLM ale **nie sú rovnocenné**. Ich market share v SR (Q2 2026 estimate):

| LLM | Market share v SR | Aggregation weight |
|---|---|---|
| ChatGPT | 58% | 0.58 |
| Perplexity | 18% | 0.18 |
| Gemini | 15% | 0.15 |
| Claude | 9% | 0.09 |

**Source pre market share:**
- StatCounter AI assistant share (globálne, koriguj +5pp pre ChatGPT v EU)
- Similar Web data pre ai.chatgpt.com, perplexity.ai, gemini.google.com traffic z SR
- Slovak Telekom internal traffic insights (anonymizované)
- Quarterly refresh

**Týždeň 1 akcia:** Hardcoded weights v config. Po Q1 update na základe vlastných meraní.

### 0.2 Composite metrics formula

Pre **weighted aggregate metric**:

```
weighted_metric = (chatgpt_value × 0.58 + 
                   perplexity_value × 0.18 + 
                   gemini_value × 0.15 + 
                   claude_value × 0.09)
```

Pre **arithmetic mean** (per-LLM analysis):

```
arithmetic_mean = (chatgpt + perplexity + gemini + claude) / 4
```

**Rozhodnutie:** V reportoch **vždy explicit-ne hovoríme**, ktorú metriku používame:
- "Weighted SoV" = market-share-weighted
- "Cross-LLM avg" = arithmetic mean

### 0.3 Time windowing

| Report | Time window | Sampling |
|---|---|---|
| Mentivue Index Snapshot (live) | Last 7 days | All Tier 1 + last week of Tier 2 |
| Mentivue Pulse (weekly) | Last 7 days vs prior 7 days | Daily + weekly tiers |
| Industry Report (quarterly) | Last 90 days | All tiers, full coverage |
| Per-Brand Audit | Last 30 days | All tiers within window |
| Per-Brand Subscription monthly | Last 30 days | All tiers |

### 0.4 Mention de-duplication

Single LLM response môže spomenúť Alza viackrát ("Alza je výborná... Alza ponúka..."). Pre SoV počítame:

- **mention_count:** počet samostatných spomienok (aj viacnásobných v 1 odpovedi)
- **response_with_mention:** binary - bola Alza spomenutá aspoň raz v tejto odpovedi? (Y/N)

SoV používa **response_with_mention** (binary), nie raw mention_count. Inak by sa LLMs s longer outputs umelo zvýhodnili.

---

## 1. METRIC: Share of Voice (SoV)

**Reporting locations:**
- Mentivue Index Snapshot (homepage)
- Industry Report - leaderboard
- Per-Brand Audit - scorecard
- All Pulse newsletters

### 1.1 Definition

Share of Voice je **percento odpovedí AI, v ktorých bol brand spomenutý aspoň raz**, z celkového počtu valid odpovedí v daný časový window.

```
SoV(brand, window) = (responses_with_brand_mentioned / total_valid_responses) × 100
```

### 1.2 Source prompts

**Všetky prompty kde brand môže byť relevantne spomenutý:**

Pre **general SoV** (top-level metric v Mentivue Index):
- Discovery (250 promptov) - týmto je brand "natural fit" do answer
- Comparison (150) - brand sa môže objaviť ako jedna strana porovnania
- Product-specific (300) - keď je brand sortimentom relevantný
- Use case (100) - keď persona/scenario odporúčaný brand
- **Total relevant promptov: 800**

Pre **filtered SoV per category** používame iba prompty z danej kategórie. Príklad:
- SoV-Discovery: iba 250 discovery promptov
- SoV-Smartphones: iba 60 smartphone promptov

**Validation, trust, long-tail prompty sa NEZAPOČÍTAVAJÚ do general SoV.** Patria do špecializovaných metrik (hallucination rate, negative sentiment, B2B coverage).

### 1.3 LLM response pattern

**Príklad odpovede ChatGPT na prompt "Aký je najlepší eshop na elektroniku na Slovensku?":**

```
Na slovenskom trhu sú niekoľko silných hráčov v segmente 
elektroniky online predaja:

1. **Alza.sk** - najväčší online predajca s rýchlym doručením
2. **Datart** - silná pozícia v elektronike, kamenné pobočky
3. **Nay** - široký sortiment domácich spotrebičov
4. **Planeo Elektro** - kompetitívne ceny
5. **Andrea Shop** - menší ale spoľahlivý

Podľa kategórie:
- Pre Apple produkty: Alza alebo iStores
- Pre veľké spotrebiče: Nay alebo Datart
- Pre rýchle doručenie: Alza

Odporúčam pozrieť heureka.sk pre porovnanie cien.
```

### 1.4 Extraction (Step 1 z ANALYSIS.md)

Claude Haiku spustí brand extraction prompt. Output:

```json
{
  "brands_mentioned": [
    {"brand_id": "alza", "position": 1, "context": "najväčší online predajca", "mention_strength": "primary"},
    {"brand_id": "datart", "position": 2, "context": "silná pozícia v elektronike", "mention_strength": "primary"},
    {"brand_id": "nay", "position": 3, "context": "široký sortiment", "mention_strength": "primary"},
    {"brand_id": "planeo", "position": 4, "context": "kompetitívne ceny", "mention_strength": "secondary"},
    {"brand_id": "andrea", "position": 5, "context": "menší ale spoľahlivý", "mention_strength": "secondary"},
    {"brand_id": "alza", "position": 6, "context": "Alza alebo iStores pre Apple", "mention_strength": "passing"},
    {"brand_id": "istores", "position": 7, "context": "Alza alebo iStores pre Apple", "mention_strength": "secondary"}
  ],
  "language_detected": "sk",
  "refused_to_answer": false
}
```

**Insert do brand_mentions:** 7 záznamov (Alza dvakrát - position 1 a 6).

### 1.5 Aggregation - krok za krokom

**Pre brand "Alza", time window "last 7 days":**

```sql
-- Step 1: Spočítaj responses kde Alza bola mentioned ASPOŇ raz
SELECT 
  lc.provider,
  COUNT(DISTINCT lc.id) AS total_responses,
  COUNT(DISTINCT bm.raw_response_id) AS responses_with_alza
FROM llm_calls lc
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id 
  AND bm.brand_id = (SELECT id FROM brands WHERE name = 'Alza')
WHERE lc.created_at >= NOW() - INTERVAL '7 days'
  AND lc.status = 'success'
  AND lc.prompt_id IN (
    SELECT id FROM prompts 
    WHERE category IN ('discovery', 'comparison', 'product_specific', 'use_case')
  )
GROUP BY lc.provider;
```

**Výstup (sample):**

| provider | total_responses | responses_with_alza | per_llm_sov |
|---|---|---|---|
| anthropic | 2 234 | 1 053 | 47.1% |
| openai | 5 600 | 2 632 | 47.0% |
| perplexity | 5 600 | 2 184 | 39.0% |
| google | 1 870 | 561 | 30.0% |

**Step 2: Apply LLM market share weights**

```
weighted_sov_alza = 0.58 × 47.0% + 0.18 × 39.0% + 0.15 × 30.0% + 0.09 × 47.1%
                  = 27.26 + 7.02 + 4.50 + 4.24
                  = 43.02%
```

**Step 3: Report rendering**

V Mentivue Indexe ukazujeme **weighted SoV = 43.0%** ako default.

V per-LLM breakdown sekcii ukazujeme všetky 4 individuálne hodnoty.

### 1.6 Why not simple mention count?

Pretože ChatGPT robí dlhšie odpovede a spomína viac brandov. Counting mentions by zvýhodnil ChatGPT.

**Binary "was mentioned" eliminuje LLM verbosity bias.**

### 1.7 Validation

- **M1: Manual mention check** - 50 sample responses týždenne, F1 target >0.92
- **Edge case:** brand alias coverage. Príklad: AI povie "Alzaškola" alebo "alza shop" - musíme to capture-núť cez aliases.

---

## 2. METRIC: Average Position

**Reporting locations:**
- Per-Brand Audit scorecard
- Mentivue Index (vedľa SoV)

### 2.1 Definition

Priemerné poradie brandu v responses where mentioned. Lower = better.

```
avg_position(brand) = AVG(position) WHERE brand_id = X
```

### 2.2 Why it matters

Brand spomenutý ako #1 má 5× vyššiu šancu byť clicked než brand na #5 (analógicky k SEO SERP CTR data). SoV samo o sebe nehovorí o "quality" mention.

### 2.3 LLM response patterns - position detection

LLMs zvyčajne odpovedajú v 3 formátoch:

**Format A: Numbered list (typical pre ChatGPT, Claude)**
```
1. Alza.sk
2. Datart
3. Nay
```
→ position = explicit number

**Format B: Bullet list bez čísla**
```
- Alza.sk - dominantný hráč
- Datart - silná druhá voľba
- Nay - tretia možnosť
```
→ position = bullet order index (Alza=1, Datart=2, ...)

**Format C: Prose**
```
Najlepší je určite Alza.sk. Po nej nasleduje Datart a Nay.
```
→ position = order of first appearance in text (Alza=1, Datart=2, Nay=3)

### 2.4 Extraction - position assignment

Claude Haiku v Step 1 musí presne identifikovať position. **Updatovaný extraction prompt** (revízia voči ANALYSIS.md):

```typescript
const BRAND_EXTRACTION_PROMPT_V2 = `
[...as before...]

POSITION ASSIGNMENT RULES:
- Ak AI použila numbered list → position = explicit number
- Ak AI použila bullets bez čísel → position = poradie v bullet liste
- Ak AI použila prózu → position = poradie prvého výskytu (textuálne)
- Ak je brand spomenutý viackrát → použij position prvého (najvýznamnejšieho) výskytu
- Top section (prvé 3 menom) má vyššiu prioritu než "additional mentions"

PRIMARY vs PASSING distinction:
- "primary": brand je top recommendation alebo dedicated point (heading, prvá veta)
- "secondary": brand spomenutý ako alternative alebo "tiež dobrá voľba"
- "passing": brand spomenutý mimochodom, v zátvorke, alebo ako exclusion ("namiesto X použij Y")

[...rest...]
`;
```

### 2.5 Aggregation

```sql
SELECT
  b.name,
  COUNT(bm.id) AS total_mentions,
  ROUND(AVG(bm.position)::numeric, 2) AS avg_position,
  ROUND(AVG(bm.position) FILTER (WHERE bm.mention_strength = 'primary')::numeric, 2) AS avg_primary_position,
  COUNT(*) FILTER (WHERE bm.position = 1) AS times_first
FROM brand_mentions bm
JOIN brands b ON b.id = bm.brand_id
JOIN raw_responses rr ON rr.id = bm.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name;
```

### 2.6 Validation

- **M1 manual check** musí validovať aj position assignment (nielen brand identity)
- **Inter-LLM consistency check:** pre ten istý prompt, je brand position podobné v Claude a ChatGPT? Ak veľmi líši → red flag

---

## 3. METRIC: Mentivue Index Score (composite)

**Reporting locations:**
- Mentivue Index Snapshot (hero metric)
- Industry Report leaderboard
- Per-Brand Audit scorecard

### 3.1 Definition

Composite score 0-100 ktorý kombinuje SoV, position a sentiment do jedného porovnávacieho čísla.

### 3.2 Formula (revised v2)

Pôvodná formula v ANALYSIS.md bola príliš jednoduchá. Revízia:

```python
def mentivue_index(brand_metrics):
    # Normalize each component to 0-100
    
    # 1. SoV component (0-100)
    sov_score = brand_metrics["weighted_sov_pct"]  # already 0-100
    
    # 2. Position component (0-100, higher = better position)
    # avg_position ranges from 1.0 (best) to ~10 (worst)
    # Convert: position 1 → 100, position 10 → 10
    if brand_metrics["avg_position"]:
        position_score = max(0, 100 - (brand_metrics["avg_position"] - 1) * 10)
    else:
        position_score = 0  # never mentioned
    
    # 3. Sentiment component (0-100)
    # sentiment_score ranges from -1 to +1
    # Convert: -1 → 0, 0 → 50, +1 → 100
    sentiment_score = (brand_metrics["avg_sentiment"] + 1) * 50
    
    # 4. Citation diversity bonus (0-100)
    # Number of unique authoritative sources citing brand
    citation_score = min(100, brand_metrics["unique_citation_domains"] * 10)
    
    # Composite (weights sum to 1.0)
    composite = (
        0.35 * sov_score +
        0.25 * position_score +
        0.25 * sentiment_score +
        0.15 * citation_score
    )
    
    return round(composite, 1)
```

### 3.3 Why these weights

- **SoV 35%**: najreprezentatívnejšia visibility metric, ale samo nestačí
- **Position 25%**: kvalita mention matters
- **Sentiment 25%**: pozitívna mention je hodnotnejšia
- **Citation diversity 15%**: korelát "topical authority"

**Sensitivity:** Pri weights ±0.1 sa ranking top 15 nemení (M3 validation).

### 3.4 Source data

| Component | Source | Aggregation window |
|---|---|---|
| weighted_sov_pct | Section 1.5 query | Last 30/90 days |
| avg_position | Section 2.5 query | Last 30/90 days |
| avg_sentiment | Section 4 (below) | Last 30/90 days |
| unique_citation_domains | Section 5 (below) | Last 30/90 days |

### 3.5 Report rendering

```
Brand          Index    SoV     Position  Sentiment  Citations
─────────────────────────────────────────────────────────────
Alza.sk        87.3    43.0%   1.8      +0.62     12 unique
Datart         72.8    28.4%   2.4      +0.41     8 unique
Nay            68.2    24.7%   2.6      +0.55     7 unique
```

### 3.6 Validation

- **M3: Sensitivity analysis** - weights ±0.1, Spearman rank correlation >0.90
- **Outlier check:** ak brand má vysoký SoV ale low position → manual investigation

---

## 4. METRIC: Average Sentiment per Brand

**Reporting locations:**
- Brand Cards (verejné)
- Per-Brand Audit sentiment section
- Industry Report sentiment leaderboard

### 4.1 Definition

Priemerné sentiment score brand mentions cez všetky responses v window.

```
avg_sentiment(brand) = AVG(sentiment_score) WHERE brand_id = X
```

Range: -1.0 (very negative) až +1.0 (very positive).

### 4.2 Source prompts

**Pre balanced sentiment**, kombinujeme:
- **Positive-likely prompts:** Discovery, Comparison (~800 prompts) - tu brand spomenutý zvyčajne neutrálne/pozitívne
- **Neutral-likely prompts:** Product-specific (~300) - factual mentions
- **Negative-likely prompts:** validation/negative_sentiment (25) - explicitne provokujeme negativy
- **Trust prompts:** Trust&service (100) - mix pozitív/negatív podľa reputácie

**Bez negative_sentiment prompts by skóre bolo umelo pozitívne.** Toto je dôvod prečo sme ich pridali.

### 4.3 LLM response patterns - sentiment lexicon

**Positive markers (Claude Haiku to detekuje):**
- "najlepší", "odporúčam", "spoľahlivý", "kvalitný"
- "rýchle doručenie", "dobré ceny", "široký výber"
- "obľúbený", "preferovaný", "dôveryhodný"
- "skvelý servis", "perfektný"

**Negative markers:**
- "drahý", "pomalý", "problémový"
- "zlé recenzie", "sťažnosti", "nespokojní zákazníci"
- "neodporúčam", "vyhnúť sa"
- "horší ako konkurencia", "slabší servis"

**Neutral markers:**
- "ponúka", "predáva", "patrí medzi"
- "je jeden z", "známy ako", "známy slovenský eshop"

### 4.4 Extraction prompt (revízia)

```typescript
const SENTIMENT_PROMPT_V2 = `
Analyzuj sentiment AI odpovede voči konkrétnym brandom.

AI ODPOVEĎ:
"""
{response_text}
"""

EXTRAHOVANÉ BRANDY a ich kontext:
{brands_with_context_json}

Pre každý brand urči sentiment ŠTRIKTNE podľa explicitných slov:

POSITIVE (+0.3 to +1.0):
- "najlepší" v kontexte brand = +0.8
- "odporúčam" = +0.7
- "spoľahlivý", "kvalitný" = +0.5
- "obľúbený", "známy ako dobrý" = +0.4

NEUTRAL (-0.3 to +0.3):
- "ponúka", "predáva", "má v ponuke" = 0.0
- "je jednou z možností" = 0.0
- "patrí medzi väčšie eshopy" = +0.1

NEGATIVE (-1.0 to -0.3):
- "drahý", "pomalý" = -0.4
- "problémy s reklamáciou" = -0.6
- "neodporúčam", "vyhnúť sa" = -0.8
- "zlé recenzie", "sťažnosti" = -0.7

CRITICAL: 
- Sentiment je voči brand, NIE voči odporúčaniu produktu
- "Alza má dobré ceny ale pomalé doručenie" = mixed → -0.1 (slightly negative)
- Brand spomenutý v "negative comparison" voči inému je -0.3 ("Datart je drahší než Alza" → Datart -0.3)

ATTRIBUTE VS SENTIMENT:
"Alza je drahá" = -0.5 (drahá = negative attribute)
"Alza ponúka prémiové ceny" = +0.3 (positive framing)
"Alza má vyššie ceny" = -0.2 (neutral framing on negative attribute)

Vráť JSON:
{
  "sentiments": [
    {
      "brand_id": "alza",
      "sentiment": "positive",
      "sentiment_score": 0.7,
      "evidence_phrase": "presná veta z odpovede",
      "reasoning": "krátka justifikácia max 80 znakov"
    }
  ]
}
`;
```

### 4.5 Aggregation

```sql
SELECT
  b.name,
  COUNT(bm.id) AS total_mentions,
  ROUND(AVG(bm.sentiment_score)::numeric, 3) AS avg_sentiment,
  ROUND(STDDEV(bm.sentiment_score)::numeric, 3) AS sentiment_stddev,
  -- Breakdown
  COUNT(*) FILTER (WHERE bm.sentiment = 'positive') AS positive,
  COUNT(*) FILTER (WHERE bm.sentiment = 'neutral') AS neutral,
  COUNT(*) FILTER (WHERE bm.sentiment = 'negative') AS negative,
  -- Per-LLM
  ROUND(AVG(bm.sentiment_score) FILTER (WHERE lc.provider = 'anthropic')::numeric, 3) AS sentiment_anthropic,
  ROUND(AVG(bm.sentiment_score) FILTER (WHERE lc.provider = 'openai')::numeric, 3) AS sentiment_openai
FROM brand_mentions bm
JOIN brands b ON b.id = bm.brand_id
JOIN raw_responses rr ON rr.id = bm.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name;
```

### 4.6 Cross-LLM weighted aggregate

```python
weighted_sentiment = (
    0.58 * sentiment_openai +
    0.18 * sentiment_perplexity +
    0.15 * sentiment_google +
    0.09 * sentiment_anthropic
)
```

### 4.7 Validation

- **M7 ground truth dataset** - 100 manuálne anotovaných samples, accuracy target >80%
- **M8 inter-rater agreement** - Cohen's kappa >0.75
- **M9 negative recall test** - cez negative_sentiment prompts, target 90%+ negative detection

---

## 5. METRIC: Citation Source Analysis

**Reporting locations:**
- Industry Report Citation Deep Dive (4 pages)
- Per-Brand Audit Citation Footprint
- Brand Cards Top Citations

### 5.1 Definition

Citation = URL alebo named source ktorú AI uvádza ako zdroj informácie v odpovedi.

Per-domain count:
```
domain_citations = COUNT(citations) WHERE domain = X
```

### 5.2 Source - kde sa citations berú

**A. From LLM API metadata (preferred):**
- Perplexity Sonar: vracia `citations` array v API response
- Claude (s web_search tool): vracia citations v tool_use blocks
- OpenAI GPT s web search: vracia source URLs
- Gemini s Grounding: vracia grounding_supports

**B. From response text (fallback):**
- Regex extraction URL z plain text
- Markdown link detection: `[text](url)`

### 5.3 LLM response patterns

**Example 1: Perplexity Sonar (structured citations)**
```json
{
  "choices": [{"message": {"content": "..."}}],
  "citations": [
    "https://www.heureka.sk/eshopy/elektro",
    "https://www.zive.sk/clanok/best-eshops-2026",
    "https://www.dsl.sk/recenzie/alza"
  ]
}
```

**Example 2: ChatGPT (inline markdown links)**
```
Podľa [Heureky](https://heureka.sk) je Alza najobľúbenejší 
eshop. [Živé](https://zive.sk) tiež potvrdzuje vysokú kvalitu 
služieb...
```

**Example 3: Claude (citations v separate block)**
```
[Tool use: web_search]
[Search results...]

V odpovedi: "Alza.sk je dominantný..."
Citations: heureka.sk, zive.sk
```

### 5.4 Extraction pipeline

**Step A: API metadata extraction**
```typescript
function extractCitationsFromAPI(provider, response) {
  switch (provider) {
    case "perplexity":
      return response.citations.map(url => ({
        url,
        source: "perplexity_api"
      }));
    case "anthropic":
      return response.content
        .filter(b => b.type === "tool_use" && b.name === "web_search")
        .flatMap(b => b.input.queries.map(/* extract URLs */));
    // ...
  }
}
```

**Step B: Text extraction (fallback)**
```typescript
function extractCitationsFromText(text) {
  // 1. Bare URLs
  const urls = text.match(/https?:\/\/[^\s\]\)]+/g) || [];
  
  // 2. Markdown links
  const mdLinks = [...text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map(m => ({ url: m[2], title: m[1] }));
  
  return [...new Set([...urls, ...mdLinks.map(l => l.url)])];
}
```

**Step C: Domain normalization**
```typescript
function normalizeDomain(url) {
  try {
    const parsed = new URL(url);
    let domain = parsed.hostname.replace(/^www\./, '');
    return domain;
  } catch {
    return null;
  }
}
```

**Step D: Categorization** (z taxonomy v ANALYSIS.md)
```typescript
const CITATION_DOMAINS = {
  "heureka.sk": { type: "comparison", weight: 0.8 },
  "zive.sk": { type: "news", weight: 0.6 },
  // ...
};

function categorizeCitation(domain) {
  return CITATION_DOMAINS[domain] || { type: "other", weight: 0.3 };
}
```

### 5.5 Aggregation

```sql
-- Top 30 cited domains across all responses
WITH citation_data AS (
  SELECT
    rr.id AS response_id,
    lc.provider,
    jsonb_array_elements_text(rr.citations->'domains') AS domain
  FROM raw_responses rr
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE lc.created_at >= NOW() - INTERVAL '90 days'
)
SELECT
  domain,
  COUNT(*) AS citation_count,
  COUNT(DISTINCT provider) AS cited_by_n_llms,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) AS share_pct
FROM citation_data
GROUP BY domain
ORDER BY citation_count DESC
LIMIT 30;
```

### 5.6 Per-brand citation attribution

Túto časť žiadna iná SQL query nepokrývala - **musíme ju doplniť**.

```sql
-- Pre konkrétny brand, top citation sources ktoré ho podporujú
WITH brand_responses AS (
  SELECT DISTINCT rr.id, rr.citations
  FROM raw_responses rr
  JOIN brand_mentions bm ON bm.raw_response_id = rr.id
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE bm.brand_id = (SELECT id FROM brands WHERE name = 'Alza')
    AND lc.created_at >= NOW() - INTERVAL '30 days'
),
citation_data AS (
  SELECT
    jsonb_array_elements_text(br.citations->'domains') AS domain
  FROM brand_responses br
)
SELECT
  domain,
  COUNT(*) AS supports_brand_count
FROM citation_data
GROUP BY domain
ORDER BY supports_brand_count DESC
LIMIT 10;
```

### 5.7 Citation overlap analysis (Venn diagram)

Pre Competitive Benchmark, potrebujeme vedieť ktoré sources sú zdieľané medzi brandami.

```sql
-- Domains citing both Alza AND Datart
WITH brand_a_citations AS (
  SELECT DISTINCT 
    jsonb_array_elements_text(rr.citations->'domains') AS domain
  FROM raw_responses rr
  JOIN brand_mentions bm ON bm.raw_response_id = rr.id
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE bm.brand_id = (SELECT id FROM brands WHERE name = $1)
    AND lc.created_at >= NOW() - INTERVAL '30 days'
),
brand_b_citations AS (
  SELECT DISTINCT 
    jsonb_array_elements_text(rr.citations->'domains') AS domain
  FROM raw_responses rr
  JOIN brand_mentions bm ON bm.raw_response_id = rr.id
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE bm.brand_id = (SELECT id FROM brands WHERE name = $2)
    AND lc.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  COALESCE(a.domain, b.domain) AS domain,
  CASE 
    WHEN a.domain IS NOT NULL AND b.domain IS NOT NULL THEN 'both'
    WHEN a.domain IS NOT NULL THEN 'only_a'
    ELSE 'only_b'
  END AS overlap_type
FROM brand_a_citations a
FULL OUTER JOIN brand_b_citations b ON a.domain = b.domain;
```

Pre 3 brandov (Alza, Datart, Nay) sa to extenduje do 3-way Venn diagram.

### 5.8 Validation

- **M10 URL extraction accuracy** - precision >98%, recall >95%
- **M11 Domain taxonomy review** - mesačne update top 50 new domains
- **M12 Brand-source affinity cross-check** - manuálne over top 5 brand-source pairs

---

## 6. METRIC: Per-LLM Brand Preference

**Reporting locations:**
- Industry Report Per-LLM Breakdown (4 pages)
- Per-Brand Audit Per-LLM Performance

### 6.1 Definition

Pre každú dvojicu (brand, LLM), aká je SoV/sentiment/position. Identifikuje **ktoré modely favorizujú ktoré brandy**.

### 6.2 Why it matters

Klient v Per-Brand Audit chce vedieť: "Optimalizujem na ChatGPT alebo Perplexity?" Per-LLM split mu povie kde má **najväčší upside potential**.

### 6.3 Source prompts

**Všetky 800 promptov ktoré driveujú SoV** (rovnaké ako Section 1.2).

### 6.4 Reasoning - prečo LLMs odpovedajú inak?

LLM dáva inú odpoveď keďže má:
1. **Iné training data** (cutoff, source mix)
2. **Iný search engine** (ChatGPT používa Bing, Perplexity vlastný index)
3. **Iný post-processing** (Claude má constitutional AI principles, ChatGPT RLHF differently tuned)
4. **Iné citation behavior** (Perplexity je trained na citing, Claude menej)

**Náš job:** dokumentovať tieto rozdiely, nie ich vysvetľovať. To je insight pre klienta.

### 6.5 Aggregation

```sql
SELECT
  b.name AS brand,
  lc.provider AS llm,
  COUNT(DISTINCT lc.id) AS total_queries,
  COUNT(DISTINCT bm.raw_response_id) AS responses_with_mention,
  ROUND(COUNT(DISTINCT bm.raw_response_id)::numeric / 
        NULLIF(COUNT(DISTINCT lc.id), 0) * 100, 2) AS sov_pct,
  ROUND(AVG(bm.position)::numeric, 2) AS avg_position,
  ROUND(AVG(bm.sentiment_score)::numeric, 3) AS avg_sentiment
FROM llm_calls lc
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
CROSS JOIN brands b
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  AND lc.status = 'success'
  AND b.country = 'SK'
GROUP BY b.id, b.name, lc.provider
ORDER BY b.name, lc.provider;
```

### 6.6 Identifying "LLM specialists" - reasoning

Pre Industry Report a Per-Brand Audit, identifikujeme:

**"Alza is ChatGPT's #1, but Perplexity prefers Nay"** - tieto insights vznikajú z pozorovania differential:

```python
def find_llm_preferences(brand_sov_per_llm):
    """
    Input: dict {llm: sov_pct} for one brand
    Output: which LLMs over-represent this brand vs others
    """
    avg_sov = sum(brand_sov_per_llm.values()) / 4
    
    preferences = {}
    for llm, sov in brand_sov_per_llm.items():
        diff = sov - avg_sov
        if diff > 5:  # Over-represented by >5pp
            preferences[llm] = "favorite"
        elif diff < -5:  # Under-represented
            preferences[llm] = "underrepresenter"
        else:
            preferences[llm] = "neutral"
    
    return preferences
```

Pre Alza: ak ChatGPT SoV=47%, Claude=47%, Perplexity=39%, Gemini=30%, priemer=40.75%
→ ChatGPT favorite (+6.25pp), Gemini underrepresenter (-10.75pp)

**Insight pre report:** "Alza dominuje na ChatGPT ale stráca v Gemini - investigate Google Search content."

### 6.7 Validation

- **M4 cross-LLM consistency** - Jaccard >0.5 medzi LLM pairs pre stable brandov
- **M15 cross-LLM hallucination differential** - identifikovať najunreliable model

---

## 7. METRIC: Hallucination Rate per LLM

**Reporting locations:**
- Industry Report Hallucination & Sentiment Report (3 pages)
- Per-Brand Audit reputation risks section

### 7.1 Definition

Percento factual claims o brandoch ktoré sú v rozpore s našou Facts DB.

```
hallucination_rate(LLM) = hallucinated_claims / total_factual_claims
```

### 7.2 Source prompts

**Špecificky validation/hallucination_check (30 promptov):**
- Otváracie hodiny, pobočky
- Záruka, reklamácie 
- Doručenie, kuriérske služby
- Platobné metódy, splátky

Tieto prompty **provokujú faktografické odpovede** kde môžeme objektívne overiť pravdivosť.

### 7.3 LLM response pattern - factual claims

**Example prompt:** "Má Alza pobočku v Košiciach?"

**ChatGPT response (factual claim ktorý overujeme):**
```
Áno, Alza.sk má kamennú pobočku v Košiciach na 
Tr. SNP 61. Otvorené je pondelok-piatok 9:00-21:00, 
sobota 9:00-21:00, nedeľa 10:00-20:00.
```

**Z Facts DB:**
```yaml
alza:
  physical_stores_sk:
    kosice:
      address: "Tr. SNP 61"
      hours: "Po-Pi 9:00-21:00, So-Ne 9:00-20:00"
```

**Comparison:** Address ✓ match. Friday hours ✓ match. Saturday hours ✗ mismatch (response: 9:00-21:00, fact: 9:00-20:00).

→ **1 hallucination flag** pre toto response.

### 7.4 Extraction prompt (Step 5)

V ANALYSIS.md som už definoval. Tu doplnam edge case:

**Edge case 1: AI vágne odpoveď**
```
"Alza má pobočky v hlavných slovenských mestách"
```
→ Toto NIE JE faktografický claim. Skip.

**Edge case 2: AI odmietne odpovedať**
```
"Nemám aktuálne informácie o otváracích hodinách."
```
→ Mark response.refused = true. Skip hallucination check.

**Edge case 3: AI uvedie zdroj**
```
"Podľa alza.sk je otvorené 9:00-21:00"
```
→ Stále kontroluj fakt. AI môže nesprávne citovať.

### 7.5 Aggregation

```sql
-- Hallucination rate per LLM
SELECT
  lc.provider,
  COUNT(*) AS total_factual_claims,
  COUNT(*) FILTER (WHERE hf.contradicts_facts = true) AS hallucinated,
  ROUND(COUNT(*) FILTER (WHERE hf.contradicts_facts = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2) AS hallucination_rate_pct
FROM hallucination_flags hf
JOIN raw_responses rr ON rr.id = hf.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
WHERE lc.created_at >= NOW() - INTERVAL '90 days'
GROUP BY lc.provider
ORDER BY hallucination_rate_pct DESC;
```

**Per brand:**

```sql
SELECT
  hf.brand,
  COUNT(*) AS total_claims,
  COUNT(*) FILTER (WHERE hf.contradicts_facts = true) AS hallucinated,
  array_agg(DISTINCT hf.claim) FILTER (WHERE hf.contradicts_facts = true) 
    AS sample_hallucinations
FROM hallucination_flags hf
WHERE hf.created_at >= NOW() - INTERVAL '90 days'
GROUP BY hf.brand;
```

### 7.6 Report rendering

```
HALLUCINATION RATE BY LLM (Last 90 days)

LLM           Total Claims    Hallucinated    Rate
─────────────────────────────────────────────────
Perplexity         342             8         2.3%
Claude             156             5         3.2%
ChatGPT            278            14         5.0%
Gemini             198            18         9.1%
```

### 7.7 Specific hallucination examples for report

```sql
-- Top 10 most blatant hallucinations for case studies
SELECT
  lc.provider,
  p.text AS prompt,
  hf.claim,
  hf.contradiction,
  hf.confidence
FROM hallucination_flags hf
JOIN raw_responses rr ON rr.id = hf.raw_response_id
JOIN llm_calls lc ON lc.id = rr.llm_call_id
JOIN prompts p ON p.id = lc.prompt_id
WHERE hf.contradicts_facts = true
  AND hf.confidence > 0.8
  AND lc.created_at >= NOW() - INTERVAL '90 days'
ORDER BY hf.confidence DESC
LIMIT 10;
```

### 7.8 Validation

- **M13 Ground truth facts DB** - manually curated, quarterly refresh
- **M14 Manual fact-check** - 50 samples per quarter
- **M15 Cross-LLM differential** - validate methodology consistency

---

## 8. METRIC: "AI hovorí" Quote Extraction

**Reporting locations:**
- Brand Cards (verejné)
- Per-Brand Audit sentiment sekcia
- Mentivue Pulse newsletter

### 8.1 Definition

Sample konkrétnych quotov z AI odpovedí, ktoré ilustrujú sentiment alebo positioning.

### 8.2 Why it matters

Numbers sú abstract. Quote "Alza je výborná pre rýchle doručenie" je presvedčivý a memorable. Toto reportom dáva **textual flavor** vedľa number.

### 8.3 Source prompts

**Pre positive quotes:**
- Discovery, Comparison (silné positive endorsements)

**Pre negative quotes:**
- validation/negative_sentiment prompts

**Pre interesting/novel quotes:**
- use_case/persona_driven (personalizované odporúčania)

### 8.4 Extraction prompt - quote selection

Pridáme **Step 6** do analysis pipeline:

```typescript
const QUOTE_EXTRACTION_PROMPT = `
Z AI odpovede vyber 1-3 reprezentatívne quotes ktoré:
- Sú o konkrétnom brande (named)
- Majú jasný sentiment (positive/negative/notable)
- Sú maximálne 200 znakov dlhé
- Sú self-contained (rozumieš im bez kontextu)

OTÁZKA: {prompt_text}
AI ODPOVEĎ: {response_text}
TRACKED BRANDS: {brand_list}

Pre každý quote urči:
- text: presná citácia (max 200 chars)
- brand: ktorého brand sa týka
- sentiment: positive/neutral/negative
- quote_type: "endorsement" | "comparison" | "warning" | "use_case_specific"
- standalone_quality: 0-10 (môže byť pochopiteľný bez context?)

Vráť max 3 quotes per response. Iba quotes s standalone_quality >7.

JSON:
{
  "quotes": [
    {
      "text": "Alza.sk patrí medzi najspoľahlivejšie eshopy s rýchlym doručením",
      "brand": "alza",
      "sentiment": "positive",
      "quote_type": "endorsement",
      "standalone_quality": 9
    }
  ]
}
`;
```

### 8.5 Storage

Nová tabuľka:

```sql
CREATE TABLE notable_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_response_id uuid REFERENCES raw_responses(id),
  brand_id uuid REFERENCES brands(id),
  quote_text text NOT NULL,
  sentiment text,
  quote_type text,
  standalone_quality int,
  is_featured boolean DEFAULT false,  -- manuálne kuratované highlights
  created_at timestamp DEFAULT now()
);
```

### 8.6 Selection pre reporty

**Pre Brand Card:**
- Top 2-3 quotes za 30 dní, balanced (1 positive, 1 negative if exists, 1 use-case-specific)
- Filter: standalone_quality >= 8

**Pre Pulse newsletter "Quote of the week":**
- 1 notable quote z minulého týždňa
- Tomas manuálne vyberie z top 10 candidates

**Pre Per-Brand Audit:**
- 5-7 quotes vo "Sentiment Analysis" sekcii
- Mix endorsements + warnings + use cases

### 8.7 Validation

- **M21 (new): Manual quote review** - z 50 extracted quotes, koľko je skutočne "share-worthy"? Target >70%.
- **M22 (new): Brand attribution check** - quote správne attributed k brandu? Target >95%.

---

## 9. METRIC: Topic Coverage Map (Heatmap)

**Reporting locations:**
- Per-Brand Audit Topic Coverage Map (2 pages)

### 9.1 Definition

Matrix brand × category showing SoV. Ukazuje "where you win, where you're invisible".

### 9.2 Categories

7 main + 30 subcategorií (z prompt taxonomy).

### 9.3 Data source

**Cross-tab:**
```sql
SELECT
  b.name AS brand,
  p.category,
  p.subcategory,
  COUNT(DISTINCT lc.id) AS total_responses,
  COUNT(DISTINCT bm.raw_response_id) AS mentions,
  ROUND(COUNT(DISTINCT bm.raw_response_id)::numeric / 
        NULLIF(COUNT(DISTINCT lc.id), 0) * 100, 2) AS sov_pct
FROM llm_calls lc
JOIN prompts p ON p.id = lc.prompt_id
LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
CROSS JOIN brands b
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
  AND b.country = 'SK'
  AND p.category != 'validation'  -- exclude validation prompts
GROUP BY b.id, b.name, p.category, p.subcategory;
```

### 9.4 Rendering

Heatmap kde:
- Rows = brands (top 10)
- Columns = subcategories (30)
- Cell color = SoV intensity (red=low, green=high)

Pre brand reading: pozeráš sa na **svoj riadok** a vidíš kde sú červené (gaps).

### 9.5 Validation

- **M17 Top 10 gaps manual review** - z auto-detected gaps, koľko je legitimate vs methodology issue
- **Sample size check:** Per cell mali by sme aspoň 10 responses inak unreliable.

---

## 10. METRIC: Win/Loss Matrix vs Competitors

**Reporting locations:**
- Competitive Benchmark - main chart

### 10.1 Definition

Pre dvojicu brandov (A vs B), pre každú kategóriu:
- **Win** = brand A SoV > brand B SoV by >5pp
- **Loss** = brand A SoV < brand B SoV by >5pp
- **Tie** = within 5pp

### 10.2 Source prompts

Všetky non-validation prompty filtered per kategória.

### 10.3 Data source

```sql
WITH brand_category_sov AS (
  SELECT
    b.id AS brand_id,
    b.name,
    p.category,
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
      NULLIF(COUNT(DISTINCT lc.id), 0) * 100 AS sov_pct
  FROM brands b
  CROSS JOIN llm_calls lc
  JOIN prompts p ON p.id = lc.prompt_id
  LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
  LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
  WHERE b.name IN ($1, $2)  -- target brand + 1 competitor
    AND lc.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY b.id, b.name, p.category
)
SELECT
  category,
  MAX(sov_pct) FILTER (WHERE name = $1) AS brand_a_sov,
  MAX(sov_pct) FILTER (WHERE name = $2) AS brand_b_sov,
  CASE
    WHEN MAX(sov_pct) FILTER (WHERE name = $1) - MAX(sov_pct) FILTER (WHERE name = $2) > 5 
      THEN 'win'
    WHEN MAX(sov_pct) FILTER (WHERE name = $1) - MAX(sov_pct) FILTER (WHERE name = $2) < -5 
      THEN 'loss'
    ELSE 'tie'
  END AS outcome
FROM brand_category_sov
GROUP BY category;
```

### 10.4 Rendering

```
PLANEO vs ALZA - Win/Loss Matrix

Category                 Planeo   Alza    Diff      Outcome
─────────────────────────────────────────────────────────
Discovery                18.2%    67.1%   -48.9pp    LOSS
Smartphones              12.4%    71.3%   -58.9pp    LOSS
Laptops                  15.1%    64.0%   -48.9pp    LOSS
TVs                      34.2%    37.8%   -3.6pp     TIE
White Goods              41.3%    28.6%   +12.7pp    WIN
Audio                    22.1%    44.7%   -22.6pp    LOSS
Gaming                    8.4%    52.1%   -43.7pp    LOSS
Use Case                 24.3%    55.0%   -30.7pp    LOSS

Overall: 1 WIN, 1 TIE, 6 LOSSES
```

### 10.5 Validation

Built on top of SoV (Section 1). Inherits SoV validation.

---

## 11. METRIC: 5 Biggest Opportunities (Cross-brand)

**Reporting locations:**
- Industry Report (3 pages)

### 11.1 Definition

Cross-brand insights identifying **opportunities ktoré platia pre celý market** alebo for specific underserved segments.

### 11.2 Reasoning - kde vznikajú opportunities?

**Opportunity = gap medzi user demand a brand supply.**

Sources of gaps:

**Type A: Underserved categories**
- Vysoký query volume (n promptov × n LLMs = high response count)
- Nízka concentrated SoV (žiadny brand dominuje, top 1 má <30% SoV)
- → Open market, kto první invests in content vyhrá

**Type B: Citation deserts**
- AI nemá pre topic spoľahlivé sources
- AI generally refusing alebo vague
- → Brand ktorý vytvorí authoritative content sa rapidly stane go-to

**Type C: Hallucination clusters**
- AI hallucinuje fakty pre danú kategóriu
- → Brand ktorý publishuje structured data, schema markup vyhrá

**Type D: Sentiment imbalances**
- Specific brand má high SoV ale negative sentiment
- → Konkurencia môže useknúť market share s pozitívnym positioning

**Type E: Cross-LLM differential**
- Brand dominuje v 1 LLM ale absent v 3 iných
- → Brand investing v Google content (Gemini) má upside

### 11.3 Identification queries

**Type A: Underserved categories**
```sql
SELECT
  p.subcategory,
  COUNT(DISTINCT lc.id) AS total_responses,
  MAX(sov.sov_pct) AS top_brand_sov,
  COUNT(DISTINCT sov.brand_id) FILTER (WHERE sov.sov_pct > 5) AS competitive_brands
FROM (
  SELECT 
    p.subcategory, bm.brand_id,
    COUNT(DISTINCT bm.raw_response_id)::numeric / 
      NULLIF(COUNT(DISTINCT lc.id), 0) * 100 AS sov_pct
  FROM ...
) sov
JOIN prompts p ON ...
GROUP BY p.subcategory
HAVING MAX(sov.sov_pct) < 30  -- žiadny brand nedominuje
  AND COUNT(DISTINCT lc.id) > 50  -- ale je tam volume
ORDER BY total_responses DESC;
```

**Type B-E:** Podobné queries s rôznymi conditions.

### 11.4 Sonnet-generated opportunity descriptions

Po data extraction, Claude Sonnet generuje narratívny popis. Input:

```json
{
  "opportunity_type": "underserved_category",
  "subcategory": "refurbished_iphone",
  "total_responses": 124,
  "top_brand_sov": 18.2,
  "top_brand": "alza",
  "competitive_brands": 3,
  "sample_prompts": [
    "Kde kúpiť repasovaný iPhone na Slovensku?",
    "Repasovaný iPad - kde má najlepšiu cenu?"
  ]
}
```

Output: 1-page Sonnet-generated opportunity description s actionable recommendations.

### 11.5 Validation

- **Manual review:** Tomas pred publikáciou pozre všetkých 5 opportunities, valida sample prompts
- **Counter-evidence test:** Pre každú opportunity, je tu evidence proti? (Niekto už dominuje tento segment ale my nemáme dáta?)

---

## 12. METRIC: Anomaly Detection (week-over-week changes)

**Reporting locations:**
- Mentivue Pulse newsletter (každý štvrtok)
- Internal weekly review

### 12.1 Definition

Identifikácia signifikantných zmien medzi súčasným a predchádzajúcim týždňom.

### 12.2 Detection algorithm

```python
def detect_anomalies(current_week_metrics, prior_week_metrics):
    anomalies = []
    
    for brand in brands:
        # SoV change
        current_sov = current_week_metrics[brand]["sov"]
        prior_sov = prior_week_metrics[brand]["sov"]
        delta = current_sov - prior_sov
        
        # Z-score test
        # Std deviation of historical weekly SoV for this brand
        historical_std = get_historical_std(brand)  # ~2pp typically
        z_score = delta / historical_std
        
        if abs(z_score) > 2.5:  # 99% confidence threshold
            anomalies.append({
                "brand": brand,
                "metric": "sov",
                "delta": delta,
                "z_score": z_score,
                "direction": "up" if delta > 0 else "down"
            })
        
        # Position change
        # Sentiment change
        # ... similar for other metrics
    
    return anomalies
```

### 12.3 Reasoning - prečo anomaly?

Pre každú anomaly, treba identifikovať príčinu. Hypotézy:

**H1: Citation source change**
- New source started citing brand
- Existing source stopped citing brand
- Test: pozri new citation sources za posledný týždeň

**H2: New content piece**
- Heureka pridala "Top eshops 2026" 
- Test: search Google "top eshopy 2026 slovensko" pre fresh content

**H3: Model update**
- ChatGPT updatovaný môže mať iný behavior
- Test: anomalies cross-LLM? Ak iba 1 LLM → model update.

**H4: Real event**
- Brand mal výpredaj/akciu
- Test: scan brand's social media, news

**H5: Random noise**
- Štatistická fluktuácia
- Test: z-score iba marginally significant

### 12.4 Anomaly investigation prompt

Pre top 3 weekly anomalies, Claude Sonnet generuje hypothesis:

```typescript
const ANOMALY_INVESTIGATION_PROMPT = `
Anomaly detected:
- Brand: {brand}
- Metric: {metric}
- Change: {delta} ({z_score} z-score)
- Direction: {direction}

Sample queries kde nastala zmena:
{sample_responses_diff_json}

New citation sources tento týždeň:
{new_citations_json}

Generate 2-3 hypothesises pre túto zmenu. Pre každú:
- hypothesis: krátky popis
- evidence: čo o tom svedčí
- check_action: ako overiť (research action)

JSON output.
`;
```

### 12.5 Pulse newsletter integration

Top 1 anomaly + hypothesis → ide do weekly Pulse newsletter ako "Týždňový insight".

---

## 13. METRIC: Refusal Rate

**Reporting locations:**
- Per-Brand Audit "AI Knowledge Gap" sekcia
- Internal quality monitoring

### 13.1 Definition

Percento responses kde AI odmietla odpovedať alebo dala neuseful answer.

### 13.2 Source

Z `response_quality.refused_to_answer` flag (Step 4 extraction).

### 13.3 Reasoning - kedy AI odmietne?

**Reason A: Insufficient information**
- "Nemám aktuálne informácie o..."
- "Nie som si istý, odporúčam overiť..."

**Reason B: Safety filter**
- Veľmi zriedkavé v našom doméne

**Reason C: Out-of-scope**
- "Špecifické cenové porovnania nemôžem poskytnúť..."

**Reason D: Brand non-recognition**
- AI nevie čo je "TPD.sk"
- "Nepoznám tento konkrétny eshop..."

### 13.4 Aggregation

```sql
SELECT
  lc.provider,
  p.category,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE rq.refused_to_answer = true) AS refused,
  ROUND(COUNT(*) FILTER (WHERE rq.refused_to_answer = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2) AS refusal_rate_pct
FROM llm_calls lc
JOIN response_quality rq ON rq.llm_call_id = lc.id
JOIN prompts p ON p.id = lc.prompt_id
WHERE lc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY lc.provider, p.category;
```

### 13.5 Per-brand non-recognition

Pre menšie brandy je dôležitý "non-recognition" rate:

```sql
-- Pre brand X, koľko queries vrátilo "nepoznám tento eshop"
SELECT
  COUNT(*) AS queries_about_brand,
  COUNT(*) FILTER (WHERE rr.response_text ILIKE '%nepoznám%' 
                     OR rr.response_text ILIKE '%nemám informácie%') AS non_recognition_count
FROM raw_responses rr
JOIN llm_calls lc ON lc.id = rr.llm_call_id
JOIN prompts p ON p.id = lc.prompt_id
WHERE p.text ILIKE '%' || $1 || '%'  -- brand name in prompt
  AND lc.created_at >= NOW() - INTERVAL '30 days';
```

### 13.6 Validation

- **M19 Refusal classification** - manuálne kategorizovať 30 refused samples mesačne

---

## 14. Cross-Metric Consistency Checks

Po výpočte všetkých metrik, robíme **consistency check**:

### 14.1 Internal consistency

| Check | What to verify |
|---|---|
| SoV + Position correlation | Brands s vyššou SoV majú typically lepšiu position (r > 0.5) |
| Sentiment + SoV correlation | Slabšia korelácia, lebo negativy pumping volume |
| Citation diversity + SoV | Korelácia ~0.6 typically |
| Mention count + SoV | Vždy v sync (sanity check) |

### 14.2 Anomaly cross-validation

Ak Alza padne v SoV: padla aj v position? V sentiment? V citation count? Ak iba SoV → drill into. Ak konzistentne padá → real trend.

---

## 15. Report Generation Flow - end-to-end

Pre **Mentivue Index Snapshot (homepage)**:

```
Cron: 03:00 daily
  ↓
1. SQL: Refresh materialized views
   - mv_daily_brand_sov
   - mv_30day_brand_metrics
   - mv_top_citations
   ↓
2. Apply LLM market share weights → composite metrics
   - weighted_sov per brand
   - weighted_position per brand
   - weighted_sentiment per brand
   ↓
3. Compute Mentivue Index Score
   - Apply formula (Section 3.2)
   ↓
4. Generate snapshot data JSON
   - top_15 brands rankings
   - trends (WoW deltas)
   ↓
5. Render homepage component (Next.js ISR)
   - Server-side render with cached data
   - Cache invalidation 24h
```

Pre **Per-Brand Audit (on-demand)**:

```
Stripe webhook: payment received
  ↓
1. Klient form fill: target brand + 3 competitors
  ↓
2. Run brand-specific extra queries (overnight)
   - Tier 1 + Tier 2 prompts × 4 LLMs
   - Validation prompts × 4 LLMs (hallucination, negatives)
   ↓
3. Aggregation pipeline (all metrics 1-13)
   - Per-LLM breakdown
   - Topic coverage map
   - Citation footprint
   - Sentiment analysis
   ↓
4. Identification of insights (Section 11)
   - Top 10 opportunities (per-brand variant)
   - Quoteable AI statements
   ↓
5. Sonnet narrative generation
   - Executive summary (per brand)
   - Brand spotlight
   - Optimization recommendations
   ↓
6. Recharts rendering server-side
   - SoV trend line
   - Position bar chart
   - Heatmap topic coverage
   - Citation donut
   ↓
7. Puppeteer HTML → PDF
  ↓
8. Upload R2, email deliver, Calendly invite
```

---

## 16. What's NOT in metrics (limitations)

Stojí za to byť úprimní:

- **Conversion impact:** Nevieme či AI mention → web visit → purchase. To je klient's analytics, nie naša doména.
- **Real query volumes:** Pracujeme s curated prompts, nie reálne user search logs.
- **Long-term causality:** Vieme čo sa zmenilo, ale nie vždy prečo. Hypothesises sú best-effort.
- **Multi-language nuances:** Niekedy AI mixne SK/CZ/EN content - klasifikujeme to ako "language correct" liberálne.

---

## 17. Implementation Priority

Pre prvý report (Týždeň 6 launch):

**MUST HAVE (Týždne 1-5):**
- Metric 1: SoV ✓
- Metric 2: Avg Position ✓
- Metric 4: Sentiment ✓
- Metric 5: Citation Sources ✓
- Metric 13: Refusal Rate (basic)

**SHOULD HAVE (Týždne 4-5):**
- Metric 3: Mentivue Index Score
- Metric 6: Per-LLM Preference
- Metric 9: Topic Coverage Map

**NICE TO HAVE (post-launch):**
- Metric 7: Hallucination Rate (potrebuje Facts DB completed)
- Metric 8: Quote Extraction (Step 6 to be added)
- Metric 10: Win/Loss Matrix (pre Competitive Benchmark)
- Metric 11: Cross-brand Opportunities
- Metric 12: Anomaly Detection

---

## 18. Summary Traceability Table

| Metric | Prompts source | LLM behavior | Extraction | Aggregation | Validation |
|---|---|---|---|---|---|
| SoV | 800 non-validation | List of brands | Step 1 (binary mention) | Weighted by LLM share | M1 |
| Position | 800 same | Numbered/bulleted list | Step 1 (position index) | Avg, weighted | M1 |
| Sentiment | 800 + neg validation | Adjectives, attributes | Step 2 (score -1 to 1) | Avg, weighted | M7, M8, M9 |
| Citations | All | URLs in API metadata + text | Step 3 (URL + domain) | Counts, share % | M10, M11, M12 |
| Hallucination | 30 validation | Factual claims | Step 5 (vs Facts DB) | % rate per LLM | M13, M14, M15 |
| Quotes | All | Notable phrases | Step 6 (NEW) | Manual + auto select | M21, M22 |
| Mentivue Index | All metrics above | - | Formula | Composite | M3 |
| Per-LLM | All | Compare across LLMs | - | Per-provider grouping | M4, M5 |
| Topic Coverage | All by category | - | - | Cross-tab | M16, M17 |
| Win/Loss | All by category | - | - | Pairwise comparison | M1 (inherited) |
| Opportunities | All + market data | - | Sonnet narrative | Cross-brand analysis | Manual review |
| Anomalies | Time-series | - | Z-test | Statistical | M2 |
| Refusal Rate | All | Refusal indicators | Step 4 | % per LLM | M19 |
