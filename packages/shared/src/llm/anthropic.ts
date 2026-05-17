import Anthropic from '@anthropic-ai/sdk';
import { getEnv } from '../config/env.ts';
import { calculateCost, type ProviderModel } from './pricing.ts';

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

export interface ClaudeCallOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  costUsd: number;
  latencyMs: number;
  model: string;
  rawResponse: unknown;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<ClaudeCallResult> {
  const model = opts.model ?? 'claude-haiku-4-5-20251001';
  const start = Date.now();

  const response = await client().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: 'user', content: opts.prompt }],
  });

  const latencyMs = Date.now() - start;

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');

  // Map full model string -> pricing key (strip date suffix).
  // claude-haiku-4-5-20251001 → anthropic:claude-haiku-4-5
  const pricingKey = `anthropic:${model.replace(/-\d{8}$/, '')}` as ProviderModel;

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cachedInputTokens =
    (response.usage as unknown as { cache_read_input_tokens?: number }).cache_read_input_tokens ??
    0;

  const costUsd = calculateCost(pricingKey, {
    inputTokens,
    outputTokens,
    cachedInputTokens,
  });

  return {
    text,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    costUsd,
    latencyMs,
    model,
    rawResponse: response,
  };
}
