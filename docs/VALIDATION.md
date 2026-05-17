# Mentivue - Validation, Traceability & Quality Control

**Companion to PRD.md, ANALYSIS.md, REPORTS.md** - zodpovedá tri otázky:

1. **Traceability:** Pre každú metriku v reportoch, akým spôsobom k nej prichádzame?
2. **Coverage:** Máme prompty ktoré ju spoľahlivo naplnia?
3. **Validation:** Akou metódou overíme, že odpovede sú správne a kvalitné?

---

## 1. Metric Traceability Matrix

Tabuľka mapuje **každú metriku v reportoch** na:
- **Data source** (prompty + LLM responses)
- **Processing layer** (extraction step v ANALYSIS.md)
- **SQL query** (aggregation v ANALYSIS.md)
- **Validation method** (ako vieme že je správna)

### 1.1 Core metrics (Mentivue Index, SoV, trends)

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Share of Voice (SoV)** | Všetky 1096 promptov × 4 LLM | Step 1 (brand extraction) | 3.1 (Daily SoV) | M1: Manual brand mention count na 50 sample responses |
| **SoV trend (WoW)** | Time-series brand_mentions | - | 3.2 (WoW trend) | M2: Statistical significance test (z-test) |
| **Mentivue Index Score** | Composite (SoV + position + sentiment) | Aggregation | 4.1 | M3: Sensitivity analysis na weights |
| **Avg Position** | brand_mentions.position | Step 1 (extraction) | 3.3 | M1: Manual position check 50 samples |
| **Mention count per brand** | brand_mentions | Step 1 | Multiple | M1: Brand alias coverage check |

### 1.2 Per-LLM metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Per-LLM SoV** | llm_calls.provider | Step 1 | 3.6 | M4: Cross-LLM consistency check |
| **Per-LLM preference** | brand_mentions joined to llm_calls | - | 3.6 | M5: Statistical variance |
| **LLM quality score** | response_quality | Step 4 (quality) | 7.3 | M6: Quality scoring calibration |

### 1.3 Sentiment metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Avg sentiment per brand** | brand_mentions.sentiment_score | Step 2 | 3.4 | M7: 100 manually-annotated ground truth |
| **Sentiment distribution** | brand_mentions.sentiment | Step 2 | 3.4 | M7 + M8: Inter-rater agreement |
| **Negative mentions discovery** | sk-validation-* prompts | Step 2 | Filtered 3.4 | M9: Negative sentiment recall test |

### 1.4 Citation metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Top citation sources** | raw_responses.citations | Step 3 | 3.5 | M10: URL extraction accuracy |
| **Domain classification** | Citations + domains taxonomy | Step 3 | Joined w/ taxonomy | M11: Manual domain review |
| **Brand-source affinity** | citations + brand_mentions | - | Custom | M12: Cross-check 20 brand-source pairs |

### 1.5 Hallucination metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Factual claim count** | sk-validation-hallucination_check prompts | Step 5 | Hallucination flags | M13: Ground truth facts DB |
| **Hallucination rate per brand** | hallucination_flags | Step 5 | Aggregated | M14: 50 manual fact-checks |
| **Hallucination rate per LLM** | hallucination_flags + llm_calls | Step 5 | Per-provider grouped | M15: Cross-LLM hallucination differential |

### 1.6 Topic coverage metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Category SoV** | Brand mentions per prompt.category | - | 3.7 | M16: Category labeling consistency |
| **Topic gap analysis** | "Invisibility" - brand mention = 0 | - | 3.8 | M17: Manual review top 10 gaps |
| **Heatmap visibility** | category × brand cross-tab | - | Custom pivot | M16 + M17 |

### 1.7 Quality control metrics

| Metric | Data Source | Processing | SQL Query | Validation |
|---|---|---|---|---|
| **Avg quality score** | response_quality | Step 4 | 7.3 | M18: Score distribution analysis |
| **Refusal rate** | response_quality.refused | Step 4 | Filtered | M19: Manual refusal classification |
| **Language correctness** | response_quality.language_correct | Step 4 | Filtered | M20: SK NLP correctness check |

---

## 2. Coverage Check - máme prompty pre každú metriku?

### 2.1 Coverage status (po pridaní validation promptov)

✓ = ≥10 promptov, △ = 5-9, ✗ = <5

