# Mentivue - Design Handoff Prompts pre claude.ai/design

3 ready-to-paste prompty pre 3 hlavné design batches. Každý obsahuje kompletný kontext, references, constraints a špecifikácie.

---

## ✅ BEFORE YOU PROMPT - Upload Checklist

Pred tým ako pošleš prompt do claude.ai/design, **uploadni tieto súbory**:

### Required uploads (každá session)

1. **`mentivue-logo.svg`** — primary logo
2. **`mentivue-brand-identity.html`** — kompletný brand book ako reference (open in browser, screenshot key sections, alebo daj HTML)
3. **`BRAND_TOKENS.md`** — design tokens v compact format (viď nižšie, generujem ti to)

### Optional uploads (podľa promptu)

4. **`SAMPLE_DATA.json`** — sample real data pre dashboard a reports (chartové dáta, brand names)
5. **`REFERENCE_SCREENSHOTS/`** — folder s 5-10 reference screenshots z FT, Bloomberg, Linear, A24 stránok
6. **`COMPETITOR_AUDIT.md`** — čo NEKOPÍROVAŤ (Profound, Peec AI screenshots)

---

# 🎨 PROMPT 1: MARKETING LANDING MASTER

**Použi pre:** Homepage, /pricing, /audit, /report, /watch landings

**Skopíruj-vlož toto do claude.ai/design:**

