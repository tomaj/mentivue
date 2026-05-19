// Pilot run — 20 cherry-picked prompts × every available LLM, then analyze.
//
// 5 prompts from each of: commercial_intent, comparison, discovery, long_tail.
// Each llm_call is stamped with metadata.pilot_run_id so we can filter results
// in the review script. Persists collection + analysis to the live DB (same
// tables the real pipeline uses).
//
// Usage:
//   pnpm --filter @mentivue/workers pilot
//
// After it completes, render the review with:
//   pnpm --filter @mentivue/workers pilot:review

import { db, llmCalls, prompts, rawResponses } from '@mentivue/shared/db';
import { getAvailableClients } from '@mentivue/shared/llm';
import { inArray } from 'drizzle-orm';
import { analyzeResponse } from '../agents/analyzer.ts';

const PILOT_RUN_ID = `pilot-${new Date().toISOString().slice(0, 10)}`;

const PILOT_EXTERNAL_IDS = [
  // commercial_intent — rozhodovacia fáza (buy now vs wait, A vs B)
  'sk-commercial_intent-0001',
  'sk-commercial_intent-0005',
  'sk-commercial_intent-0007',
  'sk-commercial_intent-0008',
  'sk-commercial_intent-0011',
  // comparison — brand vs brand
  'sk-comparison-0230',
  'sk-comparison-0234',
  'sk-comparison-0240',
  'sk-comparison-0242',
  'sk-comparison-0244',
  // discovery — najlepší eshop
  'sk-discovery-0001',
  'sk-discovery-0005',
  'sk-discovery-0007',
  'sk-discovery-0010',
  'sk-discovery-0014',
  // long_tail — špecifický scenár (repasované)
  'sk-long_tail-0824',
  'sk-long_tail-0827',
  'sk-long_tail-0829',
  'sk-long_tail-0834',
  'sk-long_tail-0837',
];

const promptList = await db.query.prompts.findMany({
  where: inArray(prompts.externalId, PILOT_EXTERNAL_IDS),
});

if (promptList.length !== PILOT_EXTERNAL_IDS.length) {
  const found = new Set(promptList.map((p) => p.externalId));
  const missing = PILOT_EXTERNAL_IDS.filter((id) => !found.has(id));
  console.error(`✗ Missing prompts in DB: ${missing.join(', ')}`);
  process.exit(1);
}

const clients = getAvailableClients();
if (clients.length === 0) {
  console.error('✗ No LLM providers configured. Add API keys in .env.');
  process.exit(1);
}

const totalJobs = promptList.length * clients.length;
console.log(`▸ Pilot run: ${PILOT_RUN_ID}`);
console.log(`  prompts:     ${promptList.length}`);
console.log(`  providers:   ${clients.map((c) => c.provider).join(', ')}`);
console.log(`  total calls: ${totalJobs} collection + ${totalJobs} analysis`);
console.log('');

const promptByExt = new Map(promptList.map((p) => [p.externalId, p]));
const collected: Array<{ provider: string; rawResponseId: string }> = [];
let collectionCost = 0;
let analysisCost = 0;
let succeeded = 0;
let failed = 0;
const startedAt = Date.now();

console.log('━━━ Collection ━━━');
for (const ext of PILOT_EXTERNAL_IDS) {
  const p = promptByExt.get(ext);
  if (!p) continue;
  console.log(`\n▸ ${ext}`);
  console.log(`  ${p.text}`);

  const tasks = clients.map(async (client) => {
    try {
      const r = await client.call({
        prompt: p.text,
        maxTokens: 1024,
        temperature: 0.7,
        enableSearch: true,
      });
      const [call] = await db
        .insert(llmCalls)
        .values({
          promptId: p.id,
          provider: r.provider,
          model: r.model,
          callType: 'collection',
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          cachedInputTokens: r.cachedInputTokens || null,
          searchFeeUsd: r.searchCalls > 0 ? r.costUsd : null,
          estimatedCostUsd: r.costUsd,
          latencyMs: r.latencyMs,
          status: 'success',
          metadata: { pilot_run_id: PILOT_RUN_ID },
        })
        .returning();
      if (!call) throw new Error('Failed to insert llm_call');
      const [resp] = await db
        .insert(rawResponses)
        .values({
          llmCallId: call.id,
          responseText: r.text,
          citations: r.citations.length > 0 ? r.citations : null,
        })
        .returning();
      if (!resp) throw new Error('Failed to insert raw_response');
      collectionCost += r.costUsd;
      succeeded++;
      const preview = r.text.slice(0, 90).replace(/\s+/g, ' ').trim();
      console.log(
        `  ✓ ${r.provider.padEnd(11)} ${String(r.outputTokens).padStart(4)}out ` +
          `${String(r.citations.length).padStart(2)}cit  ` +
          `$${r.costUsd.toFixed(5)}  ${String(r.latencyMs).padStart(5)}ms  ${preview}…`,
      );
      return { provider: r.provider, rawResponseId: resp.id };
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .insert(llmCalls)
        .values({
          promptId: p.id,
          provider: client.provider,
          model: client.defaultModel,
          callType: 'collection',
          status: 'error',
          errorMessage: msg,
          estimatedCostUsd: 0,
          metadata: { pilot_run_id: PILOT_RUN_ID },
        })
        .catch(() => {});
      console.log(`  ✗ ${client.provider.padEnd(11)} ERROR: ${msg.slice(0, 120)}`);
      return null;
    }
  });
  const results = await Promise.all(tasks);
  for (const r of results) if (r) collected.push(r);
}

const collectionElapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log('');
console.log(
  `━ Collection done: ${succeeded} ok / ${failed} err, ` +
    `$${collectionCost.toFixed(4)} in ${collectionElapsed}s`,
);

console.log('');
console.log('━━━ Analysis ━━━');
let analyzeOk = 0;
let analyzeFail = 0;
const allUntracked = new Set<string>();
for (const c of collected) {
  try {
    const a = await analyzeResponse(c.rawResponseId);
    analysisCost += a.analysisCostUsd;
    analyzeOk++;
    for (const b of a.untrackedBrands) allUntracked.add(b);
    console.log(
      `  ✓ ${c.provider.padEnd(11)} ${String(a.mentionsInserted).padStart(2)} mentions  ` +
        `q=${a.qualityScore.toFixed(1).padStart(4)}  ` +
        `refused=${a.refused ? 'Y' : 'N'}  lang=${a.languageDetected ?? '?'}  ` +
        `$${a.analysisCostUsd.toFixed(5)}  ${a.analysisLatencyMs}ms`,
    );
    if (a.untrackedBrands.length > 0) {
      console.log(`     untracked: ${a.untrackedBrands.join(', ')}`);
    }
  } catch (err) {
    analyzeFail++;
    console.error(`  ✗ ${c.provider.padEnd(11)} ${err instanceof Error ? err.message : err}`);
  }
}

console.log('');
console.log(`━ Analysis done: ${analyzeOk} ok / ${analyzeFail} err, $${analysisCost.toFixed(4)}`);
console.log('');
console.log(`═══ Pilot ${PILOT_RUN_ID} complete ═══`);
console.log(`   total cost:       $${(collectionCost + analysisCost).toFixed(4)}`);
console.log(`   total time:       ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
console.log(`   pairs in DB:      ${collected.length} (filter via metadata->>'pilot_run_id')`);
if (allUntracked.size > 0) {
  console.log(`   untracked brands: ${[...allUntracked].slice(0, 20).join(', ')}`);
}
console.log('');
console.log('   Render review:  pnpm --filter @mentivue/workers pilot:review');

process.exit(0);
