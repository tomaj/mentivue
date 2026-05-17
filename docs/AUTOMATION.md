# Mentivue - AI-Native Automation Playbook

**Companion to PRD.md, PHASED_GTM.md, SUBSCRIPTION.md** - rieši kritickú otázku:

> **Ako spraviť Mentivue tak, aby maximálne fungoval "sám" a moja time investment bola minimum?**

Tento dokument identifikuje **bottlenecky** v každej fáze a definuje **konkrétny automation stack** ktorý ich rieši. Cieľ: znížiť Tomas-time o 60-70% oproti baseline phased plánu, pri zachovaní kvality.

---

## 1. Brutally honest bottleneck audit

Predtým ako navrhneme automation, identifikujme čo ťa **reálne** bude brzdiť. Nielen technika.

### 1.1 Bottlenecky podľa kategórie

| Kategória | % času (baseline) | Automatizovatelné? | Real friction level |
|---|---|---|---|
| **Code/infra development** | 20% | 95% (Claude Code) | Low for Tomas |
| **Content production (reports, Pulse)** | 25% | 90% (templated AI) | Low |
| **Data quality review** | 10% | 60% (auto + human spot-check) | Medium |
| **Klient onboarding** | 10% | 80% (automated flow) | Low-medium |
| **Sales calls + email replies** | 15% | 30% (assistant + templates) | **HIGH** |
| **Strategy & decisions** | 10% | 10% (cannot delegate) | **HIGH** |
| **Marketing/PR/LinkedIn** | 5% | 70% (scheduling, draft generation) | Medium |
| **Customer support / questions** | 5% | 70% (Slack bot + FAQ) | Medium |

**Insight:** Aj keď celkovo 70% sa dá zautomatizovať, **30% non-deletable** je presne to vysoko-friction kde sa Tomas-time tlačí.

### 1.2 Friction sources non-technical

**1. Sales reluctance:**
- Slovenský trh je relationship-driven
- Klienti chcú "stretnúť toho founder-a"
- Cold pitching cez automation generuje 0.1% conversion
- Warm intro cez network generuje 15-25% conversion

**Bypass:** Investovať do **inbound** (content) namiesto outbound. Klient príde sám.

**2. Trust building:**
- Quality reports + transparent methodology + verejné dáta = credibility
- AI-generated content bez human polish = nedôvera

**Bypass:** **AI-first ale ľudsko-validovaný** princip. AI 90%, Tomas final review 10%.

**3. Decision fatigue:**
- Stovky rozhodnutí denne (pricing, response, strategy)
- Bez decision frameworks ti to ukradne energiu

**Bypass:** **Pre-defined playbooks** pre 90% rozhodnutí. AI agent navrhuje, Tomas approve-uje.

**4. Operational fragmentation:**
- Stripe + Resend + Supabase + Vercel + Claude API + Slack + Calendly = chaos
- Switching cost medzi tools je hidden energy drain

**Bypass:** **Single dashboard** ako Tomas command center. Všetko vidieť na 1 obrazovke.

---

## 2. Automation architecture - "Mentivue as agent swarm"

Mentivue nie je SaaS s občasnou automation. **Mentivue je sériou AI agentov ktorí robia 90% práce.**

### 2.1 Agent hierarchy

```
                    ┌──────────────────────┐
                    │  TOMAS (10h/týždeň)  │
                    │  - Strategy          │
                    │  - Client calls      │
                    │  - Final approvals   │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        v                       v                       v
   ┌─────────┐            ┌─────────┐            ┌─────────┐
   │ CONTENT │            │  OPS    │            │  SALES  │
   │ AGENTS  │            │ AGENTS  │            │ AGENTS  │
   └────┬────┘            └────┬────┘            └────┬────┘
        │                      │                      │
   ┌────┴────┐            ┌────┴────┐            ┌────┴────┐
   │ Report  │            │ Klient  │            │ Outreach│
   │ Writer  │            │ Onboard │            │ Drafter │
   ├─────────┤            ├─────────┤            ├─────────┤
   │ Pulse   │            │ Billing │            │ Lead    │
   │ Writer  │            │ Handler │            │ Qual    │
   ├─────────┤            ├─────────┤            ├─────────┤
   │ Quote   │            │ Slack   │            │ Email   │
   │ Curator │            │ Bot     │            │ Replier │
   ├─────────┤            ├─────────┤            ├─────────┤
   │ Action  │            │ Anomaly │            │ Pricing │
   │ Plan    │            │ Watcher │            │ Quoter  │
   └─────────┘            └─────────┘            └─────────┘
```

### 2.2 Agent definitions

**Content Agents (4):**