| Metric | Required prompt type | Coverage |
|---|---|---|
| SoV (general) | Discovery open queries | ✓ 250 |
| SoV (per category) | Product-specific × kategórie | ✓ 300 |
| Brand comparisons | Comparison/head_to_head | ✓ 60 |
| Service quality | Trust & service | ✓ 100 |
| Persona-driven recs | Use case prompts | ✓ 100 |
| **Hallucination check** | **Fact-seeking prompts** | **✓ 30 (new)** |
| **Negative sentiment** | **Problem-seeking prompts** | **✓ 25 (new)** |
| **Citation seeking** | **Source-asking prompts** | **✓ 16 (new)** |
| **Stock availability** | **Real-time prompts** | **✓ 15 (new)** |
| **Cross-LLM differential** | **Complex multi-step** | **✓ 10 (new)** |
| **TOTAL** | | **1 096 prompts** |

### 2.2 Coverage analýza pre Per-Brand Audit

Sledujme jeden konkrétny brand (Alza) - aké prompty ho zachytia?

**Direct mentions Alza (predpokladané):**
- ~95% Discovery open queries: "najlepší eshop" → AI spomenie Alza
- ~85% Smartphones: "iPhone 17 SR" → Alza top recommendation
- ~75% Laptops: "MacBook v SR" → Alza
- ~65% Comparison: ak druhý brand je menší, Alza referenced
- ~40% Trust queries: Alza má reputáciu, AI cituje
- ~30% Negative queries: AI tiež identifikuje slabiny

**Total expected Alza mentions:** ~600-700 z 1096 promptov × 4 LLM = **~2 400-2 800 brand_mentions/týždeň** pre Alza.

To je dosť na štatisticky relevantné metriky.

**Pre menšieho hráča (napr. Mironet.sk):**
- ~20% niche/gaming → mentioned
- ~5% celkový → mentioned
- ~50 prompts × 4 LLM = **~200 brand_mentions/týždeň**

Tiež dosť pre indikatívne metriky, ale s vyššou variance.

### 2.3 Coverage gaps which remain

Po pridaní 96 validation promptov, residual gaps:

- **Konkrétne real-time akcie:** "Black Friday Alza 2026 zľavy?" → AI nepozná aktuálne akcie, takže odpoveď bude generic
- **Velmi nišové produkty:** Hi-fi end (Naim, Linn audio) - málokto na SK trhu
- **Influencer recommendation queries:** "Aký eshop odporúča Selassie?" - veľmi nišové
- **Trend riding:** "Top eshop pre AI laptops" - nový segment, AI ešte nemá baseline

**Decision:** Tieto gaps si nechávame ako V2 expansion. Pre V1 Industry Report sú akceptovateľné.

---

## 3. Validation Methods - detailný popis (M1-M20)

Každá metrika má assigned validation method. Tu sú konkrétne procesy.

### M1: Manual Brand Mention Count (sample 50)

**Účel:** Overiť presnosť brand extraction.

**Process:**
1. Random sample 50 raw_responses z DB (rovnomerne rozdelené per LLM)
2. Manuálne prečítaj každú odpoveď
3. Označ všetky brand mentions s pozíciou
4. Porovnaj s automated extraction (brand_mentions table)
5. Spočítaj:
   - **Precision** = correct extractions / total extractions
   - **Recall** = correct extractions / actual mentions
   - **F1 score**

**Cieľ kvalita:**
- Precision > 95%
- Recall > 90%
- F1 > 92%

**Frekvencia:** Týždenne počas prvého mesiaca, potom mesačne.

**Action ak failed:**
- Updateuj brand_aliases v DB
- Iteruj brand extraction prompt v ANALYSIS.md Step 1
- Re-run analytical layer na affected period

### M2: Statistical Significance Test (z-test)

**Účel:** Filter signal vs noise pri WoW/MoM trendoch.

**Process:**
1. Pre každý "trend" v reporte (napr. "Alza padla 2.1%"):
2. Spočítaj z-score:
   ```
   z = (sov_this_week - sov_last_week) / sqrt(
     sov_avg * (1 - sov_avg) * (1/n_this + 1/n_last)
   )
   ```
3. Ak |z| < 1.96 (95% confidence), trend = "noise"
4. Reportuj len significantné trendy

**Action ak fail:** Nepoužívať v reporte ako "trend", iba ako "observation".

### M3: Sensitivity Analysis - Mentivue Index Weights

**Účel:** Overiť že composite score je stable voči zmenám váh.

**Current formula:**
```
mentivue_index = 0.4 × normalized_sov 
              + 0.3 × position_score 
              + 0.3 × sentiment_score
```

