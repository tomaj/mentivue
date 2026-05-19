import { getEnv } from '../config/env.ts';
import { traceLLMCall } from './langfuse.ts';
import { calculateCost, pricingKey } from './pricing.ts';
import type { Citation, LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';
import { isValidKey, safeDomain, withRetry } from './utils.ts';

const DEFAULT_MODEL = 'sonar';
const API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{ message: { content: string; role: string } }>;
  citations?: string[];
  search_results?: Array<{ title?: string; url: string }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    num_search_queries?: number;
  };
}

export const perplexityClient: LLMClient = {
  provider: 'perplexity',
  defaultModel: DEFAULT_MODEL,
  isAvailable: () => isValidKey(getEnv().PERPLEXITY_API_KEY),
  call: callPerplexity,
};

export async function callPerplexity(opts: LLMCallOptions): Promise<LLMCallResult> {
  return traceLLMCall('perplexity', DEFAULT_MODEL, opts, () => callPerplexityImpl(opts));
}

async function callPerplexityImpl(opts: LLMCallOptions): Promise<LLMCallResult> {
  const env = getEnv();
  if (!env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY missing — set it in .env before calling Perplexity.');
  }

  const model = DEFAULT_MODEL;
  const start = Date.now();

  const messages = opts.system
    ? [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.prompt },
      ]
    : [{ role: 'user', content: opts.prompt }];

  const response = await withRetry<PerplexityResponse>(
    async (signal) => {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: opts.maxTokens ?? 1024,
          temperature: opts.temperature ?? 0.7,
        }),
        signal,
      });
      if (!res.ok) {
        const errBody = await res.text();
        // Attach status so withRetry's default fatal-policy can decide retry vs throw.
        const err = new Error(`Perplexity ${res.status}: ${errBody}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }
      return (await res.json()) as PerplexityResponse;
    },
    {
      onRetry: (attempt, err) =>
        console.warn(`Perplexity retry ${attempt}/3:`, err instanceof Error ? err.message : err),
    },
  );

  const latencyMs = Date.now() - start;
  const text = response.choices[0]?.message?.content ?? '';

  // Sonar returns citations as an array of URLs in v1 and richer search_results in v2.
  const citations: Citation[] = (response.search_results ?? []).map((sr) => ({
    url: sr.url,
    title: sr.title,
    domain: safeDomain(sr.url),
  }));
  if (citations.length === 0 && response.citations) {
    for (const url of response.citations) {
      citations.push({ url, domain: safeDomain(url) });
    }
  }

  const inputTokens = response.usage.prompt_tokens;
  const outputTokens = response.usage.completion_tokens;
  const searchCalls = response.usage.num_search_queries ?? 1;

  const costUsd = calculateCost(pricingKey('perplexity', model), {
    inputTokens,
    outputTokens,
    cachedInputTokens: 0,
    searchCalls,
  });

  return {
    provider: 'perplexity',
    model,
    text,
    inputTokens,
    outputTokens,
    cachedInputTokens: 0,
    searchCalls,
    costUsd,
    latencyMs,
    citations,
    rawResponse: response,
  };
}