1. **Report Writer** - Generuje Action Reports, Audits, Industry reports
   - Input: aggregated DB data
   - Output: Markdown → PDF
   - Tomas role: Final 10-min review per output

2. **Pulse Writer** - Generuje weekly newsletter
   - Input: weekly anomaly + insight
   - Output: Personalized newsletter draft per klient tier
   - Tomas role: 5-min review per week

3. **Quote Curator** - Vyberá share-worthy AI quotes
   - Input: raw LLM responses
   - Output: Featured quotes pool
   - Tomas role: Optional cherry-pick

4. **Action Plan Generator** - Generuje 30/60/90-day plans
   - Input: brand metrics + opportunities
   - Output: Calendar-formatted action plan
   - Tomas role: Sanity check unique recommendations

**Ops Agents (4):**

5. **Klient Onboarding** - Vedie nového klienta od signup po first delivery
   - Input: Stripe webhook (new subscription)
   - Output: Welcome emails, kickoff call scheduled, first config form
   - Tomas role: Kickoff call (1× per Pro+ klient)

6. **Billing Handler** - Spravuje subscriptions, renewals, dunning
   - Input: Stripe events
   - Output: Status changes, alert ak churn signal
   - Tomas role: Outreach pri churn risk

7. **Slack Bot** - Odpovedá klient otázky
   - Input: Klient message v Slack
   - Output: AI response s DB context (alebo escalate to Tomas)
   - Tomas role: Handle escalated questions

8. **Anomaly Watcher** - Monitoruje data anomalies
   - Input: Daily metrics
   - Output: Alerts pre relevant klientov
   - Tomas role: Hypothesis validation pri high-confidence anomalies

**Sales Agents (4):**

9. **Outreach Drafter** - Píše personalizované outreach emaily
   - Input: ICP list, lead enrichment data
   - Output: Tomas approval queue (10 emails/deň)
   - Tomas role: 15-min daily approval

10. **Lead Qualifier** - Hodnotí inbound leady
    - Input: Email replies, form submissions
    - Output: Lead score + suggested next step
    - Tomas role: Focus on hot leads only

11. **Email Replier** - Drafts replies na inbound questions
    - Input: New email v Tomas inbox (label: mentivue)
    - Output: Draft reply pre Tomas review
    - Tomas role: Approve/edit/send (1-min per email)

12. **Pricing Quoter** - Generuje pricing proposals
    - Input: Klient size, vertical, needs
    - Output: Quote PDF + email draft
    - Tomas role: Custom adjustments

### 2.3 The orchestration layer

Všetkých 12 agentov potrebuje **orchestration layer**. Možnosti:

**Option A: Build vlastný (Claude Code Tools approach)**
- Každý agent = TypeScript class s Anthropic SDK
- Cron-driven alebo event-driven
- Tools = DB queries + email send + Slack + Stripe
- Single dashboard ukazuje all queues + approvals

**Option B: Use orchestration framework**
- LangGraph alebo CrewAI alebo OpenAI Agents SDK
- Pre-built infra pre multi-agent
- Trade-off: framework lock-in + extra learning

**Option C: Hybrid - Claude Sonnet "manager agent"**
- 1 master agent koordinuje sub-agentov
- Mentivue Manager Agent dostane denný "task list"
- Spustí sub-agentov v správnom poradí

**Recommendation pre Tomas (silný v code):** **Option A**. Postaviš to za 2-3 týždne v Claude Code. Plný control, žiadny framework debt. Pre niekoho non-technical by bola Option B.

---

## 3. Tomas command center - one screen for everything

Hlavný anti-friction tool: **jeden dashboard kde vidíš všetko + máš všetko actionable**.

### 3.1 Dashboard sections

```
┌──────────────────────────────────────────────────────────┐
│  MENTIVUE COMMAND CENTER                  [Tomas, 09:42] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🚨 NEEDS YOUR ATTENTION (3)                            │
│  ─────────────────────────────                          │
│  ► Klient X churn signal (Pulse open 0/4)               │
│  ► New Pro inquiry from Y (lead score: 87/100)          │
│  ► Anomaly: Datart +12% SoV (unexpected)                │
│                                                          │
│  📝 IN APPROVAL QUEUE (5)                               │
│  ─────────────────────────────                          │
│  □ Action Report draft: Alza April [Preview] [Approve]  │
│  □ Pulse newsletter draft [Preview] [Approve]           │
│  □ Outreach emails (3) [Bulk approve]                   │
│                                                          │
│  📊 BUSINESS METRICS                                    │
│  ─────────────────────────────                          │
│  MRR: €14 800 (+€2 980 MoM)                             │
│  Active subs: 22 (15 Watch, 7 Pro)                      │
│  This month revenue: €23 540                            │
│  Pending audits: 3                                      │
│                                                          │
│  ⚙️  OPERATIONAL HEALTH                                 │
│  ─────────────────────────────                          │
│  ✅ Daily data collection (last: 03:02)                 │
│  ✅ All cron jobs healthy                               │
│  ⚠️  Slack bot: 12 messages handled, 1 escalated        │
│  ✅ Stripe: all subscriptions current                    │
│                                                          │
│  💰 COMPUTE COST TODAY                                  │
│  ─────────────────────────────                          │
│  Used: $4.20 / $15.00 budget (28%)                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Daily Tomas ritual (15 minutes)

```
09:00  Open command center
       Review 🚨 attention items (5 min)
       
