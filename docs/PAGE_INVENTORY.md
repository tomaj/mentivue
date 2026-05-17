# Mentivue - Page Inventory & Design Roadmap

Komplet zoznam stránok ktoré potrebuješ. Rozdelené podľa fáz Phased GTM plánu a podľa priority pre launch.

---

## 🔥 LAUNCH ESSENTIALS (Week 6 must-have) - 12 stránok

Bez týchto sa nedá public launch.

### Marketing/Public layer (8 stránok)

**1. Homepage (`/`)** - PRIORITY #1
- Hero s value prop a Live Mentivue Index widget
- 4 sections: How it works, Reports preview, Pricing teaser, Methodology
- Newsletter signup form
- Top a bottom CTA
- Trust signals (logá nikde inde nie sú, ale "tracked brands" carousel)

**2. Pricing (`/pricing`)**
- 3-tier comparison (Watch €490 / Pro €1 490 / Enterprise €4 990)
- FAQ accordion (top 8 pricing questions)
- "Compare all features" expandable table
- Stripe checkout integration buttons

**3. Industry Report landing (`/report`)**
- Preview cover + 10 sample strán
- "Get free 10 pages" lead capture form
- Full version €299 CTA
- Newsletter subscribe
- Sample data visualizations

**4. Per-Brand Audit landing (`/audit`)**
- Sales page: problem → solution → process
- "What you get" - 35-pages structure preview
- Pricing €2 990 / €1 490/mes (subscription discount)
- Onboarding flow preview (3 steps)
- FAQ accordion
- Order CTA → Stripe checkout

**5. Methodology (`/methodology`)** - kritické pre autoritu
- Transparent metodológia
- 1 176 prompts breakdown s kategóriami
- 4 LLM providers explained
- Validation methods M1-M22 simplified
- Limitations úprimne disclosed

**6. Brand cards template (`/brand/[slug]`)** - 15 variants
- Per-brand SEO landing
- Live Mentivue Index per brand
- 30-day trend chart
- 3 sample quotes z AI
- "Get full audit" CTA
- Related brands sidebar

**7. About (`/about`)**
- Tomas founder story (krátko, autoritatívne)
- Why Mentivue exists
- Methodology philosophy
- Contact info

**8. Legal pages (`/legal/*`)**
- Terms of Service
- Privacy Policy
- Cookie Policy
- DPA (Data Processing Agreement)
- Imprint
*Mohli by byť jedna stránka s tabmi, ale lepšie každá samostatne pre SEO/legal compliance*

### Product/App layer (4 stránok)

**9. Klient Dashboard (`/app/dashboard`)** - Pro+ tier hlavná stránka
- Their brand Mentivue Index
- 30-day trend chart
- Top 3 movements this week
- Latest report links
- Quick stats
- Activity feed

**10. Reports library (`/app/reports`)**
- All historical reports (Audits, Action Reports, Pulse archive)
- Filter by type, date
- Download buttons
- Reading status indicators

**11. Onboarding form (`/app/onboarding`)** - 5-step wizard
- Brand info
- Competitors (3 named)
- Categories focus
- Business context (AOV, conversion, traffic)
- Confirmation

**12. Account settings (`/app/settings`)**
- Subscription management (Stripe)
- Team members
- Notification preferences
- API keys (Enterprise)
- Invoices

---

## 📈 PHASE 2 ADDITIONS (Month 3-6) - 8 stránok

Pridať keď Watch tier ide live.

**13. Watch tier specific landing (`/watch`)** - lower-friction entry
**14. Methodology deep dive (`/methodology/[topic]`)** - SEO content
**15. Blog index (`/blog`)** - content marketing hub
**16. Blog post template (`/blog/[slug]`)** - article reading view
**17. Pulse archive (`/pulse`)** - public Pulse newsletter archive
**18. Customer stories (`/customers/[case-study]`)** - prvé case studies
**19. App: Klient settings expanded** - team mgmt, billing
**20. App: Custom prompts editor (`/app/prompts`)** - Pro+ feature

---

## 🚀 PHASE 3 ADDITIONS (Month 6-12) - 12 stránok

Pridať keď Pro tier ide live.

