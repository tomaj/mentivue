# Mentivue · Prompt Cadence Strategy

Strategický rozbor: prečo púšťame ktoré prompty kedy, čo z toho ťažíme, koľko to stojí.

---

## 1. The core trade-off

Každý prompt × engine pár stojí:
- **API cost**: $0.001 - $0.015 (depends on LLM + complexity)
- **Latency**: 1-5 seconds wait
- **Compute**: storage, processing, embedding

Každý prompt nám vracia:
- **1 data point** (brand mentions + sentiment + citations)
- **Noise** (LLMs vary even with same prompt)
- **Signal** (only with enough sample size)

**Statistical reality**: 1 prompt v 1 deň = noise. 1 prompt × 7 dní = trend. 1 prompt × 30 dní = signal.

Toto je **fundamentálne dôvod prečo cadence matters** - nie iba pre cost, ale pre **statistical confidence**.

---

## 2. Three-tier cadence framework

Mentivue má **3 frequency tieres** s rôznymi účelmi:

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1 · DAILY (high-frequency, narrow set)                    │
│  ────────────────────────────────────────────                   │
│  Frequency:   Each weekday (Mon-Fri)                            │
│  Prompts:     ~200 (high-commercial-intent only)                │
│  Engines:     ChatGPT + Perplexity (most volatile)              │
│  Cost:        ~$2-3/day = $50-75/month                          │
│  Purpose:     Real-time anomaly detection                       │
│  Audience:    Pro+ subscribers (alerts)                         │
│                                                                  │
│  TIER 2 · WEEKLY (broad set)                                    │
│  ────────────────────────────────────────                       │
│  Frequency:   Every Monday morning                              │
│  Prompts:     ~750 (most prompts)                               │
│  Engines:     All 4 (ChatGPT, Claude, Perplexity, Gemini)       │
│  Cost:        ~$25-35/week = $100-150/month                     │
│  Purpose:     Core trends, weekly Pulse newsletter              │
│  Audience:    All subscribers + free Pulse readers              │
│                                                                  │
│  TIER 3 · MONTHLY (deep + validation)                           │
│  ────────────────────────────────────────                       │
│  Frequency:   1st of every month                                │
│  Prompts:     Full 1 176 + validation set (~1 400)              │
│  Engines:     All 4 + manual quality samples                    │
│  Cost:        ~$80-120/month                                    │
│  Purpose:     Industry Report, Action Reports, audits           │
│  Audience:    Paying customers                                  │
└─────────────────────────────────────────────────────────────────┘

TOTAL: ~$250-350/month for 1 vertical
```

---

## 3. Why tiered frequency works

### 3.1 Statistical reasoning

Aby ste mali **confidence interval ±5%** na metrike Share of Voice, potrebujete:
- Minimum 30 measurements per quarter
- Random distribution across time
- Same engine, same prompt, fresh sessions

**Daily prompts** (high-intent): 30 days × 200 prompts = 6 000 measurements/month per engine. **Very high confidence**.

**Weekly prompts** (broad set): 4 weeks × 750 prompts = 3 000 measurements/month per engine. **Solid confidence**.

**Monthly prompts** (deep set): 1 batch × 1 176 prompts. **One snapshot, but comprehensive**.

Combine all three = **comprehensive picture s statisticky obhájiteľnou confidence**.

### 3.2 Cost vs value reasoning

Daily prompts pre celý 1 176 set:
- Cost: ~$30-50/day = $900-1500/month
- Value: marginal (95% of insights from weekly cadence enough)
- **Diminishing returns**

Vyber 200 najdôležitejších promptov pre daily:
- Cost: ~$2-3/day = $60-90/month  
- Value: high (you catch real-time anomalies)
- **Excellent ROI**

### 3.3 Customer expectation reasoning

**Klient zaplatí €1 490/mes pre Pro tier**. Čo očakáva?
- Týždenné Pulse = expects weekly fresh data
- Monthly Action Report = expects monthly comprehensive
- Real-time alerts = expects 24-48h response to AI shifts

**Tiered cadence presne mapuje na customer touchpoints.** Klient nikdy nevidí "missing data" lebo každý report má svoju frequency.

---

## 4. Which prompts go to which tier?

Toto je najdôležitejšia decision - **klasifikácia 1 176 promptov do 3 tier-ov**.

### TIER 1 · DAILY (~200 prompts)

**Kritériá:**
- High commercial intent ("idem teraz kúpiť X")
- Volatile categories (smartphones, gaming, fashion)
- Trending topics (new product launches)
- Top 5 brands focus

**Príklady (z prompts-sk.yaml):**

```yaml
# High commercial intent (volatile)
sk-commercial-intent-0001: 
  text: "Kde dnes kúpim iPhone 17 Pro v SR?"
  frequency_tier: daily
  
