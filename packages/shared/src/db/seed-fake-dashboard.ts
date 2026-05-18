// Dev-only seed: populate enough data for the customer dashboard prototype to render with real DB-driven widgets.
//
// What it generates:
//   - 2 klients (test@mentivue.sk = pro / brand=alza,  tomas@mentivue.sk = admin)
//   - 90 days of llm_calls × 4 providers covering all prompt subcategories
//   - Per-provider distinct SoV / sentiment patterns (ChatGPT dominant, Gemini weakest etc.)
//   - Intentional anomaly events the WoW detector picks up:
//       day −10 → big SoV drop on Datart side (so heatmap shifts)
//       day −3  → klient's smartphone-category sentiment dips (anomaly card)
//   - Citations weighted toward heureka.sk / zive.sk
//   - Reports: 2 ready, 1 generating (Action), 1 scheduled (Audit Q2)
//
// Run: pnpm --filter @mentivue/shared exec bun --env-file=../../.env run src/db/seed-fake-dashboard.ts
//
// Re-runnable. Wipes existing fake-dashboard rows (llm_calls + responses + mentions + qualities)
// to avoid duplicate accumulation; klients are upserted.

import { eq, inArray, isNull, not } from 'drizzle-orm';
import {
  brandMentions,
  brands,
  db,
  klients,
  llmCalls,
  prompts,
  rawResponses,
  reports,
  responseQuality,
  verticals,
} from './index.ts';

const TEST_EMAIL = 'test@mentivue.sk';
const TEST_PASSWORD = 'test1234';
const TEST_BRAND_SLUG = 'alza';

const ADMIN_EMAIL = 'tomas@mentivue.sk';
const ADMIN_PASSWORD = 'admin1234';

const DAYS = 90;
const CALLS_PER_DAY_PER_PROVIDER = 4;

console.log('▸ Seeding fake dashboard data (90 days)…');

// ----------------------------------------------------------------------------
// Resolve vertical + brands
// ----------------------------------------------------------------------------
const vertical = await db.query.verticals.findFirst({
  where: eq(verticals.slug, 'sk-electronics'),
});
if (!vertical) throw new Error('Run pnpm db:seed first (vertical missing).');

const klientBrand = await db.query.brands.findFirst({
  where: eq(brands.slug, TEST_BRAND_SLUG),
});
if (!klientBrand) throw new Error(`Brand ${TEST_BRAND_SLUG} missing — run pnpm db:seed first.`);

const allBrands = await db.query.brands.findMany({
  where: eq(brands.verticalId, vertical.id),
});

// Pick named competitors so per-brand storylines are stable across runs
const datart = allBrands.find((b) => b.slug === 'datart')!;
const nay = allBrands.find((b) => b.slug === 'nay')!;
const planeo = allBrands.find((b) => b.slug === 'planeo')!;
const andrea = allBrands.find((b) => b.slug === 'andrea-shop')!;
const heureka = allBrands.find((b) => b.slug === 'heureka');

// ----------------------------------------------------------------------------
// Wipe prior fake data (only collection llm_calls from fake provider models)
// ----------------------------------------------------------------------------
const FAKE_MODELS = [
  'claude-haiku-4-5-20251001',
  'gpt-4o-mini',
  'sonar',
  'gemini-2.0-flash-exp',
];
const priorCalls = await db.query.llmCalls.findMany({
  where: inArray(llmCalls.model, FAKE_MODELS),
  columns: { id: true },
});
if (priorCalls.length > 0) {
  console.log(`  Wiping ${priorCalls.length} prior fake llm_calls (and cascaded rows)…`);
  const ids = priorCalls.map((c) => c.id);
  // brand_mentions cascades from raw_responses; raw_responses cascade from llm_calls
  await db.delete(llmCalls).where(inArray(llmCalls.id, ids));
}
// Wipe scheduled fake reports tied to no klient yet (re-runs would dupe)
await db.delete(reports).where(isNull(reports.storageUrl));
// Wipe ready demo reports too (so we don't accumulate "Q1 2026" copies)
await db.delete(reports).where(not(isNull(reports.klientId)));