09:05  Triage approval queue (5 min)
       - Bulk approve outreach emails
       - Preview/approve content pieces
       - Reject anything weird
       
09:10  Check operational health (2 min)
       - Any red flags?
       - Slack bot escalations?
       
09:12  Set priorities for day (3 min)
       - Sales calls scheduled
       - Strategic priorities
       
09:15  Done. Rest of day: focused work on highest-value tasks.
```

**Total daily admin: 15 minút.** Maximum.

---

## 4. Bottleneck-by-bottleneck automation strategy

Idem cez každý bottleneck z Section 1 a presný plán ako ho riešiť.

### 4.1 Code/infra (already automated cez Claude Code)

**Solution:** Claude Code je tvoj 10x engineer.

**Setup:**
- Hlavný repo s celým stackom (PRD + ANALYSIS + METRICS = perfect context)
- Claude Code session permanentne otvorená
- Iteruj features cez chat, ako copilot
- Test driven: every new feature includes Vitest tests

**Time saved:** 60-70% vs manual coding.

### 4.2 Content production (highest leverage)

**Solution:** Templated AI generation s human review.

**Setup:**

```typescript
// Pre každý report type, máme:
// 1. Template (markdown s placeholders)
// 2. Data fetcher (SQL queries)
// 3. AI writer (Claude Sonnet s carefully tuned prompt)
// 4. Renderer (Puppeteer → PDF)
// 5. Reviewer (Claude Sonnet v "critic" mode)

const generateActionReport = async (brandId: string, month: Date) => {
  // 1. Fetch data
  const metrics = await fetchBrandMetrics(brandId, month);
  
  // 2. AI generates each section
  const sections = await Promise.all([
    generateExecutiveSummary(metrics),
    generateOpportunities(metrics),
    generateActionPlan(metrics),
    generateCompetitorWatch(metrics),
  ]);
  
  // 3. AI self-critic
  const review = await selfReview(sections);
  if (review.needsRework) {
    sections = await regenerate(sections, review.feedback);
  }
  
  // 4. Render PDF
  const pdf = await renderToPDF(sections, brand.template);
  
  // 5. Queue for Tomas approval
  await queueApproval({
    type: 'action_report',
    brand: brandId,
    preview_url: uploadPreview(pdf),
    auto_send_if_no_action_hours: 48,
  });
};
```

**Critical pattern: Self-critic loop.**

Claude Sonnet generuje draft → Druhý Claude call ako "critic" pozrie draft a hľadá:
- Generic AI phrases ("In this rapidly evolving landscape...")
- Unsupported claims
- Missing specifics
- Repetition
- Weak recommendations

Ak critic flagne issues → regenerate s feedback. Loop 2-3x do quality.

**Time saved:** 80-90% vs manual writing.

**Tomas time per Action Report:** 10 min review (vs 4-6h manual).

### 4.3 Klient onboarding (high friction historically)

**Solution:** Automated flow + smart escalation.

**Setup:**

```
1. Stripe webhook fires (new subscription)
2. Klient onboarding agent triggers:
   - Send welcome email s onboarding form link
   - Form: brand name, competitors, key topics, goals
3. Klient fills form (3-5 min)
4. Agent processes:
   - Add brand to monitoring DB
   - Generate custom prompts (Claude Sonnet)
   - Schedule first weekly Pulse for next Thursday
5. Send "Welcome to Mentivue" email s:
   - First data preview
   - Calendar link pre kickoff call (Pro+ only)
