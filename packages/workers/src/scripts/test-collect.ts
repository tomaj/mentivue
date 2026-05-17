// Manual end-to-end test across all available LLM providers:
//   1. Pick 1 active daily prompt from DB
//   2. For each provider with a configured API key, call it (web search ON)
//   3. Persist llm_calls + raw_responses (with citations)
//   4. Print summary table
//
// Usage:
//   pnpm --filter @mentivue/workers test:collect

import { and, eq } from 'drizzle-orm';
import { db, llmCalls, prompts, rawResponses } from '@mentivue/shared/db';
import { getAvailableClients, type LLMClient, type LLMCallResult } from '@mentivue/shared/llm';

const prompt = await db.query.prompts.findFirst({
  where: and(eq(prompts.isActive, true), eq(prompts.frequencyTier, 'daily')),
});

if (!prompt) {
  console.error('✗ No active daily prompts in DB. Run `pnpm db:seed` first.');
  process.exit(1);
}

const clients = getAvailableClients();
if (clients.length === 0) {
  console.error('✗ No LLM providers configured. Add at least one API key in .env.');
  process.exit(1);
}

console.log('▸ Prompt:', prompt.text);
console.log('  external_id:', prompt.externalId);
console.log('  providers:', clients.map((c) => c.provider).join(', '));
console.log('');

interface Row {
  provider: string;
  model: string;
  status: 'success' | 'error';
  tokensIn: number;
  tokensOut: number;
  citations: number;
  costUsd: number;
  latencyMs: number;
  preview?: string;
  error?: string;
}

const results: Row[] = await Promise.all(clients.map((c) => runOne(c, prompt.id, prompt.text)));

console.log('');
console.log('─── Results ───');
for (const r of results) {
  const cost = r.costUsd ? `$${r.costUsd.toFixed(6)}` : '—';
  const status = r.status === 'success' ? '✓' : '✗';
  console.log(
    `${status} ${r.provider.padEnd(11)} ${r.model.padEnd(28)} ` +
      `${String(r.tokensIn).padStart(5)} in / ${String(r.tokensOut).padStart(5)} out  ` +
      `${String(r.citations).padStart(2)} cites  ` +
      `${cost.padStart(11)}  ${String(r.latencyMs).padStart(6)} ms`,
  );
  if (r.error) console.log(`     error: ${r.error}`);
  if (r.preview) console.log(`     preview: ${r.preview}`);
}

console.log('');
const succeeded = results.filter((r) => r.status === 'success');
const totalCost = succeeded.reduce((sum, r) => sum + r.costUsd, 0);
console.log(
  `Total: ${succeeded.length}/${results.length} succeeded, $${totalCost.toFixed(6)} spent.`,
);

process.exit(0);

async function runOne(client: LLMClient, promptId: string, promptText: string): Promise<Row> {
  try {
    const result: LLMCallResult = await client.call({
      prompt: promptText,
      maxTokens: 1024,
      temperature: 0.7,
      enableSearch: true,
    });

    const [call] = await db
      .insert(llmCalls)
      .values({
        promptId,
        provider: result.provider,
        model: result.model,
        callType: 'collection',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cachedInputTokens: result.cachedInputTokens || null,
        searchFeeUsd: result.searchCalls > 0 ? result.costUsd : null,
        estimatedCostUsd: result.costUsd,
        latencyMs: result.latencyMs,
        status: 'success',
      })
      .returning();

    if (!call) throw new Error('Failed to insert llm_call');

    await db.insert(rawResponses).values({
      llmCallId: call.id,
      responseText: result.text,
      citations: result.citations.length > 0 ? result.citations : null,
    });

    return {
      provider: result.provider,
      model: result.model,
      status: 'success',
      tokensIn: result.inputTokens,
      tokensOut: result.outputTokens,
      citations: result.citations.length,
      costUsd: result.costUsd,
      latencyMs: result.latencyMs,
      preview: result.text.slice(0, 100).replace(/\s+/g, ' ').trim() + '…',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .insert(llmCalls)
      .values({
        promptId,
        provider: client.provider,
        model: client.defaultModel,
        callType: 'collection',
        status: 'error',
        errorMessage: message,
        estimatedCostUsd: 0,
      })
      .catch(() => {});

    return {
      provider: client.provider,
      model: client.defaultModel,
      status: 'error',
      tokensIn: 0,
      tokensOut: 0,
      citations: 0,
      costUsd: 0,
      latencyMs: 0,
      error: message.slice(0, 200),
    };
  }
}