sk-commercial-intent-0023: 
  text: "Najlepšia cena MacBook Pro M4 tento týždeň"
  frequency_tier: daily
  
sk-commercial-intent-0045: 
  text: "PlayStation 5 dostupný teraz v SR?"
  frequency_tier: daily

# Top brand discovery
sk-discovery-0012: 
  text: "Najlepší slovenský eshop na elektroniku 2026"
  frequency_tier: daily
  
sk-discovery-0034:
  text: "Alza vs Datart - kde nakúpiť lepšie"
  frequency_tier: daily

# Sentiment-sensitive
sk-trust-0008:
  text: "Skúsenosti s reklamáciou v Alza"
  frequency_tier: daily
```

**Cieľ daily tier:** **Real-time anomaly detection**. Keď sa niečo zmení (Datart spustil kampaň, Apple update, atď.), vidíme to do 24-48h.

### TIER 2 · WEEKLY (~750 prompts)

**Kritériá:**
- Standard buyer-intent queries
- Category-level queries
- Comparison queries
- Long-tail product specifics
- Use-case queries

**Príklady:**

```yaml
# Standard discovery
sk-discovery-0001: 
  text: "Najlepší eshop pre nákup notebooku v SR"
  frequency_tier: weekly

# Comparison
sk-comparison-0023: 
  text: "Alza alebo Hej.sk - aký je rozdiel"
  frequency_tier: weekly

# Long-tail
sk-long-tail-0067:
  text: "Akú smart trouhu kúpiť do 500 eur 2026"
  frequency_tier: weekly

# Use case
sk-use-case-0034:
  text: "Notebook pre programátora s rozpočtom 2000 eur"
  frequency_tier: weekly
```

**Cieľ weekly tier:** **Pulse newsletter + Monthly Action Report data**. Solid baseline pre celý product offering.

### TIER 3 · MONTHLY (~300 prompts) + VALIDATION

**Kritériá:**
- Edge cases
- Niche queries  
- Validation prompts (M1-M22 methodology)
- Hallucination checks
- Cross-LLM consistency probes
- Specific product deep dives

**Príklady:**

```yaml
# Validation - hallucination check
sk-validation-0001:
  text: "Aké sú Alza pobočky v Trnave?"
  frequency_tier: monthly
  validation_type: hallucination_check
  ground_truth: "Alza má v Trnave 1 pobočku v OC Max"

# Edge case
sk-niche-0023:
  text: "Najlepší slovenský eshop pre profesionálnu fotografiu drónom"
  frequency_tier: monthly

# Cross-LLM consistency
sk-validation-0067:
  text: "Otvárací čas Alza Banská Bystrica"
  frequency_tier: monthly
  validation_type: cross_llm_consistency
```

**Cieľ monthly tier:** **Industry Report comprehensiveness + methodology validation**. Toto je čo robí Mentivue research-grade, nie iba analytics-grade.

---

## 5. The actual cron schedule

```
DAILY (weekday):
  03:00 UTC - ChatGPT batch (200 prompts)
  04:00 UTC - Perplexity batch (200 prompts)
  05:00 UTC - Process & extract
  06:00 UTC - Anomaly detection
  07:00 UTC - Alert generation (if needed)

WEEKLY (every Monday):
  02:00 UTC - ChatGPT batch (750 prompts)
  03:00 UTC - Claude batch (750 prompts)
  04:00 UTC - Perplexity batch (750 prompts)
  05:00 UTC - Gemini batch (750 prompts)
  06:00 UTC - Aggregate processing
  09:00 UTC - Weekly digest ready (for Pulse Writer)

MONTHLY (1st of month):
  Day 1 03:00 UTC - Full validation set (1 176 + 300 validation)
  Day 1 04:00 UTC - 4 engines in parallel
  Day 1 10:00 UTC - Cross-LLM consistency analysis
  Day 1 14:00 UTC - Monthly aggregations
  Day 2 - Tomas QA review
  Day 3 - Industry Report draft generated
  Day 4 - Action Reports per Pro subscriber
  Day 5 - Reports sent