6. Tomas dostane Slack notification: "New klient X onboarded"
```

**Tomas time per onboarding:** 30 min kickoff call (Pro+). 0 min for Watch.

### 4.4 Sales calls (the irreducible bottleneck)

**Solution:** Cannot fully automate. **Optimize the funnel.**

**Pre-call automation:**

```typescript
// When lead books call (Calendly webhook), agent preps:
const prepareCallContext = async (lead: Lead) => {
  // 1. Run instant brand audit (1000 prompts × 2 LLM = 2000 queries)
  const audit = await runQuickAudit(lead.brand);
  
  // 2. Generate call brief (Claude Sonnet)
  const brief = await generateCallBrief({
    lead,
    audit_findings: audit,
    company_background: await fetchCompanyBackground(lead.brand),
    likely_objections: predictObjections(lead.industry),
    customized_pricing: suggestPricing(lead),
  });
  
  // 3. Email Tomas 1h before call
  await emailTomas({
    subject: `Call brief: ${lead.name} at ${lead.callTime}`,
    body: brief,
    attachments: [audit_preview_pdf]
  });
};
```

**Tomas dostane email 1h pred call:**
- Lead background (2 min read)
- Quick audit findings (specifické tipy ako "Alza klesá v B2B segment")
- Suggested pricing tier based on size
- Anticipated objections + responses
- Talking points

**Sales call efficiency:** zachová 30-45 min, ale **conversion rate vyrastie z 15% na 30-40%** lebo Tomas príde s konkrétnym hodnotovým návrhom, nie genericky.

**Post-call automation:**

```typescript
// After call ends (Tomas marks outcome in CRM):
// - Auto-send follow-up email s recap
// - Auto-send custom proposal s pricing
// - Schedule reminder follow-up at +3 days
// - Add to nurture sequence if not closed
```

**Effective Tomas time per closed sale:** 1 hour total (vs 3-4 hour pre call + post-work).

### 4.5 Customer support (Slack bot)

**Solution:** Slack bot s DB tool access.

**Setup:**

```typescript
// Klient v Slack: "@mentivue what's our SoV trend?"

const slackBot = async (message: SlackMessage) => {
  const context = await loadKlientContext(message.user);
  
  // Claude Sonnet s tools:
  const tools = [
    queryBrandMetrics,
    getLatestPulse,
    fetchCompetitorComparison,
    searchActionReports,
    escalateToTomas,
  ];
  
  const response = await claude.run({
    messages: [{ role: 'user', content: message.text }],
    tools,
    system: `You are Mentivue AI analyst answering klient ${context.brand} questions.
             Use tools to fetch real data. Be concise. If question requires Tomas judgment, use escalateToTomas tool.`
  });
  
  await slack.postMessage(message.channel, response);
};
```

**Result:** 70-80% questions resolved by bot. Tomas dostáva iba escalations (1-2/týždeň).

### 4.6 Marketing/PR/LinkedIn

**Solution:** Content engine + Tomas curation.

**LinkedIn automation:**

```typescript
// Daily 09:00 trigger:
const generateLinkedInIdeas = async () => {
  // 1. Pull last week's most interesting findings
  const findings = await fetchTopFindings();
  
  // 2. Generate 3 LinkedIn post drafts
  const drafts = await Promise.all([
    writeHookPost(findings[0]),       // Style A: "Insight"
    writeContrarian(findings[1]),     // Style B: "Hot take"
    writeCaseStudy(findings[2]),      // Style C: "Story"
  ]);
  
  // 3. Email Tomas: "3 post ideas for today"
  await emailTomas({
    subject: 'LinkedIn ideas - pick one',
    body: previewDrafts(drafts),
    actions: [
      { label: 'Use #1', action: 'post:1' },
      { label: 'Use #2', action: 'post:2' },
      { label: 'Use #3', action: 'post:3' },
      { label: 'Skip today', action: 'skip' },
    ]
  });
};
```

**Tomas decision:** 2 min/deň. Buďto click "Use #X" alebo "Skip".

**PR pitches:**

```typescript
// Weekly Sunday trigger:
const generatePRPitches = async () => {
  // 1. Identify week's biggest insight
  const bigStory = await findMostNewsworthy();
  
  // 2. Generate pitches pre 5 key journalists
  const pitches = await Promise.all([
    pitchToZive(bigStory),
    pitchToDSL(bigStory),
    pitchToTrend(bigStory),
    pitchToETrend(bigStory),
    pitchToForbes(bigStory),
  ]);
  
  // 3. Queue for Tomas approval
  await queueForApproval(pitches);
};
```

**Tomas decision:** 10 min/týždeň. Pick which to send, customize if needed.

### 4.7 Strategy & decisions (cannot fully automate)

**Solution:** Decision frameworks + AI advisor.

Pre 90% rozhodnutí, **predefinovaný framework**:

```yaml
pricing_decisions:
  klient_asks_for_discount:
    < 10%: auto-approve (within budget)
    10-20%: suggest annual commit instead
    > 20%: escalate to Tomas
    