**Process:**
1. Pre top 15 brandov, spočítaj rank pri variations:
   - Default weights: (0.4, 0.3, 0.3)
   - SoV-heavy: (0.6, 0.2, 0.2)
   - Position-heavy: (0.2, 0.5, 0.3)
   - Sentiment-heavy: (0.2, 0.3, 0.5)
2. Spočítaj **Spearman rank correlation** medzi rankings
3. Ak ρ < 0.85 → weights sú nestable

**Cieľ:** Spearman ρ > 0.90 across all variations.

**Action ak fail:** Adjust weights tak aby ranking ostal stable, alebo komunikuj uncertainty v reporte.

### M4: Cross-LLM Consistency Check

**Účel:** Detect anomalies kde jedna LLM dáva extreme outliers.

**Process:**
1. Pre každý prompt, spočítaj brand mention set pre každý LLM
2. Spočítaj **Jaccard similarity** medzi LLM pairs:
   ```
   J(A, B) = |A ∩ B| / |A ∪ B|
   ```
3. Ak J(ChatGPT, Claude) < 0.5 pre danú kategóriu → flag pre review
4. Možné príčiny: LLM updatovaný, safety filter, edge case

**Cieľ:** Avg Jaccard similarity > 0.65 across LLM pairs.

### M5: Statistical Variance Check

**Účel:** Identifikovať či per-LLM differences sú signifikantné.

**Process:**
1. ANOVA test cez 4 LLM groups pre každú metriku
2. Reportuj differences len ak F > 4.0, p < 0.01

### M6: Quality Scoring Calibration

**Účel:** Quality score (0-10) musí byť consistent.

**Process:**
1. Vytvor "golden set" 30 manuálne anotovaných responses
2. Anotuj quality score 0-10 podľa Step 4 kritérií
3. Spusti rovnaké responses cez Claude quality scoring
4. Spočítaj **Pearson correlation** medzi human a AI scores
5. Cieľ: r > 0.80

**Frekvencia:** Mesačne re-calibrácia.

### M7: Sentiment Ground Truth Dataset (100 examples)

**Účel:** Sentiment je notoricky subjective, treba ground truth.

**Process:**
1. Vytvor dataset 100 brand_mentions s manuálne anotovaným sentiment:
   - 33 positive (sentiment_score > 0.3)
   - 33 neutral (-0.3 < sentiment_score < 0.3)
   - 34 negative (sentiment_score < -0.3)
2. Anotácia by mali robiť 2 osoby nezávisle (Tomas + 1 z networku)
3. Spočítaj **Cohen's kappa** pre inter-rater agreement
4. Final ground truth: case kde obaja sa zhodli
5. Run automated sentiment cez tieto 100 examples
6. Spočítaj **confusion matrix**

**Cieľ:**
- Cohen's kappa > 0.75 (substantial agreement)
- Sentiment accuracy > 80%
- Negative sentiment recall > 85% (kritické pre brand reputation)

### M8: Inter-rater Agreement Test

**Účel:** Overiť že ground truth annotation je consistent.

**Process:**
1. Tomas + 1 reviewer nezávisle anotujú 30 responses
2. Spočítaj Cohen's kappa:
   - >0.80 = almost perfect
   - 0.60-0.80 = substantial (acceptable)
   - 0.40-0.60 = moderate (need clearer guidelines)
   - <0.40 = poor (redesign methodology)

### M9: Negative Sentiment Recall Test

**Účel:** Špecificky overiť že nestrácame negative signals.

**Process:**
1. Cez sk-validation-negative_sentiment prompts (25 ks)
2. Manuálne identifikuj negatívne tvrdenia v každej odpovedi
3. Porovnaj s automated detection
4. Cieľ: 90%+ recall na negative mentions

### M10: URL Extraction Accuracy

**Účel:** Citation parsing musí byť presný.

**Process:**
1. Sample 50 raw_responses
2. Manuálne identifikuj všetky URL v odpovedi
3. Porovnaj s extracted citations
4. Spočítaj precision/recall na URLs

**Cieľ:**
- URL extraction precision > 98%
- URL extraction recall > 95%
- Domain parsing accuracy > 99%

### M11: Manual Domain Review

**Účel:** Domain taxonomy musí byť aktuálna.

**Process:**
1. Mesačne extract top 50 new domains z citations
2. Manuálne classify do taxonomy buckets:
   - official, comparison, news, forum, blog, other
3. Update CITATION_DOMAINS dict v ANALYSIS.md

### M12: Brand-Source Affinity Cross-check

