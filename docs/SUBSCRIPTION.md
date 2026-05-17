# Mentivue - Subscription Model Design

**Companion to PRD.md, REPORTS.md, SALES_VALUE.md** - addresses the most critical business question:

> **Prečo by klient platil Mentivue stále, nie jednorázovo?**

Bez recurring revenue je Mentivue lifestyle business. S recurring revenue je to scalable company s rastúcou MRR (Monthly Recurring Revenue) a ARR (Annual Recurring Revenue).

---

## 1. The brutal truth - prečo jednorázové reporty nestačia

### 1.1 Lifecycle one-time customer

```
Mesiac 1: Klient kúpi Per-Brand Audit €1 990
Mesiac 2-3: Klient implementuje 3 z 10 odporúčaní
Mesiac 4-6: Klient vidí mierny SoV nárast
Mesiac 7-12: Klient nepýta sa, nepamätá si nás
Mesiac 13: Možno opakovaná objednávka. Možno nie.

Y1 LTV: €1 990. Y2 LTV: ~€500 (pravdepodobnosť opakovania).
```

To je **transactional revenue**. Predviest by sme to mohli, ale nepostavíme z toho firmu s exit valuáciou.

### 1.2 Lifecycle subscription customer

```
Mesiac 1: Klient pripojí Mentivue, dostane onboarding audit
Mesiac 2-12: Klient dostáva continuous insights, akcie
Mesiac 6: Klient prizná že potrebuje Mentivue ako "stewardship layer"
Mesiac 12: Klient renew-uje + zvyšuje subscription tier
Mesiac 24: Klient pridáva ďalšie brandy (multi-brand subscription)

Y1 LTV: €15 000. Y2 LTV: €20 000+. Y3 LTV: €30 000+.
```

To je **expansion revenue**. To je foundation pre Series A.

### 1.3 Key insight

Mentivue **musí být subscription-first**. Per-Brand Audit ako one-off je **acquisition motion**, nie product.

```
One-off Audit (€2 990)  →  Subscription (€1 490/mes)
[Try-it]                    [Live-with-it]
```

Audit ti otvorí dvere. Subscription drží lampu rozsvietenú.

---

## 2. Why would they pay forever - hodnotové piliere

Aby subscription bol obhájiteľný, musí dodávať **5 hodnotových pilierov** continuously:

### Pillar 1: Continuous Intelligence (information advantage)

> "AI sa mení každý týždeň. Ty potrebuješ vedieť že sa zmenilo."

**Hodnota:** Klient nepotrebuje robiť AI monitoring sám. My to robíme za neho 24/7.

**Konkrétne:**
- Týždenné anomaly detection (Hej.sk vyskočilo +18% SoV - prečo?)
- Real-time alerts na major shifts
- Quarterly competitive landscape updates
- New AI model launches a ich impact

**Cancel cost:** Strácaš early warning. Konkurencia vidí, ty nie.

### Pillar 2: Compounding Knowledge (longitudinal advantage)

> "Čím dlhšie si s nami, tým hlbšie chápeš tvoju AI dynamic."

**Hodnota:** Single audit je snapshot. 12 mesiacov audit je film. 24 mesiacov je seriál s plot lines.

**Konkrétne:**
- Year-over-year comparisons
- Seasonal pattern detection (Vianoce vs Back-to-School)
- Long-term competitor strategy reverse engineering
- Trend extrapolation s vyššou accuracy

**Cancel cost:** Strácaš history. Restartovať od nuly = mesiace strát.

### Pillar 3: Workflow Integration (operational advantage)

> "Bez Mentivue tvoje content/PR/marketing tímy plánujú slepo."

**Hodnota:** Mentivue insights sa stávajú **input do týždenných marketing rituálov**.

**Konkrétne:**
- Týždenná Pulse → vstup do content meetingu
- Mesačný Action Report → input do quarterly planning
- Predictive alerts → input do crisis management

**Cancel cost:** Marketing tím sa vráti k "we'll figure it out". Loss of operational rigor.