churn_signals:
  warning_level: automated email
  critical_level: Tomas outreach within 48h
  
content_priority:
  weekly_pulse: always
  industry_report: quarterly fixed
  audit_request: 5-day SLA
  custom_research: scope first

competitor_response:
  similar_pricing: no action
  feature_parity: monitor, document
  significant_threat: Tomas weekly review
```

Pre **non-trivial decisions**, **AI advisor mode**:

```
Tomas: "@mentivue Should I lower Pro pricing to compete with X?"

Mentivue Strategist:
"Based on current data:
- Your Pro NPS: 67 (very high) → klients see value
- Your churn: 6% (low) → no price pressure
- Your CAC: €280 → can afford to be premium
- X's positioning: feature-light, undercutting

Recommendation: HOLD pricing. Add 'fortress feature' (e.g. Slack bot)
instead of cutting price. Premium positioning is your moat.

Counterargument worth considering: If X gets 5+ logos, FOMO might
spread. Watch their customer announcements monthly.

Action plan:
1. Don't lower pricing
2. Publish "Why Mentivue costs €1490" content piece (premium signaling)
3. Reach out to 3 customers about referral bonus"
```

**Tomas role:** **Decide**. AI dá rámec, Tomas vyberie. 10 min vs 1 hour deliberation.

---

## 5. Automation roadmap - čo build kedy

Nepostavíš všetkých 12 agentov hneď. Order matters.

### 5.1 Týždeň 1-6 (Phase 1 launch)

**Build first - core agents:**

1. **Report Writer** - generate Industry Report a Per-Brand Audit
2. **Pulse Writer** - weekly newsletter
3. **Anomaly Watcher** - daily anomaly scan
4. **Klient Onboarding** - automated for free Industry Report download

**Skip for now:**
- Slack bot (no klientov yet)
- Sales agents (manual outreach prvé týždne to learn what works)
- Strategy advisor (Tomas is the strategist Phase 1)

### 5.2 Týždeň 7-12 (Phase 1 → 2)

**Add:**

5. **Quote Curator** - notable AI quotes
6. **Email Replier** - inbound email drafts
7. **Outreach Drafter** - cold email automation
8. **Lead Qualifier** - inbound lead scoring

### 5.3 Mesiac 3-6 (Phase 2 → 3)

**Add:**

9. **Billing Handler** - Stripe Billing integration
10. **Action Plan Generator** - 30/60/90-day plans (for Pro tier)
11. **Slack Bot** - klient question handler (Pro+ only)
12. **Strategy Advisor** - AI advisor mode for Tomas

### 5.4 Mesiac 6+ (Phase 3+)

**Polish & scale:**
- Multi-brand orchestration (Enterprise tier)
- Advanced anomaly detection
- Predictive trajectory models
- White-label support

---

## 6. Realistic time impact - before vs after automation

### 6.1 Phase 1 (M0-3) - bez vs s automation

**Bez automation (manual approach):**
- Per Audit production: 8-12h
- Per Pulse weekly: 3-4h
- Per Industry Report: 30-40h
- Sales calls: 2-3h per (s prep)
- Email replies: 5-8h/týž

**Total: ~25-30h/týždeň pri 3 audity/mes + 2 sales calls/týž**

**S automation (AI agents v place):**
- Per Audit production: 1.5h (Tomas review)
- Per Pulse weekly: 30 min
- Per Industry Report: 4-6h (Tomas oversight)
- Sales calls: 1.5h per (auto-prep)
- Email replies: 1.5h/týž (auto-draft + approve)

**Total: ~8-12h/týždeň pri rovnakom volume**

**Time saved: 60-65%.**

### 6.2 Phase 3 (M6-12) - bez vs s automation

**Bez automation:**
- 20 Pro klients × 5h/mes Action Reports = 100h/mes
- 30 Watch klients × 1h/mes = 30h/mes
- Sales + Slack + email = 50h/mes
- **Total: ~180h/mes = 45h/týždeň** ❌ Burnout

**S automation:**
- 20 Pro × 1h/mes (review only) = 20h/mes
- 30 Watch × 5 min/mes = 2.5h/mes
- Sales + Slack + email = 15h/mes (most auto-handled)
- **Total: ~37h/mes = 9h/týždeň** ✅ Sustainable

**Time saved: 80%.**

Toto je **rozdiel medzi burnout businessom a scalable businessom**.

---

## 7. Operational efficiency - tools & integrations

### 7.1 Single source of truth: Internal API

Všetky systémy (Stripe, Resend, Slack, Calendly, vlastná DB) prístupné cez **single internal API**:

```typescript
// One API to rule them all
class MentivueAPI {
  // Klient management
  klients: KlientService
  