// ----------------------------------------------------------------------------
// Klients
// ----------------------------------------------------------------------------
const testHash = await Bun.password.hash(TEST_PASSWORD, { algorithm: 'argon2id' });
await db
  .insert(klients)
  .values({
    email: TEST_EMAIL,
    name: 'Marek Horváth',
    company: 'Alza Slovakia s.r.o.',
    brandId: klientBrand.id,
    tier: 'pro',
    status: 'active',
    passwordHash: testHash,
    emailVerifiedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: klients.email,
    set: {
      name: 'Marek Horváth',
      company: 'Alza Slovakia s.r.o.',
      passwordHash: testHash,
      brandId: klientBrand.id,
      tier: 'pro',
      emailVerifiedAt: new Date(),
    },
  });
const testKlient = await db.query.klients.findFirst({ where: eq(klients.email, TEST_EMAIL) });
if (!testKlient) throw new Error('Failed to upsert test klient');
console.log(`✓ Klient: ${TEST_EMAIL} / ${TEST_PASSWORD} (Marek Horváth · Pro · Alza.sk)`);

const adminHash = await Bun.password.hash(ADMIN_PASSWORD, { algorithm: 'argon2id' });
await db
  .insert(klients)
  .values({
    email: ADMIN_EMAIL,
    name: 'Tomáš Majer',
    company: 'Mentivue',
    tier: null,
    status: 'active',
    passwordHash: adminHash,
    emailVerifiedAt: new Date(),
    isAdmin: true,
  })
  .onConflictDoUpdate({
    target: klients.email,
    set: {
      name: 'Tomáš Majer',
      passwordHash: adminHash,
      isAdmin: true,
      emailVerifiedAt: new Date(),
    },
  });