### Pillar 4: Strategic Advisory (relationship advantage)

> "Nie sme len data. Sme tvoj AI advisor."

**Hodnota:** Subscription = prístup k expertízy, nie len k dátam.

**Konkrétne:**
- Quarterly 60-min strategy call (CMO + Tomas)
- Slack channel pre ad-hoc otázky
- "We saw X, you should know" outreach
- Custom one-page deep-dives na request

**Cancel cost:** Strácaš sounding board. CMOs sú lonely v rozhodnutiach.

### Pillar 5: Insurance Protection (risk advantage)

> "Sledujeme tvoje brand AI reputation. Keď niečo zlomí, dozvieš sa to."

**Hodnota:** Brand reputation v AI = potential PR crisis.

**Konkrétne:**
- Hallucination alerts (AI rozpráva o tebe nepravdy)
- Negative sentiment surge alerts
- Competitor smear detection
- New regulation/policy impact analysis

**Cancel cost:** Si bez safety net. Príde event, dozvieš sa s týždnami oneskorenia.

---

## 3. Subscription tiers - 3-tier model

Nahradzujeme jednoduché "€990/mes" tripple structure ktorá segmentuje trh.

### 3.1 TIER 1: Mentivue Watch (€490/mes)

**Pre koho:** SMB eshopy (€1-10M ročný obrat), 1 brand, light touch.

**Čo dostane:**
- ✓ Týždenné Pulse newsletter (custom k brandu, nie generic)
- ✓ Mesačný 5-stranový Health Snapshot PDF
- ✓ Quarterly 12-stranový Trajectory Report
- ✓ Real-time email alerts pri major SoV shifts (>5pp)
- ✓ Access k self-service dashboard (live SoV monitoring)
- ✗ NIE má strategy calls
- ✗ NIE má action calendars
- ✗ NIE má competitive playbook

**Cieľ:** Acquisition tier, low-barrier entry.
**Target LTV:** €5 880/rok (12 × €490)
**Expected churn:** 15% ročne

### 3.2 TIER 2: Mentivue Pro (€1 490/mes) - flagship

**Pre koho:** Mid-market a väčšie eshopy (€10-100M obrat), serious AI strategy.

**Čo dostane:** Všetko z Watch +
- ✓ Mesačný Action Report (15 strán) s next-30-day playbook
- ✓ Quarterly Full Audit (35 strán) - to čo predtým bol €2 990 audit
- ✓ Quarterly 60-min strategy call (Tomas + klient team)
- ✓ Slack/email priority support (24h response)
- ✓ Custom prompt additions (klient špecifický monitoring)
- ✓ Competitive intelligence updates (2 named competitors tracked)
- ✓ AI vs Paid Search CPM math monthly refresh
- ✗ NIE má multi-brand support
- ✗ NIE má on-demand custom research

**Cieľ:** Core revenue product.
**Target LTV:** €17 880/rok
**Expected churn:** 8% ročne

### 3.3 TIER 3: Mentivue Enterprise (€4 990/mes)

**Pre koho:** Veľké eshopy (€100M+), multi-brand, fully integrated.

**Čo dostane:** Všetko z Pro +
- ✓ Multi-brand support (up to 5 brandov, alebo brand families)
- ✓ Weekly 30-min sync call
- ✓ On-demand custom research (4 hours/mes included)
- ✓ Dedicated Slack channel s Tomas
- ✓ API access pre integrácie s ich BI stack
- ✓ Co-branded internal reports (executive summary brandované pre nich)
- ✓ Priority on new features and beta testing
- ✓ Annual on-site strategy workshop (1-day Tomas visit)

**Cieľ:** Anchor accounts, case studies, references.
**Target LTV:** €59 880/rok
**Expected churn:** 5% ročne

---

## 4. Pricing & packaging logic

### 4.1 Value-based pricing

Cena tieru vs hodnota klientovi:

| Tier | Cena/rok | Estimated impact | ROI |
|---|---|---|---|
| Watch | €5 880 | €30-60k revenue uplift | 5-10× |
| Pro | €17 880 | €150-300k revenue uplift | 8-17× |
| Enterprise | €59 880 | €500k-2M revenue uplift | 8-33× |

ROI multiplikátor rastie s tier-om, lebo klient s vyššími rozpočtami má **väčší absolute upside** z relative improvement.

### 4.2 Annual commit discount

| Pay monthly | Pay annually | Discount |
|---|---|---|
| €490/mes | €4 990/rok | 15% |
| €1 490/mes | €15 200/rok | 15% |
| €4 990/mes | €50 920/rok | 15% |

Annual commit = pre nás predictable cash flow, pre klienta nižší effective price.

### 4.3 First-month discount (acquisition tool)

První mesiac at 50% off:
- Watch: €245 first month
- Pro: €745 first month
- Enterprise: €2 495 first month

Reason: friction reduction. "Try Pro for €745 this month" je easier sell ako "commit €1 490/mes hneď".

### 4.4 One-off products zostávajú

**Per-Brand Audit €2 990** (or €1 990 if subscribed → discount):
- For brands not ready for subscription
- For specific moments (pre-launch, post-rebrand)
- Acquisition path: 30% audit klientov upgraduje na subscription do 60 dní

**Competitive Benchmark €5 990:**
- For one-off competitive intel
- Often during M&A or major strategic decisions

**Custom Research €1 500-15 000:**
- Bespoke projekty
- Enterprise tier includes 4h/mes free

---

## 5. Continuous delivery rhythm - aké touchpointy v každom tieri

Aby subscription bol obhájiteľný, musí mať **rhythm dodávky hodnoty**. Klient musí mať pocit že stále niečo dostáva.

### 5.1 Watch (€490/mes) - rhythm

```
KAŽDÝ ŠTVRTOK 09:00 ─ Mentivue Pulse (custom)
                       - 1 weekly insight pre brand
                       - Trend chart
                       - 1 action recommendation
                       
KAŽDÉHO 1. V MESIACI ─ Health Snapshot PDF (5 strán)
                       - Mentivue Index trend
                       - Top 3 positions wins/losses
                       - 1 priority recommendation
                       
KAŽDÝ KVARTÁL ──────── Trajectory Report (12 strán)
                       - 90-day deep dive
                       - Predictive forecasting
                       - Top 5 opportunities lite
                       
PRI ANOMÁLII ─────────  Email alert (real-time)
                       - "SoV padlo o X% za posledný týždeň"
                       - Likely cause hypotézy
                       - Suggested investigation steps
```

Touchpoints: **4-6 mesačne** (weekly + monthly + alerts).

### 5.2 Pro (€1 490/mes) - rhythm

```
KAŽDÝ ŠTVRTOK ──────── Pulse + Daily snapshot link
KAŽDÉHO 1. V MESIACI ─ ACTION REPORT (15 strán)
                       - 30-day playbook (content + PR)
                       - ROI math per action
                       - Competitor moves spotted
                       - "What to ship this month"
                       
KAŽDÝ KVARTÁL ──────── FULL AUDIT (35 strán)
                       - Comprehensive audit
                       - 90-day plan refresh
                       - Strategic implications
                       
KAŽDÝ KVARTÁL ──────── STRATEGY CALL (60 min)
                       - Q+1 priorities
                       - Discuss findings
                       - Custom questions
                       
PRI ANOMÁLII ─────────  Priority alert + investigation
PRI REQUESTE ────────── 24h Slack response on questions
```

Touchpoints: **6-10 mesačne**. Plus on-request.

### 5.3 Enterprise (€4 990/mes) - rhythm

```
TÝŽDENNE ─────────────  30-min sync call
KAŽDÝ ŠTVRTOK ──────── Pulse + executive summary
KAŽDÝ MESIAC ────────── Action Report PER BRAND (multi-brand)
KAŽDÝ KVARTÁL ──────── Full audit per brand + executive briefing
ON-DEMAND ────────────  Custom research projects (4h/mes)
ROČNE ─────────────────  On-site strategy workshop
PRI EVENTOCH ─────────  Real-time crisis support
```

