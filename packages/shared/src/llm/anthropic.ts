import Anthropic from '@anthropic-ai/sdk';
import { getEnv } from '../config/env.ts';
import { traceLLMCall } from './langfuse.ts';
import { calculateCost, pricingKey } from './pricing.ts';
import type { Citation, LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';
import { isValidKey, safeDomain, withRetry } from './utils.ts';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

let cachedClient: Anthropic | null = null;

function client(): Anthropic {
  if (!cachedClient) {
    const env = getEnv();
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY missing — set it in .env before calling Claude.');
    }
    cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

export const anthropicClient: LLMClient = {
  provider: 'anthropic',
  defaultModel: DEFAULT_MODEL,
  isAvailable: () => isValidKey(getEnv().ANTHROPIC_API_KEY),
  call: callClaude,
};

export async function callClaude(opts: LLMCallOptions): Promise<LLMCallResult> {
  return traceLLMCall('anthropic', DEFAULT_MODEL, opts, () => callClaudeImpl(opts));
}

async function callClaudeImpl(opts: LLMCallOptions): Promise<LLMCallResult> {
  const model = DEFAULT_MODEL;
  const start = Date.now();

  const systemPrompt = opts.enableSearch
    ? [
        opts.system,
        'Použi web_search nástroj na zistenie aktuálnych informácií o slovenských e-shopoch a značkách. Cituj zdroje.',
      ]
        .filter(Boolean)
        .join('\n\n')
    : opts.system;

  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    messages: [{ role: 'user', content: opts.prompt }],
    ...(systemPrompt ? { system: systemPrompt } : {}),
  };

  if (opts.enableSearch) {
    params.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as never];
  }

  const response = await withRetry((signal) => client().messages.create(params, { signal }), {
    onRetry: (attempt, err) =>
      console.warn(`Anthropic retry ${attempt}/3:`, err instanceof Error ? err.message : err),
  });
  const latencyMs = Date.now() - start;

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cachedInputTokens =
    (response.usage as unknown as { cache_read_input_tokens?: number }).cache_read_input_tokens ??
    0;

  // Server-side web_search tool emits server_tool_use blocks; count them.
  const searchCalls = response.content.filter(
    (c) => (c as { type: string }).type === 'server_tool_use',
  ).length;

  // Citations come back attached to text blocks when web search is on.
  const citations: Citation[] = [];
  for (const block of response.content) {
    if (block.type !== 'text') continue;
    const blockCitations = (
      block as unknown as { citations?: Array<{ url?: string; title?: string }> }
    ).citations;
    if (!blockCitations) continue;
    for (const c of blockCitations) {
      if (c.url) {
        citations.push({
          url: c.url,
          title: c.title,
          domain: safeDomain(c.url),
        });
      }
    }
  }

  const costUsd = calculateCost(pricingKey('anthropic', model), {
    inputTokens,
    outputTokens,
    cachedInputTokens,
    searchCalls,
  });

  return {
    provider: 'anthropic',
    model,
    text,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    searchCalls,
    costUsd,
    latencyMs,
    citations,
    rawResponse: response,
  };
}