```

### Why these times?

- **03:00 UTC** = 04:00 SEČ (Slovakia winter), 05:00 SELČ (summer)
- We avoid peak hours (US East Coast = 9 AM EST = 14:00 UTC)
- LLM API rate limits more lenient overnight
- Tomas wakes up to fresh data + alerts in morning briefing

---

## 6. Benefits & how to use them

### Benefit 1: Real-time anomaly detection (daily tier)

**Scenario:** Streda večer ChatGPT update releases. Sentiment voči Alza klesá o -0.4 vo viacerých prompts.

**Without daily tier:** Catch this on Monday weekly batch. **5-day lag.**

**With daily tier:** Detected štvrtok ráno (24h after change). Email alert k klientom, "ChatGPT release related sentiment shift detected".

**Business value:**
- Klient nemusí monitorovať sám
- **First-to-know advantage**
- Justifies €1 490 subscription ("dostali sme alert pred konkurenciou")

### Benefit 2: Predictable content cadence (weekly tier)

**Scenario:** Týždenný Pulse newsletter potrebuje fresh data, written na základe minulého týždňa.

**Without weekly tier:** Pulse je stará alebo nepresná.

**With weekly tier:** Každý pondelok 09:00 fresh data → Tomas reads → Pulse drafted Tuesday → published Thursday 06:00.

**Business value:**
- Newsletter má credibility (svieže dáta)
- Lead capture pre Watch tier
- Authority building cez pravidelný editorial output

### Benefit 3: Comprehensive monthly reports (monthly tier)

**Scenario:** Klient zaplatí €2 990 za Per-Brand Audit. Klient zaplatí €299 za Industry Report.

**Without monthly deep tier:** Reports sú stavané iba na daily/weekly data → menej hĺbka, žiadne validation.

**With monthly tier:** Reports majú:
- Comprehensive 1 176 prompt coverage
- Validation (M1-M22) confidence scores
- Cross-LLM consistency analysis
- Edge cases included

**Business value:**
- Premium pricing justified (€2 990 nie je "drahý dashboard")
- Methodology transparentnosť (transparentne publish: "M22 validation passed")
- Defensible moat voči competitors (Profound nemá toto)

### Benefit 4: Statistical confidence (combined)

**Scenario:** Klient sa pýta "Aká je naozajstná SoV trend Alza za posledných 90 dní?"

**Bez tiered cadence:** Buď máte iba mesačné dáta (4 datapoints) alebo iba daily (drahé). Confidence interval široký.

**S tiered cadence:** 
- 90 daily measurements pre top prompts (high confidence)
- 12-13 weekly measurements pre broad set (medium confidence)  
- 3 monthly measurements pre full set (anchor points)
- Combined: ~100+ datapoints per metric, **±2% CI**.

**Business value:** Vy môžete tvrdo claim "Alza SoV stúpa +1.4pp s confidence 95%". To je **research-grade**, nie blogová úvaha.

### Benefit 5: Cost optimization

**Without tier strategy:** All daily = $900+/month per vertikál. Pri 4 vertikálach = $3 600/month = $43k/year just on LLM API.

**With tiered:** $250-350/month per vertikál. Pri 4 vertikálach = $1 400/month = $17k/year. **60% savings**.

**Business value:** Profit margin extension. Pri €350k Y1 revenue, $20k saved = 6% margin lift.

### Benefit 6: Quality vs speed balance

**Scenario:** Klient si pýta "ako sa mi darí túto chvíľu?"

**Tiered cadence umožňuje:**
- **Realtime view** (daily tier last 24h)
- **Trend view** (weekly tier last 4 weeks)
- **Comprehensive view** (monthly tier last quarter)

Všetky 3 v jedinom dashboard view. Klient vidí krátkodobý šum **a** dlhodobý trend súčasne.

---

## 7. Mapping cadence to product touchpoints

Tu je čo robíte s output každej cadence tier:

```
DAILY TIER OUTPUTS:
  ├─ Real-time SoV monitoring (Pro+ dashboard)
  ├─ Anomaly alerts (email + Slack)
  ├─ Daily heatmap update (admin internal)
  └─ Trending topic detection (for next Pulse)