```
═══════════════════════════════════════════════════════════════
MENTIVUE — MARKETING LANDING MASTER DESIGN
═══════════════════════════════════════════════════════════════

CONTEXT
You are designing the master marketing landing page for Mentivue,
a Slovak/CEE B2B research firm that measures how AI search engines
(ChatGPT, Claude, Perplexity, Gemini) talk about e-commerce brands.

Think of us as Bloomberg/Gartner for the AI search era. We sell
quarterly research reports (€299), per-brand audits (€2,990),
and Pro subscriptions (€1,490/mo).

Our buyer is the CMO or Digital Director of mid-to-large
European e-commerce brands (Alza, Datart, banks, etc).
They are sophisticated, skeptical of AI hype, but worried
about being invisible in AI search results.

═══════════════════════════════════════════════════════════════
AESTHETIC DIRECTION — REFINED EDITORIAL INTELLIGENCE
═══════════════════════════════════════════════════════════════

Imagine the love child of:
- Financial Times print edition (typography, hierarchy)
- Bloomberg Terminal (data density, mono fonts for numbers)
- A24 film posters (editorial confidence, unexpected typography)
- The Browser Company / Linear (quiet precision, subtle craft)
- Stripe Atlas docs (B2B sophistication without coldness)

NOT this:
- Generic AI startup (purple gradients, "AI Powered" badges)
- Web3 aesthetic (neon, glassmorphism)
- Friendly cartoon illustrations
- Stock photos of dashboards on laptops
- Predictable hero with centered "Get Started" button

═══════════════════════════════════════════════════════════════
BRAND SYSTEM (full details in uploaded brand-identity.html)
═══════════════════════════════════════════════════════════════

COLORS (use these exactly):
- Ink:        #0E1116  — headlines, primary text, 25% of surface
- Ink Soft:   #1F2429  — body text
- Paper:      #F7F4ED  — main background, warm archival off-white, 60% surface
- Bone:       #EBE5D7  — subtle dividers, soft surfaces
- Depth:      #1B3A4B  — dark accent surfaces (footers, callouts)
- Signal:     #FF5B3A  — editorial coral, ONLY for CTAs and key data points, ≤5% surface
- Signal Soft:#FFE8E0  — highlight tint
- Positive:   #2D6A4F  — only for positive data values
- Negative:   #C73E1D  — only for negative data values

CRITICAL RULE: Coral signal is RESERVED. Never use as background.
Use only for CTA buttons, key data points, italic accents in headlines.

TYPOGRAPHY:
- Display:  Fraunces (Google Fonts) — headlines, wordmark, accents
            Use italic alternates with signal coral for emotional moments
- Body:     Inter Tight (Google Fonts) — body, UI labels, navigation
- Mono:     JetBrains Mono (Google Fonts) — numbers, percentages,
            timestamps, code, data points

NEVER use Inter, Space Grotesk, Poppins, or Geist.

LOGO:
- See uploaded mentivue-logo.svg
- Wordmark always lowercase: "mentivue"
- Mark composition: outer circle + inner geometric eye + coral dot
- Never frame the mark in another circle/avatar

═══════════════════════════════════════════════════════════════
PAGE: HOMEPAGE (mentivue.sk)
═══════════════════════════════════════════════════════════════

STRUCTURE (top to bottom):

1. STICKY HEADER
   - Mentivue logo (left)
   - Nav links: Index · Report · Audit · Methodology · Pricing
   - Primary CTA "Get the Q2 report →" (ink background)
   - Top edge has 1px ink border under nav

2. HERO (asymmetric 1.2fr / 1fr grid)

   LEFT COLUMN:
   - Small mono tag: "● Q2 2026 · ELECTRONICS · SLOVAKIA"
     (coral dot, then uppercase mono with letter-spacing)
   - Massive serif headline (60-80px desktop):
     "What AI says about your brand."
     With "your brand" in italic coral
   - 18px body lede:
     "Týždenne meriame ako ChatGPT, Claude, Perplexity
      a Gemini odpovedajú na 1 176 reálnych nákupných
      otázok. Pre marketingových lídrov, ktorí už
      nečítajú SERP."
   - Two CTAs: "Read the Index →" (ink) and "Get a brand audit" (outlined)

   RIGHT COLUMN — LIVE WIDGET:
   - Dark (ink #0E1116) panel
   - Title bar: pulsing coral dot + "Mentivue Index — Live"
   - Top-right corner: tiny mono "LIVE INDEX · Q2 2026"
   - 6 rows of data (mock):
     Rank | Brand | Score | Δ WoW
     01   | Alza.sk      | 87.3 | +2.1 (green)
     02   | Datart       | 72.8 | −0.8 (red-ish)
     03   | Nay          | 68.2 | +1.4
     04   | Planeo       | 54.1 | −3.2
     05   | Andrea Shop  | 48.6 | —
     06   | Mall.sk      | 41.2 | +0.9
   - Brand names in Fraunces, scores in JetBrains Mono coral
   - 1px subtle dividers between rows
   - Small CTA at bottom: "See full Index →"

3. STATS BAND (4-column band, ink/paper borders)
   - 1,176 | Curated SK prompts
   - 4     | AI engines tracked
   - 15    | Brands · weekly
   - 90    | Days · longitudinal
   - Numbers in massive serif (48px), labels in mono uppercase
   - Use italic + coral for one number for visual rhythm

4. HOW IT WORKS (3-step narrative section)
   - Editorial section number "01 / METHOD"
   - Headline: "From 1,176 prompts to one signal."
   - 3-column layout:
     A) "We ask the questions your customers ask"
        — 50 sample prompts in mono on a card
     B) "Four AI engines answer, every week"
        — 4 logos (ChatGPT, Claude, Perplexity, Gemini)
        with weekly schedule visual
     C) "We measure, validate, and report"
        — Sample chart preview (sparkline of SoV trends)

5. WHO WE TRACK (carousel/grid)
   - Headline: "15 brands. Every Monday."
   - Grid of 15 brand names (no logos - we don't have rights):
     Alza, Datart, Nay, Planeo, Andrea Shop, Hej.sk, Okay,
     Mall, Electro World, iStores, Mironet, Megapixel, TPD,
     Faxcopy, Notebooky.sk
   - Each brand name in Fraunces serif on bone background card
   - Hover state: subtle scale + signal coral underline

6. THREE PRODUCTS (pricing teaser)
   - Section title: "Three ways in. One signal."
   - 3 cards:
     A) "Free Industry Report" — 10 pages, quarterly · €0
     B) "Per-Brand Audit" — 35 pages, 5-day delivery · €2,990 [FEATURED]
     C) "Pro Subscription" — Monthly action plans + advisor · €1,490/mo
   - Featured card: ink background with coral CTA
   - Each card has 3 bullet features + CTA button

7. METHODOLOGY TEASER (autorita section)
   - Two-column layout
   - Left: Big italic serif quote-style:
     "We don't guess. We don't extrapolate.
      We measure 1,176 real questions
      across 4 engines, weekly."
   - Right: Mini methodology breakdown:
     · 1,176 curated Slovak prompts
     · 4 AI engines: ChatGPT, Claude, Perplexity, Gemini
     · 15 brands tracked, 8 verticals coming
     · Validation: M1-M22 quality methods
     · Transparency: Full methodology public
     - Link: "Read the methodology →"

8. NEWSLETTER CTA (Pulse signup)
   - Dark ink section
   - Headline: "Get the Pulse, every Thursday."
   - Subtitle: "One signal, one story, one action.
                Weekly for marketing leaders."
   - Email input + "Subscribe" button (coral)
   - Small print: "Free. ~600 words. Unsubscribe anytime."

9. FOOTER (dark, ink)
   - Logo + tagline
   - 4 column links:
     PRODUCT (Audit, Pro, Watch, Industry Report)
     COMPANY (About, Methodology, Press, Contact)
     LEGAL (Terms, Privacy, Cookies, DPA)
     SOCIAL (LinkedIn, X, Email)
   - Mono footer note: "MENTIVUE · BRATISLAVA · 2026"

═══════════════════════════════════════════════════════════════
INTERACTION & MOTION
═══════════════════════════════════════════════════════════════

- Pulsing coral dot on Live Index title (subtle, 2s loop)
- Page load: subtle stagger reveal of hero elements (h1, lede, CTAs)
- Scroll-triggered reveal on stat numbers (count-up animation)
- Hover states: subtle 200ms transitions, no flashy effects
- Buttons: solid fill, slight darken on hover, no gradient backgrounds
- Cards: subtle 4px lift on hover with 200ms ease

═══════════════════════════════════════════════════════════════
TECHNICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════

- Build with: Next.js 15 + Tailwind CSS + shadcn/ui
- Mobile-first responsive (320px → 1920px)
- Subtle grain overlay across body for editorial texture
  (SVG noise filter, 4% opacity)
- All text scalable (no images-as-text)
- Lazy-load below-fold content
- Embed Google Fonts efficiently (font-display: swap)

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════

- Full HTML + Tailwind CSS implementation
- React component breakdown ready for Next.js
- All mockup data inline (no external dependencies)
- Mobile + desktop responsive at 320, 768, 1280, 1920 widths
- Accessibility: semantic HTML, ARIA labels, contrast AA+

═══════════════════════════════════════════════════════════════
INSPIRATION REFERENCES
═══════════════════════════════════════════════════════════════

Look at:
- ft.com (typography hierarchy, mono numbers)
- newyorker.com (editorial confidence)
- linear.app (B2B sophistication)
- stripe.com (clean grids, restrained color)
- thebrowser.com (text-first design)

Avoid:
- monday.com (too colorful)
- notion.so (too friendly)
- any generic AI startup landing page
- web3 / crypto aesthetics

═══════════════════════════════════════════════════════════════
ONE-LINE SUCCESS METRIC
═══════════════════════════════════════════════════════════════

A CMO of a major Slovak e-commerce brand should land on this page,
read the hero for 6 seconds, and think "These people are serious.
I want to read their methodology before I buy."

Not "Oh another AI tool". Not "This looks like a startup".
But "This looks like a research firm I can trust."
```

