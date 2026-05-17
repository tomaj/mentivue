// Manual end-to-end test:
//   1. Pick 1 active daily prompt from DB
//   2. Call Claude Haiku
//   3. Persist llm_calls + raw_responses rows
//   4. Print summary
//
// Usage:
//   cd packages/workers && bun run src/scripts/test-collect.ts
//   # or from repo root:
//   bun run packages/workers/src/scripts/test-collect.ts

import { and, eq } from 'drizzle-orm';
import { db, prompts, llmCalls, rawResponses } from '@mentivue/shared/db';
import { callClaude } from '@mentivue/shared/llm';

const prompt = await db.query.prompts.findFirst({
  where: and(eq(prompts.isActive, true), eq(prompts.frequencyTier, 'daily')),
});

if (!prompt) {
  console.error('✗ No active daily prompts in DB. Run `pnpm db:seed` first.');
  process.exit(1);
}

console.log('▸ Prompt:', prompt.text);
console.log('  external_id:', prompt.externalId);
console.log('');
console.log('▸ Calling Claude Haiku…');

let claudeResult;
try {
  claudeResult = await callClaude({
    prompt: prompt.text,
    maxTokens: 1024,
    temperature: 0.7,
  });
} catch (err) {
  console.error('✗ Claude call failed:', err);
  await db
    .insert(llmCalls)
    .values({
      promptId: prompt.id,
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      callType: 'collection',
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  process.exit(1);
}

console.log(`✓ Response received in ${claudeResult.latencyMs} ms`);
console.log(`  tokens: ${claudeResult.inputTokens} in / ${claudeResult.outputTokens} out`);
console.log(`  cost:   $${claudeResult.costUsd.toFixed(6)}`);
console.log('');
console.log('─── Response preview ───');
console.log(claudeResult.text.slice(0, 500) + (claudeResult.text.length > 500 ? '…' : ''));
console.log('────────────────────────');
console.log('');

const [call] = await db
  .insert(llmCalls)
  .values({
    promptId: prompt.id,
    provider: 'anthropic',
    model: claudeResult.model,
    callType: 'collection',
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    cachedInputTokens: claudeResult.cachedInputTokens || null,
    estimatedCostUsd: claudeResult.costUsd,
    latencyMs: claudeResult.latencyMs,
    status: 'success',
  })
  .returning();

if (!call) throw new Error('Failed to insert llm_call');

const [response] = await db
  .insert(rawResponses)
  .values({
    llmCallId: call.id,
    responseText: claudeResult.text,
  })
  .returning();

console.log(`✓ Persisted llm_call ${call.id}`);
console.log(`✓ Persisted raw_response ${response?.id}`);
console.log('');
console.log('Done. Inspect with:');
console.log('  psql postgresql://mentivue:dev@localhost:5432/mentivue');
console.log('  SELECT id, provider, model, input_tokens, output_tokens, estimated_cost_usd, latency_ms');
console.log('    FROM llm_calls ORDER BY created_at DESC LIMIT 5;');

process.exit(0);
