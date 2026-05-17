import { GoogleGenAI } from '@google/genai';
import { getEnv } from '../config/env.ts';
import { calculateCost, pricingKey } from './pricing.ts';
import type { Citation, LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';

const DEFAULT_MODEL = 'gemini-2.5-flash';

let cachedClient: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (!cachedClient) {
    const env = getEnv();
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY missing — set it in .env before calling Gemini.');
    }
    cachedClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return cachedClient;
}

export const geminiClient: LLMClient = {
  provider: 'gemini',
  defaultModel: DEFAULT_MODEL,
  isAvailable: () => isValidKey(getEnv().GEMINI_API_KEY),
  call: callGemini,
};

export async function callGemini(opts: LLMCallOptions): Promise<LLMCallResult> {
  const model = DEFAULT_MODEL;
  const start = Date.now();

  const config: Record<string, unknown> = {
    maxOutputTokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.system) config.systemInstruction = opts.system;
  if (opts.enableSearch) config.tools = [{ googleSearch: {} }];

  const response = await client().models.generateContent({
    model,
    contents: opts.prompt,
    config,
  });
  const latencyMs = Date.now() - start;

  const text = response.text ?? '';

  const candidate = response.candidates?.[0];
  const grounding = candidate?.groundingMetadata as
    | {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        webSearchQueries?: string[];
      }
    | undefined;

  const citations: Citation[] = [];
  for (const chunk of grounding?.groundingChunks ?? []) {
    const url = chunk.web?.uri;
    if (!url) continue;
    citations.push({
      url,
      title: chunk.web?.title,
      domain: safeDomain(url),
    });
  }

  const usage = response.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  const cachedInputTokens = usage?.cachedContentTokenCount ?? 0;
  const searchCalls = grounding?.webSearchQueries?.length ?? (opts.enableSearch ? 1 : 0);

  const costUsd = calculateCost(pricingKey('google', model), {
    inputTokens,
    outputTokens,
    cachedInputTokens,
    searchCalls,
  });

  return {
    provider: 'gemini',
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

function safeDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function isValidKey(value: string | undefined): boolean {
  return Boolean(value && !value.endsWith('...') && value.length > 10);
}