  // Subscription & billing
  billing: StripeService
  
  // Communication
  email: ResendService
  slack: SlackService
  
  // Scheduling
  calendar: CalendlyService
  
  // Data
  metrics: MetricsService
  reports: ReportsService
  
  // AI agents
  agents: AgentOrchestrator
}
```

Každý agent volá `mentivue.klients.findChurnRisk()` namiesto poznať Stripe API. Encapsulation.

### 7.2 Critical tools stack

| Tool | Purpose | Cost/mes |
|---|---|---|
| Anthropic API | Claude calls (everywhere) | $200-400 |
| OpenAI API | GPT for data collection | $50-100 |
| Stripe | Billing | 2.9% + €0.25 per txn |
| Resend | Email | $20 |
| Slack | Klient channels + bot | $0 (free tier) |
| Calendly | Scheduling | $10 |
| Hetzner | Hosting | €5 |
| Cloudflare | DNS + R2 storage | €5-10 |
| Vercel | Frontend | $0 (free tier) |
| Linear | Internal project mgmt | $0 (solo) |
| **TOTAL** | | **~€350-550/mes** |

Pri 30 paying klientov × €1k average ARPU = €30k/mes revenue, tooling je 1-2%. Healthy.

### 7.3 Automation observability

**Critical:** ak agenti robia 90% práce, musíš vedieť **čo robia a či to robia dobre**.

Setup:
- **Langfuse** alebo **Helicone** - LLM observability (free tier)
- **Logs:** Better Stack alebo Axiom (every agent action)
- **Alerts:** Critical errors → Tomas Slack
- **Weekly digest:** Email s metrikami všetkých agentov

```
WEEKLY AGENT DIGEST - Week 23

Report Writer:        134 reports generated, 12 needed retry, 1 escalated
Pulse Writer:          1 newsletter (5 variants per tier), 47% open rate
Anomaly Watcher:       3 anomalies detected, 2 valid, 1 false positive
Outreach Drafter:      31 emails generated, 12 sent by Tomas, 19% reply rate
Slack Bot:             47 questions handled, 3 escalated to Tomas

