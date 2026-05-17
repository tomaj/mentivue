// Run brand-extraction analysis on every raw_response that doesn't have
// brand_mentions yet. Idempotent — re-runs only target unanalyzed rows.
//
// Usage:
//   pnpm --filter @mentivue/workers analyze:pending

import { sql } from 'drizzle-orm';
import { db } from '@mentivue/shared/db';
import { analyzeResponse } from '../agents/analyzer.ts';

const pending = await db.execute<{ id: string }>(sql`
  SELECT rr.id
  FROM raw_responses rr
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE lc.call_type = 'collection'
    AND NOT EXISTS (
      SELECT 1 FROM brand_mentions bm WHERE bm.raw_response_id = rr.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM response_quality rq WHERE rq.llm_call_id = lc.id
    )
  ORDER BY rr.created_at ASC
`);

const rows = pending as unknown as Array<{ id: string }>;

if (rows.length === 0) {
  console.log('✓ No pending raw_responses to analyze.');
  process.exit(0);
}

console.log(`▸ Analyzing ${rows.length} raw_response(s)…`);
console.log('');

let totalCost = 0;
let totalMentions = 0;
const allUntracked = new Set<string>();

for (const row of rows) {
  try {
    const r = await analyzeResponse(row.id);
    totalCost += r.analysisCostUsd;
    totalMentions += r.mentionsInserted;
    r.untrackedBrands.forEach((b) => allUntracked.add(b));
    console.log(
      `✓ ${row.id.slice(0, 8)}  ` +
        `${String(r.mentionsInserted).padStart(2)} mentions  ` +
        `q=${r.qualityScore.toFixed(1).padStart(4)}  ` +
        `refused=${r.refused ? 'Y' : 'N'}  ` +
        `lang=${r.languageDetected ?? '?'}  ` +
        `$${r.analysisCostUsd.toFixed(6)}  ${r.analysisLatencyMs}ms`,
    );
    if (r.untrackedBrands.length > 0) {
      console.log(`     untracked: ${r.untrackedBrands.join(', ')}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${row.id.slice(0, 8)}  ${message}`);
  }
}

console.log('');
console.log(
  `Total: ${rows.length} analyzed, ${totalMentions} brand mentions, $${totalCost.toFixed(6)} spent.`,
);
if (allUntracked.size > 0) {
  console.log(`Untracked brands across all responses: ${[...allUntracked].join(', ')}`);
}

process.exit(0);