WEEKLY TIER OUTPUTS:
  ├─ Pulse newsletter content (Thursday 06:00)
  ├─ Klient dashboard weekly refresh
  ├─ Mentivue Index recalculation
  ├─ Citation source ranking update
  └─ Competitor SoV trend lines

MONTHLY TIER OUTPUTS:
  ├─ Industry Report (1st of month)
  ├─ Action Reports per Pro klient (1st-3rd)
  ├─ Methodology validation report (internal)
  ├─ Quarterly aggregation prep
  └─ Per-Brand Audit deep dive data
```

**Critical insight:** Każdy customer touchpoint má dedikovanú cadence. Klient nikdy nedostane "stale data" v deliverable - vždy svieže pre ten konkrétny use case.

---

## 8. Cost-benefit math per cadence

| Tier | Monthly LLM cost | Monthly value generated |
|------|------------------|-------------------------|
| Daily | $60-90 | Real-time alerts (justifies €490+/mes Pro retention) |
| Weekly | $100-150 | Pulse newsletter (drives signups, ~30% convert to paid) |
| Monthly | $80-120 | Reports (direct revenue: €299 + €2 990 + €1 490/mes) |
| **Total** | **$250-350** | **Supports €30k-100k MRR potential** |

**ROI:** 1:100 minimum, 1:300+ at scale.

This is **insane unit economics** - jeden z najlepších v SaaS-y.

---

## 9. Special cadence scenarios

### 9.1 Event-triggered (irregular)

Niektoré prompty bežia **iba pri eventoch**:
- LLM model update (ChatGPT 5 release) → spustí "post-update validation" set
- New brand added → spustí "baseline calibration" run
- Quarterly methodology update → spustí "consistency check" set

Toto sú **on-demand runs**, nie cron-based. Volajú sa cez admin dashboard alebo agent trigger.

### 9.2 Seasonal boost (calendar-driven)

V určitých obdobiach **dočasne zvýšte frequency**:
- **Black Friday week** (november posledný týždeň): all-tier daily
- **Vianočná sezóna** (december 1-24): all-tier daily
- **Sales seasons** (zľavy elektroniky): weekly → daily upgrade

Cost spike ~$200/month extra, ale **najdôležitejší period** pre klientov.

### 9.3 Klient-specific custom prompts (Pro tier feature)

Pro klient si môže zadať **5-10 custom prompts** (mimo 1 176 base set):

```yaml
custom_prompts_alza:
  - text: "Alza Black Friday 2026 - kedy začne?"
    frequency: daily (Nov-Dec)
    klient_id: alza
    custom: true
    
  - text: "Alza B2B nákup pre firmy"  
    frequency: weekly
    klient_id: alza
    custom: true
```

**Cost:** ~$5-10/month per klient. **Value:** klient cíti že má personalized service. **Retention impact: huge.**

---

## 10. Implementation strategy

### Phase 1 launch (M0-2): Start lean

```
Week 1-2 build:
  - Weekly tier only (1 176 prompts × 4 LLMs)
  - Monday cron at 02:00 UTC
  - Cost: ~$100/month
  - Validates pipeline end-to-end

Week 3-4 add:
  - Monthly tier (validation set on 1st)
  - First Industry Report generated
  
Week 5-6:
  - Daily tier for top 200 prompts
  - First anomaly alerts to Tomas
  - Public launch
```

### Phase 2 (M3-6): Scale validation

```
Add:
  - Klient-specific custom prompts (Pro tier)
  - Seasonal boost for Black Friday
  - Multi-engine consistency checks
  
Cost growth: $250-350/month
```

### Phase 3 (M6-12): Per-vertical scaling

```
Per new vertical (Banking, Insurance):
  - Add new prompt set (1 000-1 500 prompts)
  - Same tiered cadence
  - Cost: +$250-350/month per vertical
  