Top issues to address:
- Action Report quality drop in financial sections (2/12 retries)
- Anomaly false positive on weekend data (cron timing issue)
```

---

## 8. Quality control without humans-in-loop

Automation works only if quality stays high. Otherwise klient zaplatí €1 490 za AI slop.

### 8.1 The Self-Critic Pattern

Pre každý generovaný outputu:

```typescript
const generateWithCritic = async (input, generationFn) => {
  let attempt = 1;
  let output = await generationFn(input);
  
  while (attempt <= 3) {
    const critique = await selfCritic.review(output, criteria);
    
    if (critique.score >= 8.0) {
      return output;  // Quality acceptable
    }
    
    if (attempt === 3) {
      // Escalate to Tomas
      await escalateForReview(output, critique);
      return null;
    }
    
    // Regenerate with feedback
    output = await generationFn(input, critique.feedback);
    attempt++;
  }
};
```

Critic checks:
- Specificity (numbers vs vague)
- Originality (no AI clichés)
- Consistency (factual claims align with DB)
- Tone (matches brand voice)
- Length & structure

### 8.2 Sampling-based quality

Tomas nemôže review 100% outputs. Ale môže review **random 10%** + **all escalations**.

```
Týždenná Tomas QA routine (1h):
- Random sample 5 reports → score each
- Review all critic-flagged outputs (typically 2-3)
- Update agent prompts ak vidí pattern
```

Tým sleduješ agent drift bez over-investment.

### 8.3 Klient feedback loops

Po každom delivery (Action Report, Audit):
- Auto-email "How was this report? [1-5 stars]"
- < 4 stars → Tomas review
- Comments → fed back do agent prompts

---

## 9. The killer insight: "Mentivue runs Mentivue"

Recursive automation: **agenti používajú Mentivue na vlastné rozhodnutia**.

### 9.1 Self-monitoring agents

Pulse Writer používa Anomaly Watcher výstupy. Lead Qualifier používa Klient Onboarding data. **Agents informujú agentov.**

### 9.2 Dogfood our own tool

Mentivue tracking Mentivue:
- Sledujeme našu vlastnú SoV v "GEO tools" a "AI search analytics" kategorii
- Sledujeme našu PR coverage
- Sledujeme klient mention sentiment

To je nielen meta-cool. To je **constant testing of own product** + **PR ammunition** ("We track ourselves daily").

### 9.3 The "vibe coding" loop

Najsilnejší pattern pre teba:

```
1. Vidíš nový friction v dashboard → ticket v Linear
2. Otvoríš Claude Code session → describe friction
3. Claude Code píše riešenie (build new agent, update existing)
4. Test in staging → deploy
5. New automation reduces future friction
6. Loop
```

Toto je **continuous improvement at AI speed**. Pri 10h/týž Tomas time, 6h ide na "vibe coding" - vyladzovanie automation. 4h ide na klientov.

To je **autonomy through AI-native architecture**.

---

## 10. What this changes vs phased GTM

### 10.1 Time investment

| Phase | Phased GTM | Phased GTM + Automation |
|---|---|---|
| Phase 1 (M0-3) | 10-12h/týž | **6-8h/týž** |
| Phase 2 (M3-6) | 14-15h/týž | **8-10h/týž** |
| Phase 3 (M6-12) | 22-25h/týž | **10-15h/týž** |
| Phase 4 (M12+) | 25-30h+/týž | **15-20h/týž** |

### 10.2 Hiring pressure

| Klient count | Phased GTM | + Automation |
|---|---|---|
| 10 Pro | Tomas sustainable | Tomas + 4h/týž |
| 20 Pro | Hire jr. analyst | Tomas + 10h/týž |
| 50 Pro | Hire CSM + analyst | Hire 1 jr. analyst |
| 100+ Pro | Hire team of 4-5 | Hire team of 2-3 |

**Reduced hiring need: 50%.** Lower burn = better margins.

### 10.3 Scaling math

Phased GTM baseline:
- Tomas serves max ~30 Pro klients before burnout
- Hire $10k/mes team → serve ~80 Pro klients
- Limit: linear growth

Phased GTM + Automation:
- Tomas serves up to 50 Pro klients solo
- Hire $5k/mes team → serve ~200 Pro klients
- Limit: 5-10× higher ceiling

---

## 11. What WILL still slow you down (be honest)

Automation rieši veľa, ale nie všetko.

### 11.1 Things automation cannot fix

**A. Trust building & relationships**
- Klient verí brandom ktoré pozná
- Tomas-as-founder je hodnotou
- Friend/network introductions matter
- Conference speaking matters
- Personality + reputation matters

**Mitigation:** Strategic relationship investment 3-5h/týž. Nedeleguje sa.

**B. Strategic positioning**
- Aký narrative vziať?
- Ktoré marketové signály ignorovať?
- Kedy raise capital vs nie?

**Mitigation:** AI advisor pomáha, ale Tomas musí decide. 1-2h/týž.

**C. Crisis response**
- Klient incident
- PR crisis
- Tech outage
- Personal emergency

**Mitigation:** Be ready. Have buffer time.

**D. Creative work**
- Brand voice direction
- New product concepts
- Storytelling angle
- Visual identity

**Mitigation:** Schedule deep work blocks. 2-3h/týž.

### 11.2 The 30% of work that stays manual

| Activity | Hours/týž | Why manual |
|---|---|---|
| Sales calls | 3-5h | Human-to-human trust |
| Strategy thinking | 2-3h | Tomas judgment irreplaceable |
| Relationship building | 1-2h | Personal touch |
| Creative/brand work | 1-2h | Tomas vision |
| Hiring/team mgmt (later) | 0-3h | Cultural fit |
| **TOTAL** | **7-15h/týž** | Even fully automated |

**Realistic minimum Tomas time: 7-10h/týž v Phase 1, growing to 15-20h v Phase 3+.**

To je **udržateľné popri Telekome** (assuming high energy).

---

## 12. The decision: build mode

Toto je teraz veľmi konkrétne. 3 možnosti:

### Option A: "Build everything as agent from Day 1"

**Description:** 4 týždne foundation, žiadni klienti. Po 4 týždňoch all 12 agents in place.

**Pros:**
- Cleanest architecture
- No tech debt
- Fully automation-ready

**Cons:**
- 4 týždne bez revenue
- Build features pre theory, nie real klient needs
- Cash flow risk

**Verdict:** Nedoporučujem. Premature.

### Option B: "Build agents as you need them"

**Description:** Launch v Týždeň 6 s minimal automation. Pridávaj agents reactively keď cítiš friction.

**Pros:**
- Revenue from Week 6
- Real klient feedback drives priorities
- Lean approach

**Cons:**
- Possible tech debt
- Less elegant integration
- Risk: keep "building it later"

**Verdict:** Recommended.

### Option C: "Build foundation in Week 1-4, launch v Week 5"

**Description:** 4-5 týždne intensive build s automation-first mindset. Launch with 60-70% of agents already built.

**Pros:**
- Smoother launch
- Authentic AI-native story (good PR)
- Less catch-up later

**Cons:**
- Delays revenue
- Tomas burnout risk pre-launch
- Some agents built without klient input

**Verdict:** **Best for Tomas profile** (strong technical, can move fast with Claude Code).

---

## 13. Practical recommendation

Pre teba konkrétne, **Option C variant**:

**Týždeň 1-2: Foundation + Core Agents**
- All infra (DB, hosting, billing)
- Report Writer agent (Industry Report a Audit)
- Pulse Writer agent
- Anomaly Watcher
- Klient Onboarding (free download flow)

**Týždeň 3-4: Sales + Quality**
- Outreach Drafter
- Email Replier
- Lead Qualifier
- Self-Critic pattern in place
- Tomas Command Center dashboard

**Týždeň 5: Launch**
- Public launch s Industry Report
- First Audits sold (auto-delivery)
- LinkedIn content engine running

**Týždeň 6-12: Iterate**
- Add Slack bot keď máš prvých 3-5 paying klientov
- Add Action Plan Generator keď launches Pro tier
- Add Strategy Advisor keď máš decisions to delegate

**Tomas time:**
- Týždeň 1-4: 15-20h/týž (intensive build phase)
- Týždeň 5+: drop to 8-12h/týž (mostly approval + sales)

To je **8-12h/týž sustainable**. Compatible with Telekom + family + health.

---

## 14. Bottleneck-busters checklist

Pred launch, validate že máš tieto v place:

✓ Single dashboard for Tomas (command center)
✓ Approval queue (so nothing waits on Tomas decision)
✓ Self-critic pattern in content generation
✓ Auto-escalation rules (when AI gives up)
✓ Daily 15-min Tomas ritual (not more)
✓ Klient question Slack bot
✓ Outreach email auto-drafting
✓ Strategy AI advisor for big decisions
✓ Observability (Langfuse) on all agents
✓ Decision frameworks documented (pricing, churn, etc.)

Without these, automation is just "AI somewhere in pipeline". With these, Mentivue **runs itself**.

---

## 15. The end-game vision

12 mesiacov post-launch:

```
Tomas opens command center, 09:00 Monday morning.

