# Mentivue Brand Tokens — Design System Reference

Compact reference for Mentivue's design system. Upload this to claude.ai/design alongside the logo SVG.

---

## BRAND ESSENCE

**What we are:** B2B research firm measuring AI search visibility (Bloomberg/Gartner for AI search era)
**What we feel like:** Editorial intelligence + financial seriousness
**Reference vibes:** Financial Times × Bloomberg × A24 × Linear × Stripe Atlas
**Anti-vibes:** Generic SaaS · purple AI gradients · Web3 neon · friendly cartoons

---

## COLOR TOKENS

```css
/* Primary palette — use these as CSS variables */
--ink:         #0E1116;  /* headlines, primary text */
--ink-soft:    #1F2429;  /* body text */
--paper:       #F7F4ED;  /* main background, warm off-white */
--paper-pure:  #FFFFFF;  /* cards, contrast surfaces */
--bone:        #EBE5D7;  /* subtle dividers, soft surfaces */
--depth:       #1B3A4B;  /* editorial dark surfaces */
--signal:      #FF5B3A;  /* CTA, key data, italic accents */
--signal-soft: #FFE8E0;  /* highlight tints */

/* Data state colors */
--positive:    #2D6A4F;  /* positive deltas */
--negative:    #C73E1D;  /* negative deltas */
--neutral:     #6B7280;  /* neutral data */
```

### Color usage ratio (CRITICAL)
- Paper background: 60% of surface
- Ink text/elements: 25%
- Bone/Soft accents: 10%
- Signal coral: ≤ 5% (RESERVED for CTAs + key data)