Total at 3 verticals: ~$1 000/month
```

---

## 11. Critical mistakes to avoid

### Mistake 1: "Run all prompts every day"

**Why bad:** $1000+/month bez proporcionálneho hodnotového nárastu. 95% insights captured pri weekly cadence.

### Mistake 2: "Run prompts only when klient requests"

**Why bad:** Nemôžete robiť longitudinal analysis. Žiadny trend data. Klient povie "ako sa mi to mení v čase?" → nemáte odpoveď.

### Mistake 3: "Same cadence pre všetky LLMs"

**Why bad:** ChatGPT je 5x volatilnejší ako Gemini. Ak frequency je rovnaké, plytváte budget na stable engines.

**Better:** Daily = ChatGPT + Perplexity. Weekly = all 4. Monthly = all 4 + deep.

### Mistake 4: "Daily prompts cez business hours"

**Why bad:** LLM API rate limits sú prísnejšie cez pracovný čas. Latency je vyššia. Cost môže byť 2x.

**Better:** All scheduled runs medzi 02:00-06:00 UTC keď je US asleep.

### Mistake 5: "Ignore costs early"

**Why bad:** Pri 4 vertikálach a daily-everything = $4 000/month = $48k/year. To je celý angel round.

**Better:** Set up cost alerts at $50/$100/$200/$500/day thresholds. Auto-pause if breached.

---

## 12. Monitoring & alerts pre infrastructure

Critical metrics to track:

```
DAILY:
  - API cost yesterday (alert if > $5)
  - Failed requests (alert if > 1%)
  - LLM response time (alert if avg > 5s)
  - Anomalies detected (count + Tomas notification)

WEEKLY:
  - Total cost this week
  - Promptov processed
  - Data completeness (missing data %)
  - Klient deliverable health

MONTHLY:
  - Total infrastructure cost
  - Cost per klient
  - LLM mix breakdown
  - Quality score trend
```

Implementuj cez `packages/workers/src/agents/cost-monitor.ts` agent.

---

## 13. Strategic implications

### 13.1 Pricing power

Daily tier = "we monitor 24/7" → justifies €1 490/mes
Weekly tier = "weekly refresh" → enables Watch €490/mes  
Monthly tier = "comprehensive deep dive" → drives €2 990 audits

**Bez tiered cadence cannot price-segment correctly.**

### 13.2 Competitive moat

Konkurencia (Profound, Peec) má jednu cadence (usually weekly). **You can claim:**
- "First to detect anomalies in 24h" (daily tier)
- "Most comprehensive monthly coverage" (monthly tier)
- "Statistical confidence ±2%" (combined)

These are **defensible product claims**, nie marketing.

### 13.3 Operational scalability

3-tier cadence is **how you scale to 5+ vertikálov** without 24/7 ops team:
- Daily handles itself (cron + agents)
- Weekly = Tomas Monday morning review (1h)
- Monthly = scheduled report generation (Tomas QA day 2)

**Bez tiered:** Tomas burns out checking dáta každý deň.

---

## 14. Quick reference table

| Frequency | Prompts | Engines | Cost/mes | Output | Audience |
|-----------|---------|---------|----------|--------|----------|
| Daily | ~200 | ChatGPT + Perplexity | $60-90 | Anomaly alerts | Pro+ klients |
| Weekly | ~750 | All 4 | $100-150 | Pulse + dashboards | Everyone |
| Monthly | 1 176 + 300 validation | All 4 + manual | $80-120 | Industry Report + Action Reports | Paying klients |
| Event-trigger | Variable | Variable | $20-50 | Special analyses | Internal use |
| Klient custom | 5-10/klient | All 4 | $5-10/klient | Personalized monitoring | Pro+ klients |

---

## 15. Bottom line

**Tiered cadence is not optional. It's the core operational model.**

Without it:
- Cannot afford to run full set daily ($12k/year wasted)
- Cannot guarantee statistical confidence
- Cannot price-segment tier (Watch/Pro/Enterprise)
- Cannot scale to multi-vertical
- Tomas burns out

With it:
- ~$300/month infrastructure cost (vs $1000+ alternatives)
- Research-grade statistical confidence
- Justifiable pricing tiers
- Scalable to 5+ vertikálov
- Sustainable solo founder operation

**Recommendation:** Implement Week 2-3 of build (after DB schema + first LLM client setup). This is **foundation, not feature**.

Start lean (weekly only), add daily after 30 days of validation, add monthly comprehensive at 60 days. By Phase 1 launch (Week 6) máte all 3 tiers running smoothly.

Cost trajectory:
- M1: $50/month (weekly only)
- M2: $150/month (+ monthly)
- M3+: $250-350/month (+ daily anomaly tier)

This is **research operational model** pre Mentivue.