**Účel:** Citation patterns sú stable, nie artefakty.

**Process:**
1. Pre top 5 brandov, identifikuj top 5 cited sources
2. Manuálne over že tieto sources skutočne píšu o brand
3. Flag ak source nikdy nereferoval brand → false positive citation

### M13: Ground Truth Facts Database

**Účel:** Bez ground truth nevieš detekovať hallucinations.

**Process:**
1. Pre top 15 brandov, manuálne kurátovať `BRAND_FACTS` v ANALYSIS.md
2. Pre každý brand minimum facts:
   - Headquarters
   - Founded year
   - Apple authorized? (Y/N)
   - Physical stores SK locations
   - Delivery options
   - Payment methods
   - Warranty years
   - Return period days
   - Approximate price range positioning
3. Source: oficiálne brand websites
4. Update kvartálne (alebo keď je oznámená zmena)

**Maintenance overhead:** ~3 hodiny/Q.

### M14: Manual Fact-Check (50 sample)

**Účel:** Overiť hallucination detection.

**Process:**
1. Vybrať 50 random LLM responses z hallucination_check prompts
2. Manuálne fact-check každý faktografický claim
3. Porovnaj s automated detection
4. Spočítaj:
   - **False positive rate** (claim flagged ale je správny)
   - **False negative rate** (claim je nepravdivý ale unflagged)

**Cieľ:**
- False positive rate < 10% (lepšie miss než false alarm)
- False negative rate < 20%

### M15: Cross-LLM Hallucination Differential

**Účel:** Identifikovať ktoré LLMs sú najviac hallucinatívne pre náš trh.

**Process:**
1. Per LLM, spočítaj hallucination rate (% claims contradicting facts)
2. Reportuj v Industry Report ako "AI Reliability Score"

**Insight value:** Brand môže prioritizovať obsah optimalizáciu pre least-hallucinative LLM.

### M16: Category Labeling Consistency

**Účel:** Prompty sú správne klasifikované do kategórií.

**Process:**
1. Sample 100 prompts
2. Externý reviewer (nie Tomas) re-classify do kategórií
3. Spočítaj agreement rate s pôvodnou klasifikáciou

**Cieľ:** > 90% agreement.

### M17: Top 10 Gaps Manual Review

**Účel:** Topic gap analysis musí ukazovať skutočné gaps, nie chyby v data.

**Process:**
1. Z query 3.8, extract top 10 gaps pre target brand
2. Manuálne over 5 z 10 promptov - reálne tam brand nie je spomenutý?
3. Ak true: legitimate gap. Ak false: improve brand extraction.

### M18: Quality Score Distribution Analysis

**Účel:** Quality scores by mali mať reasonable distribution.

**Process:**
1. Plot histogram quality_score pre last 1000 calls
2. Healthy distribution: skewed right, peak okolo 7-8, tail down to 3-4
3. Red flags:
   - Bimodal (some scores ~10 a some ~3) → calibration problem
   - Constant (everything ~7) → quality prompt not differentiating
   - Mostly low (< 5) → systematic prompt issues

### M19: Refusal Classification

**Účel:** Sledovať keď AI odmieta odpovedať.

**Process:**
1. Refused = True classification by Claude
2. Manuálne over 30 refused samples týždenne
3. Categorize refusal reasons:
   - Safety filter (rare in our domain)
   - Ambiguous prompt
   - Out-of-knowledge
   - LLM bug

### M20: SK NLP Correctness Check

**Účel:** AI odpoveď je skutočne v slovenčine.

**Process:**
1. Sample 100 responses týždenne
2. Run cez language detection model (langdetect Python lib)
3. Flag responses kde detected != 'sk'
4. Manuálne pozri:
   - Czech instead of Slovak (common LLM error)
   - English mixed in
   - Romanized output

**Cieľ:** > 95% pure SK output (allowing for some EN technical terms).

---

## 4. Quality Control Process - týždenný rytmus

### 4.1 Daily (automated)

```
Cron 03:00 každý deň:
1. Run quality scoring na všetky včerajšie raw_responses
2. Spočítaj daily SoV per brand
3. Refresh materialized views
4. Compute anomaly scores
5. Generate quality dashboard summary
6. Email alert ak:
   - Daily spend > €15
   - Avg quality score < 5
   - Refusal rate > 20%
   - SoV anomaly |z| > 3
```

### 4.2 Weekly (semi-automated)