### Rules
- ❌ Never use signal as large background
- ❌ Never use gradients (we're not a startup)
- ❌ Never use pure white as main background (use paper)
- ✅ Always pair signal with ink/paper for contrast
- ✅ Italic + coral = emotional emphasis moment

---

## TYPOGRAPHY TOKENS

```css
/* Three families, three voices */
--font-display: 'Fraunces', Georgia, serif;
--font-body:    'Inter Tight', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;
```

### Type scale (web)

```
DISPLAY (Fraunces)
- Hero:    72px / 1.0 / -0.035em / weight 400
- H1:      48px / 1.05 / -0.025em / weight 400
- H2:      32px / 1.1  / -0.02em  / weight 500
- H3:      24px / 1.2  / -0.01em  / weight 500
- H4:      20px / 1.3  / -0.01em  / weight 500

BODY (Inter Tight)
- Lede:    18px / 1.55 / weight 400
- Body:    16px / 1.5  / weight 400
- Small:   14px / 1.5  / weight 400
- Tiny:    13px / 1.4  / weight 500

MONO (JetBrains Mono)
- Stat:    16px / 1.4  / weight 500
- Label:   11px / 1.0  / 0.12em tracking / UPPERCASE
- Caption: 10px / 1.0  / 0.10em tracking / UPPERCASE
- Footer:  9px  / 1.0  / 0.14em tracking / UPPERCASE
```

### Type rules
- ✅ Use italic Fraunces for emotional accents (always with signal color)
- ✅ Use mono for ALL numbers, percentages, timestamps, data
- ✅ Use Inter Tight for body, UI labels, navigation
- ❌ Never use Inter (use Inter Tight, it's different)
- ❌ Never use Space Grotesk, Poppins, Geist, or any generic
- ❌ Don't mix Fraunces with other serifs

---

## LOGO USAGE

### Mark composition
- Outer circle (containment, scope)
- Inner diamond (geometric eye, vision)
- Coral dot center (data point, signal)
- Coral pulse line right (signal emerging)

### Wordmark
- Always lowercase: "mentivue"
- Never capitalized, not even at sentence start
- Always paired with mark (or mark-only for tight spaces)

### Sizing
- Min web: 24px height (mark only) or 80px width (full)
- Min print: 8mm height (mark only) or 24mm width (full)
- Optimal: 32-56px height in headers

### Don'ts
- ❌ Don't frame in avatar/circle (mark has circle)
- ❌ Don't tilt or rotate
- ❌ Don't change colors (only swap ink/paper for dark mode)
- ❌ Don't stretch
- ❌ Don't add tagline next to it (keep clean)

---

## SPATIAL TOKENS

```css
/* Spacing scale (8px base, except micro) */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  24px;
--space-6:  32px;
--space-7:  48px;
--space-8:  64px;
--space-9:  96px;
--space-10: 128px;

/* Container widths */
--container-narrow:  640px;  /* article reading */
--container-default: 1280px; /* most pages */
--container-wide:    1440px; /* dashboards */

/* Border tokens */
--line:       1px solid var(--ink);
--line-soft:  1px solid rgba(14, 17, 22, 0.12);
--line-paper: 1px solid var(--bone);

/* No radius — we're editorial, not soft */
--radius-default: 0;
--radius-large:   2px;  /* maximum, very rare */
```

### Spatial rules
- ✅ Use generous negative space (think art book)
- ✅ Asymmetric grids preferred (1.2fr / 1fr beats 1fr / 1fr)
- ✅ 1px borders > shadows (editorial, not floating)
- ❌ No rounded corners (or maximum 2px)
- ❌ No drop shadows on cards (use 1px borders instead)

---

## DECORATIVE TOKENS

### Grain overlay (subtle texture across body)
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

### Pulse animation (for live indicators)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
.pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--signal);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}
```

---

## COMPONENT PATTERNS

### Buttons
```
PRIMARY (CTA):
  background: ink (#0E1116)
  color: paper (#F7F4ED)
  border: none
  padding: 14px 24px
  font: 14px Inter Tight medium
  hover: background depth (#1B3A4B)

SECONDARY (outlined):
  background: transparent
  color: ink
  border: 1px solid ink
  padding: 13px 24px
  hover: background bone

DESTRUCTIVE / SIGNAL CTA (rare):
  background: signal (#FF5B3A)
  color: paper
  use only for highest-priority CTAs
```

### Data cards
```
.metric-card {
  background: paper-pure
  border: 1px solid ink
  padding: 24px
  no border-radius
}

.metric-label { mono uppercase 10px }
.metric-number { display 48px, optional italic + coral }
.metric-trend { mono 11px, green/red }
```

### Charts
```
- Primary series: signal coral, 2px solid
- Comparison series: ink, 2px solid
- Gridlines: bone, 1px dashed
- Labels: mono 10px
- Tooltips: ink background, paper text, 1px border
- No gradients on data
- No 3D effects ever
- Square line caps (not rounded)
```

### Tables
```
- Headers: mono uppercase 10px ink-soft
- Rows: alternating paper + paper-pure
- Dividers: 1px line-soft
- Numbers: mono, right-aligned
- Brand names: Fraunces 500, left-aligned
- Hover row: bone background
```

---

## MOTION TOKENS

```css
/* Easing */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);

/* Durations */
--duration-fast:   150ms;
--duration-medium: 250ms;
--duration-slow:   400ms;

/* Motion rules */
- Hover transitions: 150-200ms
- Page load stagger: 50ms between elements
- Pulse loops: 2s
- No spring physics (too playful)
- No parallax (too web-3-ish)
- No mouse trails (gimmicky)
```

---

## VOICE & TONE

### Headlines (Fraunces, italic + coral for accents)
- ✅ "What AI says about your brand."
- ✅ "From 1,176 prompts to one signal."
- ❌ "Boost your AI search visibility now!"
- ❌ "Revolutionize your marketing strategy"

### Body copy
- Direct, confident, never breathless
- Numbers > adjectives
- Specific > generic
- ✅ "1,176 prompts. 4 engines. 90 days."
- ❌ "Comprehensive AI search intelligence platform"

### Mono labels (uppercase, tracked)
- ✅ "Q2 2026 · ELECTRONICS · SLOVAKIA"
- ✅ "LIVE INDEX · UPDATED 03:42 UTC"
- ❌ "Awesome features"

### CTAs
- ✅ "Read the Index →"
- ✅ "Get a brand audit"
- ✅ "See the methodology"
- ❌ "Start free trial"
- ❌ "Get started"
- ❌ "Sign up now!"

---

## ICONOGRAPHY

**Default position: avoid icons.**

We're editorial, not iconographic. Use icons only when:
1. Data visualization needs them (sparklines, trend arrows)
2. Functional UI requires them (search, settings)
3. Status indicators (pulse, check, alert)

When using icons:
- Style: Lucide Icons (lucide.dev)
- Stroke: 1.5px
- Size: 16px or 20px
- Color: inherit from context
- Never decorative
- Never emoji

---

## PHOTOGRAPHY / IMAGERY

**Default position: avoid photography.**

We're not Stripe (they have great photo direction).
We're FT (text > image).

If imagery needed:
- Documentary B&W or duotone (paper/ink)
- High grain, low saturation
- No stock photos of dashboards
- No people pointing at screens
- No "diverse team" stock imagery
- Better: abstract editorial textures

Better than photos:
- Typographic compositions
- Data visualizations as hero elements
- Geometric line illustrations matching logo aesthetic
- The logo mark blown up as decorative element

---

## FILE FORMATS

### Web exports
- Logos: SVG (inline) or PNG @2x
- Photos (rare): WebP with JPEG fallback
- Icons: SVG inline

### Print exports
- PDF/X-3 for press
- 300 DPI minimum
- CMYK color space (translate from hex)
- Embed all fonts

### Email exports
- Plain HTML + inline CSS only
- 600px max width
- System font fallbacks (Georgia, Helvetica, Courier)
- No background images

---

## CHECKLIST: "Is this on brand?"

Before approving any design, check:

- [ ] Paper background (not pure white)?
- [ ] Coral used sparingly (≤5%)?
- [ ] Fraunces for display, Inter Tight body, JetBrains for data?
- [ ] No purple, no gradients, no glassmorphism?
- [ ] Wordmark lowercase always?
- [ ] 1px borders > shadows?
- [ ] Generous negative space?
- [ ] Mono uppercase labels?
- [ ] Italic + coral for emotional moments?
- [ ] Editorial feel (not "startup")?

If all ✅: ship it.
If any ❌: revise.

---

## EMERGENCY ANTI-PATTERNS

**STOP and reconsider if you see:**

- 🚫 Purple anywhere
- 🚫 Gradient backgrounds
- 🚫 Generic Inter font
- 🚫 Friendly illustrations
- 🚫 Stock photography
- 🚫 Rounded buttons with shadows
- 🚫 "AI Powered" badges
- 🚫 Floating glassmorphism cards
- 🚫 Neon accents
- 🚫 Capitalized "Mentivue"