---

# 🎨 PROMPT 2: APP DASHBOARD MASTER

**Použi pre:** Klient dashboard, reports library, alerts, all app screens

**Skopíruj-vlož toto:**

```
═══════════════════════════════════════════════════════════════
MENTIVUE — KLIENT DASHBOARD MASTER DESIGN
═══════════════════════════════════════════════════════════════

CONTEXT
Design the main authenticated dashboard for Mentivue Pro subscribers
(€1,490/month). This is where CMOs check their AI search visibility
metrics and access monthly reports.

Same brand system as marketing landing (see uploaded brand-identity.html
and mentivue-logo.svg). But MORE DATA-DENSE, MORE TERMINAL-LIKE.

Think Bloomberg Terminal aesthetics but for marketing intelligence.

═══════════════════════════════════════════════════════════════
DESIGN PRINCIPLES FOR APP
═══════════════════════════════════════════════════════════════

DIFFERENCES from marketing:
- More information density (this is a tool, not a brochure)
- More mono font (JetBrains Mono for everything quantitative)
- Tighter spacing (8px grid instead of 16px)
- Smaller type scale (data has less drama)
- Side navigation instead of top nav
- Tables and charts are first-class citizens

SAME from marketing:
- Paper background (#F7F4ED), not white
- Subtle grain overlay
- Coral signal reserved for highlights only
- Ink as primary text
- Fraunces for headlines (smaller scale)

═══════════════════════════════════════════════════════════════
LAYOUT
═══════════════════════════════════════════════════════════════

LEFT SIDEBAR (240px fixed):
- Mentivue logo top
- Klient brand selector (dropdown if multi-brand)
- Nav sections:
  OVERVIEW
  · Dashboard
  · Live Index
  REPORTS
  · Action Reports
  · Audits
  · Pulse Archive
  INTELLIGENCE
  · Competitors
  · Alerts
  · Custom Prompts
  ACCOUNT
  · Settings
  · Billing
  · Team
- Bottom: Tomas avatar + "Strategy Advisor" Slack CTA

MAIN CONTENT (fluid):
- Top bar: Page title + period selector + export button
- Content grid

═══════════════════════════════════════════════════════════════
PAGE: MAIN DASHBOARD (for Alza as example brand)
═══════════════════════════════════════════════════════════════

1. WELCOME STRIP (top, full width)
   - "Welcome back, [Name]"
   - "Alza.sk · Q2 2026 · 12 weeks of data"
   - Right side: "Last update: 2 hours ago · 03:42 UTC"
     with green pulse dot

2. HERO METRIC CARDS (4-column grid)

   Card 1 — MENTIVUE INDEX SCORE
   - Mono label "MENTIVUE INDEX"
   - Big serif number "87.3" with italic
   - Mini sparkline (last 30 days)
   - Delta "+2.1 vs prior month"

   Card 2 — SHARE OF VOICE
   - Mono label "SHARE OF VOICE"
   - Big number "42.1%" coral
   - Bar showing position vs top 5 brands
   - Delta indicator

   Card 3 — AVG POSITION
   - Mono label "AVG POSITION"
   - Big number "1.8"
   - Out of "~5 brands per response"
   - Position visualization

   Card 4 — SENTIMENT
   - Mono label "SENTIMENT"
   - Big number "+0.62"
   - Donut: 73% positive · 22% neutral · 5% negative
   - Trend arrow

3. PER-LLM BREAKDOWN (4-column heatmap)

   "AI Engines Performance · last 30 days"
   - 4 columns: ChatGPT · Claude · Perplexity · Gemini
   - Each with mini stat block:
     SoV %  |  Position  |  Sentiment
   - Color intensity by performance
   - Click to expand per-engine details

4. SHARE OF VOICE TREND (large chart)
   - 90-day line chart
   - Multiple lines: Your brand vs top 4 competitors
   - Your brand in coral, competitors in muted tones
   - Hover: detailed point info
   - Annotations: known events ("Q2 campaign launched")
   - Title: "90-Day Share of Voice"
   - Sub: "Your brand's mentions as % of total responses"

5. TWO-COLUMN SPLIT

   LEFT: Topic Coverage Heatmap
   - Categories × subcategories
   - Color cells: red (gap) → green (dominant)
   - Quick scan: where you win, where you lose

   RIGHT: Citation Sources (top 10)
   - Domain | Mentions | Weight | Trend
   - heureka.sk · 43 · ★★★★★ · ↗
   - zive.sk · 28 · ★★★★ · →
   - etc

6. RECENT ALERTS (panel)
   - "3 anomalies this week"
   - List of cards with:
     · Severity dot (yellow/red)
     · Time stamp
     · One-line description
     · "Investigate" link
   - Example: "ChatGPT sentiment dropped −0.4 yesterday"

7. UPCOMING DELIVERABLES (right rail or bottom)
   - "Monthly Action Report — ready May 31"
   - "Quarterly Strategy Call — book by Jun 15"
   - "Q2 Full Audit — ready Jul 1"
   - Each as a stacked card with mini timeline

═══════════════════════════════════════════════════════════════
DATA VISUALIZATION STYLE
═══════════════════════════════════════════════════════════════

Charts use:
- Recharts library aesthetics
- Coral (#FF5B3A) for primary series (your brand)
- Ink (#0E1116) for axis and labels
- Bone (#EBE5D7) for gridlines
- Muted greens/reds for sentiment
- Mono font for all data labels
- No gradients on data series
- 2px line weight, square caps
- Negative space generous

Tables use:
- Mono font for numbers
- Fraunces (serif) for brand/entity names
- 1px ink dividers (subtle)
- Hover row highlight (bone background)
- Right-align numbers, left-align text
- Position numbers in lighter mono (#6B7280)

═══════════════════════════════════════════════════════════════
INTERACTIONS
═══════════════════════════════════════════════════════════════

- All metric cards clickable → detail drill-down
- Charts: hover for tooltip, click for filter
- Side nav: persistent, scroll independent
- Right rail: collapsible
- Period selector: dropdown (Last 7d / 30d / 90d / Custom)
- Export: dropdown (PDF / CSV / Share link)
- Keyboard shortcuts (Cmd+K command palette)

═══════════════════════════════════════════════════════════════
TECHNICAL
═══════════════════════════════════════════════════════════════

- Next.js 15 + Tailwind + shadcn/ui
- Recharts for visualizations
- TanStack Table for tables
- Responsive: 1280px+ optimized, gracefully degrades
- Real-time updates via SWR/TanStack Query
- Dark mode optional (default is light/paper)

═══════════════════════════════════════════════════════════════
REFERENCES
═══════════════════════════════════════════════════════════════

Best: Linear app, Posthog dashboard, Stripe Dashboard,
      Pirsch Analytics, Plausible Analytics

Worst: Mixpanel (too colorful), HubSpot (cluttered),
       Google Analytics 4 (confusing)
```