console.log(`✓ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

// ----------------------------------------------------------------------------
// Provider personas (drives per-provider variance in widgets)
// ----------------------------------------------------------------------------
type ProviderProfile = {
  provider: string;
  model: string;
  // Probability klient's brand is mentioned at all
  klientMentionRate: number;
  // Avg sentiment score [-1, +1] for klient's brand
  klientSentimentBase: number;
  // 0..1 intensity used for the LLM card heat shading
  intensity: number;
};
const providers: ProviderProfile[] = [
  { provider: 'anthropic',  model: 'claude-haiku-4-5-20251001', klientMentionRate: 0.65, klientSentimentBase: 0.55, intensity: 0.65 },
  { provider: 'openai',     model: 'gpt-4o-mini',                klientMentionRate: 0.78, klientSentimentBase: 0.62, intensity: 0.92 },
  { provider: 'perplexity', model: 'sonar',                      klientMentionRate: 0.55, klientSentimentBase: 0.42, intensity: 0.50 },
  { provider: 'gemini',     model: 'gemini-2.0-flash-exp',       klientMentionRate: 0.48, klientSentimentBase: 0.38, intensity: 0.30 },
];

// Competitor weight when klient brand isn't mentioned (or as secondary)
const competitors = [
  { brand: datart,  weight: 0.40 },
  { brand: nay,     weight: 0.30 },
  { brand: planeo,  weight: 0.18 },
  { brand: andrea,  weight: 0.12 },
];

// ----------------------------------------------------------------------------
// Subcategory → display row (heatmap rows) mapping
// ----------------------------------------------------------------------------
// Our prompt subcategories cover smartphones/laptops/tv_audio/white_goods/gaming/etc.
// The heatmap will pull these via SQL groupby — we just need broad coverage in seed.
// The seed uses prompts from EVERY subcategory by sampling each.
// ----------------------------------------------------------------------------
const allPrompts = await db.query.prompts.findMany({
  where: eq(prompts.verticalId, vertical.id),
});
if (allPrompts.length === 0) throw new Error('No prompts seeded.');

// Group prompts by subcategory for deterministic coverage
const promptsBySubcat = new Map<string, typeof allPrompts>();
for (const p of allPrompts) {
  const key = p.subcategory ?? '_none';
  const arr = promptsBySubcat.get(key) ?? [];
  arr.push(p);
  promptsBySubcat.set(key, arr);
}
const subcategoryKeys = [...promptsBySubcat.keys()].filter((k) => k !== '_none');
console.log(`  Coverage: ${subcategoryKeys.length} subcategories will be sampled each day.`);

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function weightedCompetitor(): (typeof competitors)[number]['brand'] {
  const r = Math.random();
  let acc = 0;
  for (const c of competitors) {
    acc += c.weight;
    if (r < acc) return c.brand;
  }
  return competitors[0]!.brand;
}

function sentimentBucket(score: number): 'positive' | 'neutral' | 'negative' {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

const sampleResponseTemplates = [
  'Najlepšie e-shopy s elektronikou na Slovensku zahŕňajú {b1}, {b2} a {b3}. {b1} ponúka široký výber produktov s rýchlym doručením.',
  'Pre kúpu {category} odporúčam pozrieť {b1} (často najlepšie ceny), {b2} (kvalitné značkové produkty) a {b3} (rýchle doručenie).',
  '{b1} aj {b2} sú stabilné voľby. Porovnanie cien viete robiť na heureka.sk alebo pricemania.sk.',
  'Aktuálne najobľúbenejšie obchody: {b1}, {b2}, {b3}. Zákaznícke recenzie sú dlhodobo solídne, najmä pre {b1}.',
  'Ak hľadáte {category}, skúste {b1} alebo {b2}. Pre nižšiu cenu pozrite {b3}.',
];
const citationDomains = [
  { d: 'heureka.sk', w: 0.32 },
  { d: 'zive.sk', w: 0.18 },
  { d: 'dsl.sk', w: 0.12 },
  { d: 'etrend.sk', w: 0.08 },
  { d: 'svetapple.sk', w: 0.07 },
  { d: 'sme.sk', w: 0.07 },
  { d: 'startitup.sk', w: 0.05 },
  { d: 'pocitace.sme.sk', w: 0.04 },
  { d: 'pcrevue.sk', w: 0.04 },
  { d: 'alza.sk', w: 0.03 },
];
function pickDomain(): string {
  const r = Math.random();
  let acc = 0;
  for (const c of citationDomains) {
    acc += c.w;
    if (r < acc) return c.d;
  }
  return citationDomains[0]!.d;
}

// ----------------------------------------------------------------------------
// Build llm_calls + raw_responses + brand_mentions + response_quality
// ----------------------------------------------------------------------------
const now = new Date();
const callsToInsert: Array<typeof llmCalls.$inferInsert> = [];
const callMeta: Array<{
  ts: Date;
  providerIdx: number;
  promptIdx: number;
  wantKlient: boolean;
  klientSent: number; // applied if klient mentioned
}> = [];

// Anomaly events:
//   day −10 (7d-ish range) → klient SoV halved on openai for smartphones
//   day −3  → klient sentiment dives on anthropic in smartphones
function getAnomalyAdjustments(daysAgo: number, provider: string, subcat: string | null) {
  let mentionMul = 1;
  let sentAdd = 0;
  if (daysAgo === 10 && provider === 'openai' && subcat === 'smartphones') {
    mentionMul = 0.25;
  }
  if (daysAgo >= 2 && daysAgo <= 4 && provider === 'anthropic' && subcat === 'smartphones') {
    sentAdd = -0.65;
  }
  return { mentionMul, sentAdd };
}

console.log(`  Building ${DAYS}d × ${providers.length} providers × ${CALLS_PER_DAY_PER_PROVIDER} calls/day = ${DAYS * providers.length * CALLS_PER_DAY_PER_PROVIDER} calls…`);

for (let d = DAYS - 1; d >= 0; d--) {
  const ts0 = new Date(now.getTime() - d * 86400000);

  for (let pIdx = 0; pIdx < providers.length; pIdx++) {
    const profile = providers[pIdx]!;
    for (let c = 0; c < CALLS_PER_DAY_PER_PROVIDER; c++) {
      // Pick a prompt subcategory uniformly so heatmap has coverage
      const subcatKey = subcategoryKeys[(d * CALLS_PER_DAY_PER_PROVIDER + c) % subcategoryKeys.length]!;
      const bucket = promptsBySubcat.get(subcatKey)!;
      const prompt = bucket[Math.floor(Math.random() * bucket.length)]!;
      const promptIdx = allPrompts.indexOf(prompt);

      const adj = getAnomalyAdjustments(d, profile.provider, prompt.subcategory);
      const effMentionRate = clamp(profile.klientMentionRate * adj.mentionMul, 0, 1);
      const wantKlient = Math.random() < effMentionRate;
      const klientSent = clamp(
        profile.klientSentimentBase + adj.sentAdd + (Math.random() * 0.4 - 0.2),
        -1,
        1,
      );

      const ts = new Date(ts0.getTime() + randInt(0, 23) * 3600000 + randInt(0, 59) * 60000);
      callsToInsert.push({
        promptId: prompt.id,
        provider: profile.provider,
        model: profile.model,
        callType: 'collection',
        inputTokens: randInt(200, 800),
        outputTokens: randInt(300, 1500),
        estimatedCostUsd: Math.random() * 0.02,
        latencyMs: randInt(800, 4500),
        status: Math.random() < 0.02 ? 'error' : 'success',
        createdAt: ts,
        metadata: { subcategory: prompt.subcategory },
      });
      callMeta.push({ ts, providerIdx: pIdx, promptIdx, wantKlient, klientSent });
    }
  }
}

console.log(`  Inserting ${callsToInsert.length} llm_calls (batched)…`);
const INSERT_BATCH = 500;
const insertedCalls: Array<{ id: string }> = [];
for (let i = 0; i < callsToInsert.length; i += INSERT_BATCH) {
  const chunk = callsToInsert.slice(i, i + INSERT_BATCH);
  const ret = await db.insert(llmCalls).values(chunk).returning({ id: llmCalls.id });
  insertedCalls.push(...ret);
}

// ----------------------------------------------------------------------------
// raw_responses (1:1 with llm_calls, but only for status='success')
// ----------------------------------------------------------------------------
const responsesToInsert: Array<typeof rawResponses.$inferInsert> = [];
const callToResponseIdx: number[] = []; // map insertedCalls idx → responsesToInsert idx (or -1)
for (let i = 0; i < insertedCalls.length; i++) {
  const callRow = callsToInsert[i]!;
  if (callRow.status !== 'success') {
    callToResponseIdx.push(-1);
    continue;
  }
  const meta = callMeta[i]!;
  const prompt = allPrompts[meta.promptIdx]!;

  // Compose response text
  const b1 = meta.wantKlient ? klientBrand : weightedCompetitor();
  const b2 = b1 === klientBrand ? weightedCompetitor() : weightedCompetitor();
  const b3 = weightedCompetitor();
  const template = rand(sampleResponseTemplates);
  const text = template
    .replaceAll('{b1}', b1.name)
    .replaceAll('{b2}', b2.name)
    .replaceAll('{b3}', b3.name)
    .replaceAll('{category}', prompt.subcategory ?? 'elektroniku');

  // Citations: 0–4, weighted domains
  const citCount = Math.random() < 0.3 ? 0 : randInt(1, 4);
  const citations = Array.from({ length: citCount }, () => {
    const domain = pickDomain();
    return { url: `https://www.${domain}/`, domain, title: `${domain} — výsledok` };
  });

  callToResponseIdx.push(responsesToInsert.length);
  responsesToInsert.push({
    llmCallId: insertedCalls[i]!.id,
    responseText: text,
    citations,
  });
}