📊 LAST WEEK:
- Revenue: €23 540 generated
- 4 new klients onboarded (3 Pro, 1 Watch)
- 47 reports auto-delivered (avg klient rating 4.6/5)
- 12 PR mentions in slovak media
- 3 strategic decisions advised (all approved with minor edits)

🚨 NEEDS TOMAS THIS WEEK:
- 2 sales calls scheduled (Tuesday, Thursday)
- 1 churn risk: Klient X (Slack outreach today)
- 1 strategy decision: should we expand to CZ Q3?
- 5 LinkedIn posts to approve (15 min total)

EVERYTHING ELSE: handled.
```

Toto je **AI-native company**. Tomas je strategist + relationship layer. Všetko ostatné = agents.

Pri €100k MRR, Tomas time ostal pod 15h/týž. **To je sukces.**

---

## 16. Open decisions

- [ ] Build all 12 agents pre launch (Option C) alebo just-in-time (Option B)?
- [ ] Self-host LLM observability (Langfuse) alebo cloud-based?
- [ ] Stripe Billing alebo Lemon Squeezy (better tax handling for EU)?
- [ ] Single internal API z Day 1 alebo refactor later?
- [ ] Slack bot pre Watch tier tiež alebo iba Pro+?
- [ ] AI advisor for Tomas - voice or chat-only?
- [ ] Co-pilot Claude Code session always-on, alebo iba pre big work?

---

## 17. Summary - the AI-native shift

| Aspect | Traditional | AI-Native (this plan) |
|---|---|---|
| Operational burden | High Tomas time | Low Tomas time (10-15h/týž) |
| Hiring need | 3-5 people by Y2 | 1-2 people by Y2 |
| Scaling ceiling | 80-100 klients | 200+ klients before hire |
| Time to launch | 6 týždňov | 4-5 týždňov |
| Quality consistency | Variable (human dependent) | Higher (templated + reviewed) |
| Cost structure | Salary-heavy | Compute-heavy (lower) |
| Margins | 60-70% | 85-90% |
| Tomas burnout risk | High | Low (sustainable) |
| Tomas decision focus | Operations | Strategy + relationships |
| Exit potential | €10-20M | €30-60M (better margins) |

**Bottom line:** AI-native architecture lets Tomas **focus on strategic moments while agents handle operations**. To je rozdiel medzi consulting practice a scalable software business.