---

# 🎨 PROMPT 3: PDF REPORT DESIGN

**Použi pre:** Industry Report, Per-Brand Audit, Action Report PDFs

**Skopíruj-vlož toto:**

```
═══════════════════════════════════════════════════════════════
MENTIVUE — PDF REPORT DESIGN MASTER
═══════════════════════════════════════════════════════════════

CONTEXT
Design the PDF report template that gets delivered to klients.
This is the PRIMARY deliverable for €2,990 Per-Brand Audits and
quarterly Industry Reports (€299).

A klient pays €2,990 for this PDF. It needs to feel like a
McKinsey or BCG advisory report — not a generated SaaS export.

═══════════════════════════════════════════════════════════════
DESIGN PHILOSOPHY
═══════════════════════════════════════════════════════════════

Imagine these as references:
- McKinsey & Co quarterly reports (gravitas)
- The Economist special reports (data + narrative)
- Pentagram brand identity case study PDFs (editorial design)
- Apollo Global Markets research (Wall Street formality)
- Stripe Annual Letter (modern restraint)

NOT this:
- HubSpot blog PDFs (too friendly)
- Generic SaaS exports (charts only, no narrative)
- Annual report templates from Canva
- Webflow case studies (too web-styled)

═══════════════════════════════════════════════════════════════
FORMAT SPECS
═══════════════════════════════════════════════════════════════

- Size: A4 (210mm × 297mm)
- Margins: 25mm sides, 30mm top/bottom
- Page count: 35 pages (Per-Brand Audit) or 40 (Industry Report)
- Colors: Paper background (#F7F4ED), Ink text, Coral accents
- Print-safe (CMYK fallback for offline printing)
- Embed Google Fonts as base64 or use widely supported fallbacks

═══════════════════════════════════════════════════════════════
PAGE TEMPLATES TO DESIGN
═══════════════════════════════════════════════════════════════

1. COVER PAGE
   - Full-page editorial cover
   - Small mono header: "MENTIVUE · AUDIT · 05.2026"
   - Massive serif headline (centered or upper-left):
     "AI Search Visibility Audit"
     Below in italic coral:
     "Alza.sk · Q2 2026"
   - Subtle background: line art version of logo
     mark, very faint, large
   - Bottom: Klient name, prepared by, date
   - Page-edge color stripe (signal coral, 2mm)

2. TABLE OF CONTENTS PAGE
   - Mono section numbers (01 / 02 / 03)
   - Serif section titles
   - Page numbers right-aligned
   - Sub-sections with subtle indent

3. EXECUTIVE SUMMARY PAGE
   - "EXECUTIVE SUMMARY" mono uppercase
   - One big takeaway as pull-quote (italic serif, coral accent)
   - 3-4 paragraphs of dense narrative
   - 5 KEY FINDINGS list with mono numbers
   - Right margin: vertical sidebar with key stats

4. METHODOLOGY PAGE
   - Section number "01 / METHOD"
   - Title "How We Measured This"
   - 3-column breakdown:
     · Prompts (1,176)
     · LLMs (4)
     · Time (90 days)
   - Methodology paragraph
   - Trust/limitations callout box

5. METRICS DASHBOARD PAGE (1 page)
   - 4 large stat cards in 2x2 grid
   - Each card: mono label, big serif number, mini chart, delta
   - Subtle 1px ink frames
   - Right rail: percentile ranking visualization

6. BRAND SPOTLIGHT PAGE TEMPLATE (used 10x in Industry Report)
   - Right page (odd) with single brand focus
   - Brand name as huge serif headline
   - Mentivue Index Score as massive italic number
   - 3 mini panels: SoV / Position / Sentiment
   - 1 medium chart: 90-day trend
   - Pull quote from AI: "Alza je dominantný..."
     in italic serif with quote marks
   - Bottom: 2-3 strategic recommendations

7. CHART-FOCUSED PAGE
   - Full-width chart (line/bar/heatmap)
   - Mono caption above
   - Serif explanatory paragraph below
   - Mono data table appendix on right

8. RECOMMENDATIONS PAGE (Per-Brand Audit specific)
   - "10 OPPORTUNITIES" header
   - Each opportunity in numbered card:
     · Coral impact tag (HIGH / MED / LOW)
     · Title in serif
     · 2-paragraph explanation
     · Mono stats: investment € · expected SoV gain · timeline
     · Single action item highlighted

9. APPENDIX PAGE
   - Dense mono tables
   - Sample prompts in 2-column layout
   - Sample AI responses in italic
   - Citation source list

10. FOOTER ON EVERY PAGE
    - Left: mono "MENTIVUE / ALZA.SK / AUDIT Q2 2026"
    - Right: mono page number "23 / 35"
    - Center: tiny logo mark monogram
    - 1px ink top border

═══════════════════════════════════════════════════════════════
TYPOGRAPHY SCALE FOR PRINT
═══════════════════════════════════════════════════════════════

- Display H1 (page titles): Fraunces 48pt, weight 400, -2% tracking
- H2 (section titles): Fraunces 32pt, weight 500
- H3 (sub-sections): Fraunces 20pt, weight 500
- Body: Inter Tight 10pt, leading 14pt, dark ink
- Pull quotes: Fraunces italic 18pt, coral
- Data/numbers: JetBrains Mono 10pt
- Captions: JetBrains Mono 8pt, uppercase, 12% tracking
- Footer: JetBrains Mono 7pt

═══════════════════════════════════════════════════════════════
CHART STYLE FOR PRINT
═══════════════════════════════════════════════════════════════

- Coral primary line/series, ink secondary
- Subtle bone gridlines
- All labels in mono
- 1.5pt line weight (slightly heavier than screen)
- Annotations: italic Fraunces in coral
- Generous negative space around charts
- Caption below chart in mono uppercase

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════

- HTML + CSS template that renders to PDF via Puppeteer
- Sample populated with mock data (Alza, Datart, Nay, etc.)
- All 10 page template types fully designed
- Mock cover for both Audit and Industry Report variants
- @page CSS rules for proper PDF rendering
- Print-safe (no transparency on critical elements)

═══════════════════════════════════════════════════════════════
DETAILS THAT MATTER
═══════════════════════════════════════════════════════════════

- Section dividers: thin 1px ink lines, NEVER decorative
- White space: generous (think art book, not technical doc)
- Photos: NONE (no stock, no illustrations, no icons)
- Iconography: rare, only when conveying data not text
- Page transitions: not needed (it's a PDF)
- Headers/footers: subtle, consistent every page
- Tracking: tight on serif headlines, comfortable on body
- Hyphenation: enable for body text
- Widow/orphan control: enforce

═══════════════════════════════════════════════════════════════
THE FEELING TEST
═══════════════════════════════════════════════════════════════

When the CMO of Alza opens this PDF on her MacBook,
she should:
1. Hold breath for 2 seconds at the cover
2. Save it to her "important" folder, not "downloads"
3. Forward to her CEO with subject "this is worth reading"
4. Quote it in her next board deck
5. Remember the cover when she sees us again in 6 months
```