**21. Action Report viewer (`/app/reports/action/[id]`)** - interactive monthly report view (nie len PDF)
**22. Strategy call booking (`/app/strategy`)** - Calendly integrated
**23. Competitor monitor (`/app/competitors`)** - track competitor moves
**24. Alerts inbox (`/app/alerts`)** - real-time anomaly stream
**25. Slack bot setup (`/app/integrations/slack`)** - install flow
**26. Comparison tool (`/compare`)** - public 2-brand quick compare (lead gen)
**27. Industry insights (`/insights`)** - cross-brand patterns (free public)
**28. Annual Report ($299) (`/annual`)** - separate sales page
**29. Competitive Benchmark sales (`/benchmark`)** - €3 990 premium product
**30. Custom Research inquiry (`/custom`)** - lead form
**31. Resources hub (`/resources`)** - templates, guides, checklists
**32. App: Alert configuration (`/app/alerts/setup`)** - per-brand alert rules

---

## 🌍 PHASE 4 ADDITIONS (Year 2+) - 8 stránok

Pridať keď Enterprise tier + multi-vertical.

**33. Enterprise demo booking (`/enterprise`)** - white-glove sales
**34. Multi-brand dashboard (`/app/portfolio`)** - Enterprise view
**35. API documentation (`/docs/api`)** - Enterprise developer docs
**36. Vertical: Banking (`/banks`)** - new vertical landing
**37. Vertical: Real Estate (`/real-estate`)** - new vertical landing
**38. CZ market (`/cz/*`)** - Czech version of all main pages
**39. Partner program (`/partners`)** - agencies, consultants
**40. Investor / press (`/press`)** - PR resources, press kit

---

## Summary by phase

| Phase | Pages | Cumulative | Priority |
|---|---|---|---|
| **Launch (Week 6)** | 12 | 12 | MUST |
| **Phase 2 (M3-6)** | 8 | 20 | SHOULD |
| **Phase 3 (M6-12)** | 12 | 32 | NICE |
| **Phase 4 (Y2+)** | 8 | 40 | LATER |

---

## Realistic Week 6 launch minimum

Ak chceš ísť ešte rýchlejšie, **absolútne minimum pre revenue generation:**

### Tier 0 - "Ship-in-5-days" version (5 stránok)

1. Homepage with embedded pricing
2. Per-Brand Audit landing + Stripe checkout
3. Industry Report download (email gate)
4. Methodology (autorita, dôvera)
5. Legal one-pager (Terms + Privacy combined)

Toto stačí na **first paying klient**. Všetko ostatné pridať postupne.

App vrstva (klient dashboard) môže byť na začiatok **iba PDF cez email**. Žiadny portál. Pridáš keď budeš mať 5+ klientov.

---

## Stránky podľa template typu

Pre design handoff (claude.ai/design), nie všetky stránky sú samostatné šablóny. Reálne potrebuješ tieto unikátne template typy:

### A. Marketing templates (6 templates)

1. **Marketing landing** (Homepage, /pricing, /audit, /report, /watch)
2. **Methodology / content** (/methodology, /about, /legal)
3. **Brand card / SEO landing** (15 variants z 1 templatu)
4. **Blog post / article** (všetky blog posty + case studies)
5. **Sales / product specific** (audit, benchmark, custom research)
6. **Lead capture / form** (newsletter, download, contact)

### B. App templates (5 templates)

7. **App dashboard** (overview screen)
8. **App report viewer** (interactive PDF view)
9. **App list view** (reports library, alerts, prompts)
10. **App settings / form** (onboarding wizard, account settings)
11. **App empty state / onboarding step**

### C. Communication templates (3 templates)

12. **Email template** (12 variants ale 1 base design)
13. **PDF report cover + section pages** (Audit, Action Report, Industry)
14. **Pulse newsletter email** (special, weekly recurring)

**Total unique templates needed: 14**

S 14 templates môžeš pokryť všetkých 40 stránok v celej roadmape.

---

## Bottom line - čo objednať z claude.ai/design

### Realistic first design batch (week 1-2)

**Order 5 templates v poradí:**

1. **Marketing landing master** (use pre homepage, audit, pricing, report pages)
2. **App dashboard master** (use pre klient dashboard a app screens)
3. **PDF report design** (use pre všetky reports - Audit, Action, Industry)
4. **Email template master** (use pre všetkých 12 email scenarios)
5. **Brand card template** (use pre 15 SEO landing pages)

Toto pokryje **80% launch potreba**. Ostatné si vieš spraviť variácie sám.

Cena: claude.ai/design pricing v Q2 2026 je ~€20-40 per design (premium quality). Budget: **€100-200 za prvý batch**.

ROI: ušetríš 40-60h designera time (€2000-3000 ekvivalent ak by si hiroval).