console.log(`  Inserting ${responsesToInsert.length} raw_responses…`);
const insertedResponses: Array<{ id: string }> = [];
for (let i = 0; i < responsesToInsert.length; i += INSERT_BATCH) {
  const chunk = responsesToInsert.slice(i, i + INSERT_BATCH);
  const ret = await db.insert(rawResponses).values(chunk).returning({ id: rawResponses.id });
  insertedResponses.push(...ret);
}

// ----------------------------------------------------------------------------
// brand_mentions: based on wantKlient flag and the chosen b1/b2/b3
// ----------------------------------------------------------------------------
const mentionsToInsert: Array<typeof brandMentions.$inferInsert> = [];
for (let i = 0; i < insertedCalls.length; i++) {
  const respIdx = callToResponseIdx[i];
  if (respIdx === undefined || respIdx < 0) continue;
  const respId = insertedResponses[respIdx]!.id;
  const meta = callMeta[i]!;

  const mentioned: Array<{ brandId: string; sentiment: number }> = [];

  if (meta.wantKlient) {
    mentioned.push({ brandId: klientBrand.id, sentiment: meta.klientSent });
  }

  // 1–3 competitor mentions
  const competitorCount = randInt(1, 3);
  const used = new Set<string>(mentioned.map((m) => m.brandId));
  for (let k = 0; k < competitorCount; k++) {
    const c = weightedCompetitor();
    if (used.has(c.id)) continue;
    used.add(c.id);
    // Competitor sentiment baseline (slightly less positive than klient if klient is mentioned)
    const sent = clamp((Math.random() * 0.8 - 0.1), -1, 1);
    mentioned.push({ brandId: c.id, sentiment: sent });
  }

  // Sometimes mention heureka (comparator) as #3
  if (heureka && Math.random() < 0.18 && !used.has(heureka.id)) {
    mentioned.push({ brandId: heureka.id, sentiment: 0 });
  }

  // Assign positions (klient first if mentioned)
  mentioned.forEach((m, idx) => {
    const position = idx + 1;
    const bucket = sentimentBucket(m.sentiment);
    mentionsToInsert.push({
      rawResponseId: respId,
      brandId: m.brandId,
      position,
      sentiment: bucket,
      sentimentScore: m.sentiment,
      mentionStrength: position === 1 ? 'primary' : position === 2 ? 'secondary' : 'passing',
      context: '…porovnanie eshopov s elektronikou…',
      confidence: 0.7 + Math.random() * 0.3,
    });
  });
}