---

# 📦 ADDITIONAL ASSETS TO UPLOAD

Pre každý z 3 promptov, uploadni túto sadu:

## Asset Pack 1: Brand Foundation (always upload)

1. `mentivue-logo.svg` — primary logo
2. `mentivue-brand-identity.html` — full brand system reference
3. `BRAND_TOKENS.md` — compact design tokens (generujem nižšie)

## Asset Pack 2: Content & Data (for marketing + dashboard)

4. `SAMPLE_BRANDS.json` — 15 brand list with metadata
5. `SAMPLE_METRICS.json` — realistic data for mockups
6. `SAMPLE_PROMPTS.json` — 20 sample prompts to show methodology

## Asset Pack 3: References (highly recommended)

7. `REFERENCES.pdf` — 5-10 screenshots of FT, Bloomberg, Linear, A24, Stripe
8. `ANTI_REFERENCES.pdf` — 3-5 screenshots of what to AVOID (Profound, Peec, generic SaaS)

---

# 🎯 PROMPT USAGE STRATEGY

## Recommended sequence

**Week 1:**
- Day 1: Run Prompt 1 (Marketing Landing) → iterate 2-3 times
- Day 3: Run Prompt 2 (App Dashboard) → iterate 2-3 times
- Day 5: Run Prompt 3 (PDF Report) → iterate 2-3 times

