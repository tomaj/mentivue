// Print a live aggregation snapshot from the database.
// Usage: pnpm --filter @mentivue/workers report:snapshot

import {
  costSummary,
  positionRankings,
  providerQuality,
  type QueryFilters,
  sentimentSummary,
  shareOfVoice,
  topCitationDomains,
  untrackedBrands,
} from '@mentivue/shared/db/queries';

const filters: QueryFilters = { verticalSlug: 'sk-electronics' };

function section(title: string) {
  console.log('');
  console.log(`━━━ ${title} ━━━`);
}

function pct(n: number | null | undefined) {
  return n == null ? '   —' : `${n.toFixed(1).padStart(5)}%`;
}

function num(n: number | null | undefined, w = 5) {
  return n == null ? '—'.padStart(w) : String(n).padStart(w);
}

function score(n: number | null | undefined) {
  return n == null ? '   —' : n.toFixed(2).padStart(5);
}

// ---- Cost summary ----
section('Cost summary (all time)');
const costs = await costSummary();
console.log('  call_type   provider     calls    total $    avg $');
for (const r of costs) {
  console.log(
    `  ${r.call_type.padEnd(11)} ${r.provider.padEnd(11)} ` +
      `${num(r.total_calls)}  $${r.total_cost_usd.toFixed(4).padStart(8)}  ` +
      `$${r.avg_cost_per_call.toFixed(6)}`,
  );
}

// ---- Provider quality ----
section('Provider quality (collection only)');
const quality = await providerQuality(filters);
console.log('  provider     calls   q-avg  refused%   tokens in/out   p50-lat   total $');
for (const r of quality) {
  console.log(
    `  ${r.provider.padEnd(11)} ${num(r.total_calls)}   ${score(r.avg_quality_score)}  ` +
      `${pct(r.refusal_rate_pct)}    ${num(r.avg_input_tokens, 5)}/${num(r.avg_output_tokens, 4)}   ` +
      `${num(r.avg_latency_ms, 6)}ms  $${(r.total_cost_usd ?? 0).toFixed(4)}`,
  );
}

// ---- Share of Voice ----
section('Share of Voice — per provider × brand');
const sov = await shareOfVoice(filters);
console.log('  provider     brand            SoV%   mentions  avg-pos  sentiment');
for (const r of sov) {
  console.log(
    `  ${r.provider.padEnd(11)} ${r.brand_slug.padEnd(15)} ${pct(r.sov_pct)}  ` +
      `${num(r.responses_with_mention)}     ${score(r.avg_position)}    ${score(r.avg_sentiment_score)}`,
  );
}

// ---- Position rankings (across all providers) ----
section('Position rankings (1/pos weighted, across providers)');
const positions = await positionRankings(filters);
console.log('  brand            mentions  avg-pos  position-score');
for (const r of positions) {
  console.log(
    `  ${r.brand_slug.padEnd(15)} ${num(r.mention_count)}     ${score(r.avg_position)}    ${score(r.position_score)}`,
  );
}

// ---- Sentiment ----
section('Sentiment summary per brand');
const sentiment = await sentimentSummary(filters);
console.log('  brand            mentions  sent-avg   pos / neu / neg   pos%');
for (const r of sentiment) {
  console.log(
    `  ${r.brand_slug.padEnd(15)} ${num(r.total_mentions)}    ${score(r.avg_sentiment_score)}    ` +
      `${num(r.positive_count, 2)} / ${num(r.neutral_count, 2)} / ${num(r.negative_count, 2)}    ` +
      `${pct(r.positive_pct)}`,
  );
}

// ---- Top citation domains ----
section('Top citation domains');
const citations = await topCitationDomains(filters, 15);
console.log('  domain                          cites  unique-resp   share%');
for (const r of citations) {
  console.log(
    `  ${(r.domain ?? '').padEnd(30)}  ${num(r.citation_count, 4)}    ${num(r.unique_responses, 4)}     ${pct(r.citation_share_pct)}`,
  );
}

// ---- Untracked brands ----
section('Untracked brands AI mentioned (expansion candidates)');
const untracked = await untrackedBrands(filters);
if (untracked.length === 0) {
  console.log('  (none yet)');
} else {
  console.log('  brand                          occurrences');
  for (const r of untracked) {
    console.log(`  ${(r.brand ?? '').padEnd(30)}  ${num(r.occurrences, 4)}`);
  }
}

console.log('');
process.exit(0);