console.log(`  Inserting ${mentionsToInsert.length} brand_mentions (batched)…`);
for (let i = 0; i < mentionsToInsert.length; i += INSERT_BATCH) {
  await db.insert(brandMentions).values(mentionsToInsert.slice(i, i + INSERT_BATCH));
}

// ----------------------------------------------------------------------------
// response_quality (1 per successful call)
// ----------------------------------------------------------------------------
const qualityRows: Array<typeof responseQuality.$inferInsert> = [];
for (let i = 0; i < insertedCalls.length; i++) {
  if (callToResponseIdx[i] === undefined || callToResponseIdx[i] === -1) continue;
  const refused = Math.random() < 0.015;
  qualityRows.push({
    llmCallId: insertedCalls[i]!.id,
    qualityScore: refused ? 0 : 5 + Math.random() * 5,
    relevance: refused ? 0 : randInt(2, 3),
    specificity: refused ? 0 : randInt(2, 3),
    citationQuality: refused ? 0 : randInt(0, 2),
    languageCorrectness: refused ? 0 : randInt(1, 2),
    refused,
  });
}
for (let i = 0; i < qualityRows.length; i += INSERT_BATCH) {
  await db.insert(responseQuality).values(qualityRows.slice(i, i + INSERT_BATCH));
}
console.log(`  ✓ ${qualityRows.length} response_quality rows`);

// ----------------------------------------------------------------------------
// Reports — right rail "upcoming" + reports archive
// ----------------------------------------------------------------------------
const monthAgo = (n: number) => new Date(now.getTime() - n * 30 * 86400000);
const monthAhead = (n: number) => new Date(now.getTime() + n * 30 * 86400000);

const reportRows: Array<typeof reports.$inferInsert> = [
  {
    type: 'audit',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: monthAgo(4),
    periodEnd: monthAgo(3),
    storageUrl: '#',
    status: 'ready',
    metadata: { pages: 35, title: 'Mentivue Audit Q1 2026' },
  },
  {
    type: 'pulse',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: new Date(now.getTime() - 21 * 86400000),
    periodEnd: new Date(now.getTime() - 14 * 86400000),
    storageUrl: '#',
    status: 'ready',
    metadata: { pages: 5, title: 'Pulse · týždeň 17' },
  },
  {
    type: 'pulse',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: new Date(now.getTime() - 14 * 86400000),
    periodEnd: new Date(now.getTime() - 7 * 86400000),
    storageUrl: '#',
    status: 'ready',
    metadata: { pages: 5, title: 'Pulse · týždeň 18' },
  },
  {
    type: 'pulse',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: new Date(now.getTime() - 7 * 86400000),
    periodEnd: new Date(now.getTime() - 1 * 86400000),
    storageUrl: '#',
    status: 'ready',
    metadata: { pages: 5, title: 'Pulse · týždeň 19' },
  },
  {
    type: 'action',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: monthAgo(1),
    periodEnd: now,
    storageUrl: null,
    status: 'generating',
    metadata: { pages: 15, title: 'Mesačný Action Report' },
  },
  {
    type: 'audit',
    klientId: testKlient.id,
    brandId: klientBrand.id,
    verticalId: vertical.id,
    periodStart: now,
    periodEnd: monthAhead(2),
    storageUrl: null,
    status: 'pending',
    metadata: { pages: 35, title: 'Q2 Full Audit · v príprave' },
  },
];

await db.insert(reports).values(reportRows);
console.log(`  ✓ ${reportRows.length} reports inserted`);

console.log('');
console.log('Fake dashboard data ready. Try:');
console.log(`  pnpm dev:app`);
console.log(`  open http://localhost:3030/login`);
console.log(`  klient login:  ${TEST_EMAIL} / ${TEST_PASSWORD}`);
console.log(`  admin login:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
console.log('');
console.log('Embedded anomalies (WoW detector should flag these):');
console.log('  • day-10  openai · smartphones · klient SoV halved (Datart surge)');
console.log('  • day-2…4 anthropic · smartphones · klient sentiment −0.65');

process.exit(0);