**Week 2:**
- Adapt outputs to remaining pages (pricing variations, brand cards, etc.)
- 80% by reusing tokens from master templates

## Iteration prompts (after first generation)

After Prompt 1 (Marketing), say:
> "Now create a variation of this layout for the /audit landing page,
> keeping all design tokens but with focus on the sales pitch for
> Per-Brand Audit at €2,990. Include process timeline (5-day delivery)
> and FAQ accordion at bottom."

After Prompt 2 (Dashboard), say:
> "Now create the Reports Library page using same sidebar nav and
> design system. Should be a filterable list of past reports (Audit,
> Action Report, Pulse) with cover thumbnails and download buttons."

After Prompt 3 (PDF), say:
> "Now show me the 'Brand Card' public web page (mentivue.sk/brand/alza)
> using same PDF aesthetic but adapted for web. SEO-focused, locked
> sections teasing the full audit."

---

# ⚡ QUICK START SUMMARY

1. Open claude.ai/design
2. Upload: logo SVG + brand-identity.html + BRAND_TOKENS.md
3. Paste Prompt 1 (Marketing Landing)
4. Review output, iterate 2x with specific feedback
5. Repeat with Prompt 2 (Dashboard) and Prompt 3 (PDF)
6. Export to your codebase / Figma / wherever

Total time: 3-5 hours intensive design work for complete first-draft system.