Touchpoints: **20+ mesačne**. Tomas-time intensive.

---

## 6. Continuous delivery - čo je v každom produkte mesačne unique

Najťažšia disciplína subscriptionu: **každý mesiac musíš dodať niečo nové**. Inak klient povie "zase to isté?".

### 6.1 Pulse newsletter - 12 unique týždenných tém

**Týždeň 1-4 (Q3 2026 Cycle):**
1. "AI search SoV shifts" - core movement
2. "Citation source of the week" - kto sa zrazu objavil/zmizol
3. "Sentiment surprise" - non-obvious sentiment change
4. "Industry move spotlight" - competitor action

**Týždeň 5-8:**
5. "Hallucination case study" - AI vymyslela o brande, čo robiť
6. "Cross-LLM differential" - ChatGPT vs Perplexity rozdiely
7. "Topic emerging" - new query pattern detected
8. "Quote of the month" - share-worthy quote z AI

**Týždeň 9-12:**
9. "Predictive watch" - what's coming Q+1
10. "Steal this from competitors" - tactical learning
11. "Anomaly investigation" - prečo sa to stalo
12. "Quarter wrap" - retrospective + Q+1 setup

Plus 12 nových v Q4. Celkom 48 unikátnych weekly themes ročne.

### 6.2 Monthly Action Report - 12 unique focuses

| Mesiac | Theme | Špecifický obsah |
|---|---|---|
| Január | Year Reset | Q4 retrospective, Q1 forecast, planning kit |
| Február | Content Strategy | Yearly content calendar template |
| Marec | Spring Push | Eko, jar, záhrada products |
| Apríl | Q1 Wrap | First quarter review, Q2 setup |
| Máj | Outdoor Season | Cyklo, fitness, summer prep |
| Jún | Mid-year | H1 retrospective, H2 strategy |
| Júl | Back-to-School Prep | Education tech focus |
| August | Pre-Christmas Setup | Holiday season preparation |
| September | Back-to-School | School products execution |
| Október | Black Friday Prep | High-stakes Q4 planning |
| November | Black Friday Execution | Real-time monitoring |
| December | Year Wrap | Annual retrospective, next year plan |

Toto je **calendared content strategy** - vždy fresh, vždy relevantné voči time of year.

### 6.3 Quarterly Full Audit - depth rotation

| Quarter | Special focus (rotated) |
|---|---|
| Q1 | Long-term trajectory analysis (5-quarter view) |
| Q2 | Competitive positioning deep dive |
| Q3 | Citation ecosystem mapping |
| Q4 | Predictive next-year strategy |

Klient po roku má **4 different angle audits**, nie 4 same audits.

---

## 7. Stickiness mechanisms - prečo nezruší

Subscription je o tom **how hard is it to cancel**. Tu sú konkrétne stickiness mechanisms:

### 7.1 Data lock-in (compounding history)

Po 6+ mesiacoch klient má **historical context** ktorý sa nedá obnoviť:
- Year-over-year comparisons
- Trend identification (sezónnosť)
- Long-term competitor playbooks
- Validated predictive models (specific to their brand)

**Cancel = strata 6-12 mesiacov historickej intelligence.**

### 7.2 Workflow integration

Pulse newsletter sa stane **input do týždenného marketing meetingu**:
- "Pozrieme tento týždeň, čo Pulse hovoril"
- Action Report sa stane input do **mesačného planning**
- Strategy call sa stane **kvartálny review milestone**

**Cancel = brokenie etablovaného workflow. Marketing tím musí náhradne riešiť.**

### 7.3 Slack/email habit

Pro+ klienti vedia že môžu poslať otázku a 24h dostanú odpoveď:
- "Ako reagovať na to čo Datart spravil minulý týždeň?"
- "Pred launchom novej kampane, čo skontrolovať?"