```
Každý piatok dopoludnia (Tomas, ~2 hodiny):

1. Pozri quality dashboard za posledný týždeň
2. Sample 20 responses na manual review
3. Sample 5 brand_mentions na position/sentiment check
4. Update brand_aliases ak nejaké new brands sa objavili
5. Note 3 most interesting findings pre Pulse newsletter
```

### 4.3 Monthly (focused validation)

```
1. týždeň každý mesiac (Tomas, ~6 hodín):

WEEK 1:
□ M1: Manual brand mention count (50 samples)
□ M7: Sentiment ground truth check (20 new samples)
□ M14: Hallucination manual fact-check (20 samples)
□ M18: Quality score distribution review

OUTPUTS:
- Quality report document
- Action items pre engineering (prompt fixes, extraction tweaks)
- Update ANALYSIS.md ak treba
```

### 4.4 Quarterly (deep validation)

```
Pred publikáciou Industry Report:

□ Full M1-M20 validation pass
□ Ground truth dataset expansion (+50 samples)
□ Brand facts DB review and update
□ Methodology document update
□ Inter-rater agreement re-test
□ Statistical significance check na všetky reported metrics
□ External review (1 trusted CMO friend reads draft)
```

---

## 5. Validation in Reports - transparency

Mentivue má dbať na vedeckú integritu. **V každom reporte transparentne komunikujeme metodológiu a uncertainty.**

### 5.1 Methodology page (povinná v každom reporte)

```markdown
## Methodology

Mentivue Index Q2 2026 je založený na nasledujúcej metodológii:

**Data Collection:**
- 1 096 carefully curated SK promptov v 7 kategóriách
- 4 AI vyhľadávače: ChatGPT (GPT-5.4 mini), Claude Haiku 4.5, 
  Perplexity Sonar, Gemini 3.1 Flash-Lite
- Tier 1 (15% promptov): denne, Tier 2 (60%): týždenne, 
  Tier 3 (25%): mesačne
- Total responses analyzed in this period: 28 542
- Period: 1. február 2026 - 30. apríl 2026 (90 dní)

**Processing:**
- Brand extraction: Claude Haiku s 15 tracked SK brandov 
  a ich aliasmi
- Sentiment analysis: Claude Haiku, score range -1.0 to +1.0
- Citation parsing: Hybrid regex + LLM
- Quality scoring: 0-10 scale

**Validation:**
- Manual brand mention check: F1 = 0.94 (target >0.92) ✓
- Sentiment ground truth: 100 anotovaných samples, 
  accuracy 84% (target >80%) ✓
- Inter-rater agreement (Cohen's kappa): 0.78 ✓
- Quality scoring correlation s human judgment: r = 0.83 ✓
- Cross-LLM consistency (Jaccard): 0.68 avg ✓

**Limitations:**
- AI search výsledky majú inherentnú variabilitu (±3% SoV 
  variance týždeň-na-týždeň pri stable brandoch)
- Stochasticita LLM outputs môže ovplyvniť individual queries
- Nesledujeme Google AI Overviews (V2)
- Slovak language coverage v Gemini je nižšia (-12% mention 
  rate vs ChatGPT)

**Štatistická významnosť:**
Všetky trendy reportované v tomto dokumente prešli z-test 
significance check pri p < 0.05.

Methodológiu publikujeme transparentne v dokumente 
mentivue.sk/methodology
```

### 5.2 Confidence indicators v reporte

Pri každej kľúčovej metriky pridáme confidence indicator:

```
Alza SoV: 42.1% ± 1.3pp (95% CI)
         ▲ +2.1pp WoW (significant, z=3.2)
```

### 5.3 Data freshness label

```
"Dáta v tomto reporte pokrývajú obdobie 1. február - 30. apríl 2026.
Posledná aktualizácia: 12. máj 2026, 03:00 UTC.
Nasledujúca aktualizácia: Q3 2026 report - 1. august 2026."
```

---

## 6. Feedback Loop - kontinuálne zlepšovanie

### 6.1 Sources of feedback

1. **Klient reklamácia** - "Toto je nesprávne pre náš brand"
   → Investigate, manuálne overiť, update extraction ak treba

2. **Internal QA findings** - z mesačnej M1-M20 valid suite
   → Iteruj prompts a extraction logic

3. **CMO/expert review** - friendly review of report draft
   → Refine narrative, clarify methodology

4. **PR/media response** - "Why does report say X?"
   → Validate, prepare standard answers, FAQ

5. **A/B testing** - rôzne extraction prompts side-by-side
   → Empirically vyberať best version

### 6.2 Iterative improvement log

