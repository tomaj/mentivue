import { db, llmCalls, prompts, rawResponses } from '@mentivue/shared/db';
import { ALL_CLIENTS } from '@mentivue/shared/llm';
import { eq } from 'drizzle-orm';
import type { CollectionJobData } from '../queues.ts';

export interface CollectionResult {
  llmCallId: string;
  rawResponseId: string;
  provider: string;
  costUsd: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  citations: number;
}

export async function runCollection(data: CollectionJobData): Promise<CollectionResult> {
  const prompt = await db.query.prompts.findFirst({ where: eq(prompts.id, data.promptId) });
  if (!prompt) throw new Error(`Prompt ${data.promptId} not found`);

  const client = ALL_CLIENTS.find((c) => c.provider === data.provider);
  if (!client) throw new Error(`Unknown provider: ${data.provider}`);
  if (!client.isAvailable()) {
    throw new Error(`Provider ${data.provider} is not configured (missing key).`);
  }

  let result;
  try {
    result = await client.call({
      prompt: prompt.text,
      maxTokens: 1024,
      temperature: 0.7,
      enableSearch: data.enableSearch,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.insert(llmCalls).values({
      promptId: data.promptId,
      provider: data.provider,
      model: client.defaultModel,
      callType: 'collection',
      status: 'error',
      errorMessage: message,
      estimatedCostUsd: 0,
    });
    throw err;
  }

  const [call] = await db
    .insert(llmCalls)
    .values({
      promptId: data.promptId,
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

  const [response] = await db
    .insert(rawResponses)
    .values({
      llmCallId: call.id,
      responseText: result.text,
      citations: result.citations.length > 0 ? result.citations : null,
    })
    .returning();

  if (!response) throw new Error('Failed to insert raw_response');

  return {
    llmCallId: call.id,
    rawResponseId: response.id,
    provider: result.provider,
    costUsd: result.costUsd,
    latencyMs: result.latencyMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    citations: result.citations.length,
  };
}