**Cancel = strata advisory layer. CMO sa vráti k jeho vlastným odhadom.**

### 7.4 Custom prompts (Pro+)

Klient si zadá špecifické monitoring prompts:
- "Sleduj Alza vs Datart v 'gaming PC' kategorii"
- "Track sentiment changes after our new commercial"

Tieto sú **bespoke setup ktorý sa nedá ľahko replikovať** u konkurenta.

### 7.5 Multi-brand consolidation (Enterprise)

Enterprise klienti s viacerými brandami majú **single source of truth**:
- Reporty pre Alza + AlzaTech + Alza Business
- Consolidated executive dashboard
- Cross-brand insights

**Cancel = treba si vybudovať vlastný setup pre 5 brandov. Massive operational cost.**

### 7.6 Co-branding (Enterprise)

Enterprise reporty obsahujú co-branded executive summaries. To klient používa interne na board reporting. Cancel = ich board narratíva sa rozbije.

---

## 8. Retention KPIs

Sledujeme tieto metriky aby sme vedeli či subscription funguje:

### 8.1 Health metrics

- **Monthly Churn Rate** target: <10% Watch, <6% Pro, <4% Enterprise
- **Net Revenue Retention (NRR)** target: >110% (expansions > churn)
- **Logo Retention** target: >85% Y1, >90% Y2
- **Average Subscription Length** target: >18 mesiacov

### 8.2 Engagement metrics

- **Pulse Open Rate** target: >50% weekly
- **Action Report Download Rate** target: >80% within 3 days
- **Strategy Call Attendance Rate** target: >85% scheduled
- **Slack Message Frequency** target: >2/mesiac Pro+

### 8.3 Expansion metrics

- **Tier Upgrade Rate** Y1 target: 25% Watch → Pro, 15% Pro → Enterprise
- **Add-on Purchase Rate** target: 30% subscribers buy 1+ add-on/year
- **Multi-brand Expansion** target: 20% Pro klientov add 2nd brand do 12 mes

### 8.4 Quality signals

- **NPS** target: >50 (great), >65 (world-class)
- **Renewal Survey Score** target: >4.5/5

Pri akýchkoľvek odchýlkach → root cause analysis a immediate fix.

---

## 9. Anti-churn playbook - keď klient signalizuje exit

### 9.1 Warning signs

- Pulse open rate padá pod 30% po 2 mesiacoch
- Strategy call no-show 2× za sebou
- Žiadne Slack interakcie 30+ dní
- Action Report nestihnutý download 2× za sebou
- Explicit "we're reviewing budget" mention

### 9.2 Intervention sequence

**Trigger 1 (yellow):** Engagement drop
→ Tomas pošle "Hi, všimol som si že ti chýbal posledný call. Všetko OK?"

**Trigger 2 (orange):** Multiple signals + budget mentioned
→ "Quarterly business review" call zorganizovaný extra
→ Personalized "your top 3 wins from last quarter" summary
→ Pricing flexibility offer (annual commit, downgrade temporarily)

**Trigger 3 (red):** Explicit cancel intent
→ Founder save call (Tomas)
→ "What would have to be true to keep us?"
→ Custom retention offer (3 mesiace free, downgrade s gradient back-up)

### 9.3 Win-back motion

Klient ktorý ne-renewuje:
- 3 mesiace neskôr: "What we've added since you left" email
- 6 mesiacov neskôr: "Q+2 industry trends we'd discuss" outreach
- 12 mesiacov: "1-year anniversary of your last audit - free refresh" offer

20% lost clients sa vráti do 12 mesiacov ak well-managed.

---

## 10. Switching costs - prečo nepôjde ku konkurencii

Konkurencia príde. Profound expanduje do EU. Peec AI ide na CEE. Ako sa udržíme?

### 10.1 Slovak language moat

Profound a Peec robia **anglické promptovanie** s translation layer. Mentivue robí **nativnu SK metodológiu**:
- Slovenské lexikon sentiment markers
- SK e-commerce terminológiu
- SK PR contact database
- SK media landscape mapping

