import OpenAI from 'openai';
import { getEnv } from '../config/env.ts';
import { traceLLMCall } from './langfuse.ts';
import { calculateCost, pricingKey } from './pricing.ts';
import type { Citation, LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';
import { isValidKey, safeDomain, withRetry } from './utils.ts';

const DEFAULT_MODEL = 'gpt-5-mini';

let cachedClient: OpenAI | null = null;

function client(): OpenAI {
  if (!cachedClient) {
    const env = getEnv();
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY missing — set it in .env before calling OpenAI.');
    }
    cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return cachedClient;
}

export const openaiClient: LLMClient = {
  provider: 'openai',
  defaultModel: DEFAULT_MODEL,
  isAvailable: () => isValidKey(getEnv().OPENAI_API_KEY),
  call: callOpenAI,
};

export async function callOpenAI(opts: LLMCallOptions): Promise<LLMCallResult> {
  return traceLLMCall('openai', DEFAULT_MODEL, opts, () => callOpenAIImpl(opts));
}

async function callOpenAIImpl(opts: LLMCallOptions): Promise<LLMCallResult> {
  const model = DEFAULT_MODEL;
  const start = Date.now();

  // Responses API. gpt-5-mini is a reasoning model — keep reasoning minimal so
  // the bulk of output_tokens goes to the actual message, not internal thought.
  const params: Record<string, unknown> = {
    model,
    input: opts.system
      ? [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ]
      : opts.prompt,
    max_output_tokens: opts.maxTokens ?? 2048,
    // 'minimal' is faster/cheaper but is incompatible with web_search.
    reasoning: { effort: opts.enableSearch ? 'low' : 'minimal' },
  };
  if (opts.enableSearch) {
    params.tools = [{ type: 'web_search' }];
  }

  const response = await withRetry(
    (signal) =>
      // biome-ignore lint/suspicious/noExplicitAny: Responses API typing varies by SDK version
      (client() as any).responses.create(params, { signal }) as Promise<{
        output_text?: string;
        output?: Array<{
          type: string;
          content?: Array<{
            type: string;
            text?: string;
            annotations?: Array<{ type: string; url?: string; title?: string }>;
          }>;
        }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          input_tokens_details?: { cached_tokens?: number };
        };
      }>,
    {
      onRetry: (attempt, err) =>
        console.warn(`OpenAI retry ${attempt}/3:`, err instanceof Error ? err.message : err),
    },
  );

  const latencyMs = Date.now() - start;

  // Always scan output[] for the message — output_text helper is sometimes
  // empty on reasoning models even when a message block exists.
  let text = '';
  const citations: Citation[] = [];
  if (response.output) {
    for (const item of response.output) {
      if (item.type !== 'message') continue;
      for (const c of item.content ?? []) {
        if (c.type === 'output_text' && c.text) text += c.text;
        for (const ann of c.annotations ?? []) {
          if (ann.type === 'url_citation' && ann.url) {
            citations.push({
              url: ann.url,
              title: ann.title,
              domain: safeDomain(ann.url),
            });
          }
        }
      }
    }
  }
  if (!text && response.output_text) text = response.output_text;

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const cachedInputTokens = response.usage?.input_tokens_details?.cached_tokens ?? 0;
  const searchCalls = opts.enableSearch ? 1 : 0;

  const costUsd = calculateCost(pricingKey('openai', model), {
    inputTokens,
    outputTokens,
    cachedInputTokens,
    searchCalls,
  });

  return {
    provider: 'openai',
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