Maintain `decisions/quality-improvements.md`:

```markdown
## 2026-05-12: Brand alias expansion
Issue: Mironet.cz mentions were not captured for SK brand "Mironet.sk"
Solution: Added alias "mironet.cz" to Mironet brand
Validation: M1 recall improved from 0.89 to 0.93
Effective: Q3 2026 onward

## 2026-04-30: Sentiment prompt refinement
Issue: AI was scoring "ponúka" as positive (should be neutral)
Solution: Updated Step 2 prompt with clearer neutral examples
Validation: Cohen's kappa improved from 0.71 to 0.78
Effective: Immediately
```

---

## 7. What we cannot validate (honesty)

Stojí za to byť úprimní voči klientom aj voči sebe.

### 7.1 Hard limitations

1. **Ground truth pre "actual" SoV neexistuje.** Nevieme aký je "true" share of voice v hlavách všetkých používateľov AI. Náš Mentivue Index je **proxy** - reprodukovateľný a relatívny.

2. **AI output je stochastic.** Tá istá query vráti mierne inú odpoveď. Single point estimates sú menej spoľahlivé než trendy.

3. **LLM models sa menia.** ChatGPT v marci a v máji môže odpovedať inak na rovnakú query bez warning. Náš dataset capture-ne snapshot, nie permanent truth.

4. **Real user traffic distribution nepoznáme.** Naša prompt library reflektuje **hypotetické** otázky, nie skutočné AI search queries. Ak by sme mali access k OpenAI/Google search logs, vedeli by lepšie. Bez toho ide o curated set.

5. **Citation parsing môže miss attribution.** Ak AI parafrázuje source bez URL, nevieme to capture-núť.

### 7.2 Mitigation komunikácia

V every report, transparent disclosure:

> "Mentivue Index je proxy metric reprezentujúca AI search visibility pre brand v relatívnom porovnaní s konkurenciou. Nie je to absolútna meranie "ako často sa o vás hovorí". Pre absolutné metriky (revenue impact, conversions) odporúčame doplniť o vlastný customer survey."

---

## 8. Validation Roadmap - kedy čo robíme

### Pre-launch (Týždeň 1-5)

- [ ] Brand facts DB initial (pre 15 brandov)
- [ ] Brand aliases inicial setup
- [ ] First M1 manual extraction check (10 samples)
- [ ] Quality scoring prompt calibration

### Week 1 of operation (Týždeň 6)

- [ ] First full M1 (50 samples)
- [ ] M20 language correctness baseline
- [ ] Daily quality dashboard live
- [ ] First quality issue ticket triage

### Month 1 (Júl 2026)

- [ ] M7 ground truth dataset (100 samples)
- [ ] M14 first hallucination fact-check (20 samples)
- [ ] Iterate brand extraction prompt based on findings
- [ ] First monthly validation report

### Quarter 1 (do Q3 2026 publish)

- [ ] Full M1-M20 validation pass
- [ ] External reviewer for methodology
- [ ] Methodology page published verejne
- [ ] First quarterly Industry Report goes out s full transparency

### Ongoing (Q4+ 2026)

- [ ] Quarterly deep validation
- [ ] Monthly mini-validation
- [ ] Weekly quality checks
- [ ] Continuous improvement log

---

## 9. Open validation questions

- [ ] Aký % discount na confidence indicators ak validation fails dočasne?
- [ ] Public methodology page - kedy spustiť?
- [ ] Inter-rater pre sentiment: koho druhého angažovať? (Friend who's CMO? Pay €100/100 samples?)
- [ ] DeepSeek/Grok pridať? Zlepší cross-LLM Jaccard?
- [ ] Continuous validation cez golden set: ako automatizovať?
- [ ] Public benchmarks pre comparison: zverejníme naše F1/recall metriky?
- [ ] Self-reported brand corrections: dovolíme brandom poslať feedback na chyby?

---

## 10. Summary - traceability checklist

Pre každú metriku v reportoch musíme byť schopní odpovedať:

✅ **Odkiaľ to vieme?** → Mapped to specific prompts in library
✅ **Ako sa to dostáva do reportu?** → Mapped to SQL queries in ANALYSIS.md
✅ **Ako overíme že je to správne?** → Mapped to M1-M20 validation method
✅ **Aká je naša istota?** → Confidence interval / statistical significance
✅ **Čo robíme keď je to zlé?** → Action plan v feedback loop

**Toto je dokumentačný štandard pre Mentivue.** Bez tejto traceability nemôžeme tvrdiť "autorita".