**To sa nedá replikovať bez 6-12 mesiacov local research.**

### 10.2 Historical data moat

Mentivue klient po 12 mesiacoch má:
- 52 týždňov Pulse insights
- 12 mesačných Action Reports
- 4 quarterly Full Audits
- 4 strategy call recordings
- Historical predictive accuracy

**Switching = strata všetkého. Nový dodávateľ začína od nuly.**

### 10.3 Workflow lock-in

Slack channel, calendar invites, internal templates, board reporting references. **Operational integration costs to undo.**

### 10.4 Trust moat

Tomas-as-advisor relationship. CMO ma "guy who knows our business". **Personality-driven trust nie je commodity.**

---

## 11. Revenue projection - subscription model

Konzervatívne scenariáre Y1-Y3:

### 11.1 Y1 (rok 1, post-launch)

Mesiac (T = mesiac od launch):

| Mesiac | Watch | Pro | Enterprise | MRR | Cumulative ARR |
|---|---|---|---|---|---|
| T+0 | 2 | 1 | 0 | €2 470 | €29 640 |
| T+3 | 8 | 5 | 1 | €16 360 | €196 320 |
| T+6 | 20 | 12 | 2 | €37 660 | €451 920 |
| T+9 | 35 | 20 | 4 | €66 710 | €800 520 |
| T+12 | 50 | 30 | 6 | €99 240 | €1 190 880 |

**Y1 ARR exit run-rate: ~€1.2M** (s 50 Watch + 30 Pro + 6 Enterprise klientov)

Plus one-off revenue:
- Audity (€2 990 × 30 sales) = €89 700
- Benchmarks (€5 990 × 5) = €29 950
- Custom research (€3 000 avg × 8) = €24 000

**Y1 total revenue projekcie: ~€650-800k** (kombinácia subscription rampup + one-offs).

### 11.2 Y2

| Quarter | Watch | Pro | Enterprise | MRR |
|---|---|---|---|---|
| Q1 | 70 | 45 | 10 | €151 200 |
| Q2 | 95 | 60 | 14 | €204 410 |
| Q3 | 120 | 80 | 18 | €267 220 |
| Q4 | 150 | 100 | 22 | €333 280 |

**Y2 ARR exit: ~€4M**

### 11.3 Y3 (post product-market fit)

Realistic target Y3 ARR: **€8-12M**

S týmto ARR Mentivue má valuáciu €40-80M (5-10× ARR multiplier pre B2B SaaS so subscription stickiness).

---

## 12. Subscription operational requirements

Pre dodávanie continuous value potrebujeme infraštruktúru:

### 12.1 Content production engine

- **Weekly Pulse:** 1 hour Tomas time, mostly AI-generated draft
- **Monthly Action Report:** 4-6 hours Tomas time per klient
- **Quarterly Full Audit:** 8-12 hours Tomas time per klient
- **Strategy Call prep:** 1 hour per call

**Pri 30 Pro klientoch:** 30 × 5h/mes = 150h/mes na monthly reports + 30 × 0.5h/týž (pulse) = 60h/mes = **210h/mes content time**.

To je **viac ako full-time job**. Treba:
- AI automation 70%+ obsahu (Claude Sonnet templated)
- Templated structures
- Reusable components
- Possibly hire jr. analyst po Q2

### 12.2 Customer success rituály

- Pre-renewal call (60 dní pred renewal)
- Quarterly business review
- Monthly check-in (proactive)
- Slack/email response within 24h

To je full job pre niekoho po Y1.

### 12.3 Tech infrastructure

- Klient portal s history + downloads
- Slack bot pre interakcie
- Email automation (Pulse, alerts, reminders)
- Subscription billing (Stripe Billing)
- Usage tracking (KPI metrics)

---

## 13. Risk register subscription model

| Risk | Pravdepodobnosť | Mitigation |
|---|---|---|
| Customer churns after Q1 | High | Strong onboarding, first 90 days hyper-care |
| Pulse becomes generic | High | Per-klient customization in templates |
| Tomas burnout | High | Automation, templating, eventual hire |
| Competitor undercuts | Medium | Stickiness moats (see Section 7) |
| Industry changes (AI search dies) | Low-medium | Diversify metrics beyond AI search |
| Klient internal champion leaves | Medium | Multi-stakeholder relationships |
| Pricing pressure | Medium | Value-based justification, ROI math |

---

## 14. Migration path - od current state

Aktuálny stav: pôvodný plán mal €1 990 audit + €990/mes subscription jednoduchý.

### 14.1 Launch sequence (T6 = launch month)

**Týždeň 6: Public launch**
- Industry Report free preview
- Per-Brand Audit €2 990 (now repositioned ako "Mentivue Audit + 1 month free Pro")
- Subscription tiers communicated ale not yet aktívne

**Týždeň 8: First Watch subscribers**
- Pulse newsletter launched
- 5-10 free Watch tier účastníkov pre testing

**Týždeň 10: Pro tier active**
- First paying Pro subscribers (from audit upgrades)
- Monthly Action Report template ready

**Týždeň 12: Enterprise design**
- First Enterprise pilot s 1 selected anchor klient
- On-demand value testing

### 14.2 Pricing evolution

| Phase | Per-Brand Audit | Watch | Pro | Enterprise |
|---|---|---|---|---|
| Launch (T6) | €2 990 | not active | not active | not active |
| T+1 month | €2 990 | €490 launch | €1 490 launch | not active |
| T+3 months | €2 990 | €490 | €1 490 | €4 990 (1 pilot) |
| T+6 months | €2 990 | €490-590 | €1 490-1 790 | €4 990 |
| T+12 months | €3 490 | €590 | €1 790 | €5 990 |

Postupne tlačíme ceny vyššie ako rastie value perception.

---

## 15. Customer success rituals - operational details

### 15.1 Onboarding (first 30 days)

Pre Pro+ subscribery:

```
DAY 1 ──────── Welcome email + onboarding form
DAY 3 ──────── Kickoff call (60 min, Tomas + klient)
                - Hear klient priorities
                - Configure brand monitoring
                - Set custom prompts
                
DAY 7 ──────── First Pulse delivered (customized)
DAY 14 ─────── First Action Report delivered
DAY 21 ─────── Check-in email (any questions?)
DAY 30 ─────── First 30-day review call (15 min)
                - Highlight 3 wins
                - Confirm direction
```

### 15.2 Ongoing rituals

```
KAŽDÝ ŠTVRTOK ── Pulse delivery (automated)
PRVÝ DEŇ MESIACA ─ Action Report delivery
END OF QUARTER ── Strategy call scheduled
PRED RENEWAL ──── 60-day pre-renewal call
```

### 15.3 Annual highlights

```
T+12 MONTHS ──── Annual Business Review
                  - Year wrap document (custom)
                  - Achievements summary
                  - Next year strategy
                  - Renewal commitment
```

---

## 16. The killer feature - kvôli ktorému zostanú

Každá subscription firma má **1 killer feature** ktorý je decisive value driver. Pre Mentivue identifikujem:

### Option A: Slack-native AI Search Analyst

> "Pýtaj sa Mentivue v Slacku jak svojho colleague."

Klient sa pýta v Slacku:
- "@mentivue ako sme robili minulý týždeň v ChatGPT?"
- "@mentivue čo robí Datart že rastie?"
- "@mentivue ako reagovať na novú AI policy?"

AI agent (Claude Sonnet s tools nad našou DB) okamžite odpovedá.

**Hodnota:** Mentivue sa stáva colleague v Slacku. Cancel = strácaš toho colleague-a.

### Option B: Real-time AI Search Monitoring Dashboard

> "Live view tvojej AI visibility."

Klient otvorí dashboard kedykoľvek a vidí:
- Last 24h SoV trend per brand
- Active alerts
- Anomaly investigation status
- Live competitor moves

**Hodnota:** Insurance feeling. CMO môže kedykoľvek skontrolovať.

### Option C: AI Search Crisis Response

> "Keď AI o tebe rozpráva nepravdu, my to identifikujeme do 24h a poskytneme response playbook."

Klient dostane:
- Real-time hallucination alert
- Severity assessment
- Suggested response strategy
- PR talking points
- Resolution monitoring

**Hodnota:** Brand reputation protection. Indispensable pre risk-averse CMOs.

**Recommendation:** Combine all 3 do Enterprise tier. Pro tier dostane Slack bot + email alerts. Watch tier iba weekly reports.

---

## 17. Critical mindset shift

Pre fungovanie subscription, **Tomas musí prestať myslieť ako "report seller" a začať myslieť ako "client success owner"**.

### 17.1 Mindset checklist

✅ Klient renewal je success metric, nie initial sale
✅ Engagement (Pulse opens, calls attended) je leading indicator
✅ "How can I help you this week?" je core question
✅ Pro-active outreach > reactive support
✅ Tomas time je investícia, nie cost

### 17.2 Daily Tomas rituals (post-launch)

- **Morning 30 min:** Check Mentivue dashboard, identify anomalies for klients
- **Daily:** Reply Slack/email queries within 24h
- **Týždenne:** Pulse production (4-6h)
- **Mesačne:** Action Reports production (20-30h pre Pro klientov)
- **Quarterly:** Strategy calls (5-10h)

### 17.3 Hiring trigger points

- 20 Pro klientov → hire jr. analyst (Action Reports automation)
- 50 Pro klientov → hire customer success manager
- 100 Pro klientov → hire account executive

---

## 18. Bottom line transformation

**Before this redesign:**
- Pricing model: One-off Audit €1 990 + thin subscription €990/mes
- Y1 revenue projection: €273k
- Value prop: "We measure your AI visibility"
- Customer LTV: €3-5k (transactional)

**After redesign:**
- Pricing model: 3-tier subscription €490-4 990/mes + premium one-offs
- Y1 revenue projection: €650-800k
- Y3 ARR target: €8-12M
- Value prop: "Continuous AI search intelligence + advisory + protection"
- Customer LTV: €15-60k (Pro tier), €60-200k (Enterprise tier)

**Key insight:** Mentivue nie je report business. **Mentivue je advisory business s reports ako tangible deliverables.** Tento shift mení economics + valuáciu + spôsob práce.

---

## 19. Open decisions pending

- [ ] Watch tier (€490) - dosť value vs price? Možno €390 entry-level?
- [ ] Enterprise tier pricing - €4 990 je high. Test €3 990 ako lower-friction?
- [ ] Annual commit discount - 15% je optimal? Test 20%?
- [ ] First-month 50% off - cannibalization risk?
- [ ] Slack bot as killer feature - hire AI engineer for build, alebo Claude code sám?
- [ ] Strategy call frequency - Pro quarterly stačí, alebo monthly?
- [ ] Hire customer success after 50 alebo 100 klientov?
- [ ] Watch tier auto-upgrade pri rastúcom usage?

---

## 20. Summary table

| Aspect | One-off model (old) | Subscription model (new) |
|---|---|---|
| Revenue type | Transactional | Recurring (MRR/ARR) |
| Y1 revenue | €273k | €650-800k |
| Y3 ARR target | N/A | €8-12M |
| Customer LTV | €3-5k | €15-200k |
| Valuation multiplier | 1-2× revenue | 5-10× ARR |
| Operational complexity | Low | High |
| Tomas time | Project-based bursts | Continuous |
| Pricing tiers | 1 | 3 |
| Continuous value | No | Yes (5 pillars) |
| Stickiness mechanisms | Weak | Strong (6 mechanisms) |
| Suitable for VC | No | Yes |
| Suitable for acquisition exit | Maybe | Yes (clear scale path) |
