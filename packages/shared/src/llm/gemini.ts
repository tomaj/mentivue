import { GoogleGenAI } from '@google/genai';
import { getEnv } from '../config/env.ts';
import { traceLLMCall } from './langfuse.ts';
import { calculateCost, pricingKey } from './pricing.ts';
import type { Citation, LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';
import { isValidKey, safeDomain, withRetry } from './utils.ts';

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
  return traceLLMCall('gemini', DEFAULT_MODEL, opts, () => callGeminiImpl(opts));
}

async function callGeminiImpl(opts: LLMCallOptions): Promise<LLMCallResult> {
  const model = DEFAULT_MODEL;
  const start = Date.now();

  const config: Record<string, unknown> = {
    maxOutputTokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.system) config.systemInstruction = opts.system;
  if (opts.enableSearch) config.tools = [{ googleSearch: {} }];

  // Gemini SDK does not surface AbortSignal in its public types yet — the
  // withRetry timer still aborts via Promise.race below by racing the call
  // against a timeout-rejected promise.
  const response = await withRetry(
    (signal) =>
      Promise.race([
        client().models.generateContent({ model, contents: opts.prompt, config }),
        new Promise<never>((_, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new Error('Gemini call aborted (timeout)')),
            {
              once: true,
            },
          );
        }),
      ]),
    {
      onRetry: (attempt, err) =>
        console.warn(`Gemini retry ${attempt}/3:`, err instanceof Error ? err.message : err),
    },
  );
  const latencyMs = Date.now() - start;

  const text = response.text ?? '';

  const candidate = response.candidates?.[0];
  const grounding = candidate?.groundingMetadata as
    | {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        webSearchQueries?: string[];
      }
    | undefined;

  const rawChunks = grounding?.groundingChunks ?? [];
  const citations: Citation[] = await Promise.all(
    rawChunks
      .filter((c): c is { web: { uri: string; title?: string } } => Boolean(c.web?.uri))
      .map(async (c) => {
        const unwrapped = await unwrapGroundingUrl(c.web.uri);
        return {
          url: unwrapped,
          title: c.web.title,
          domain: safeDomain(unwrapped),
        };
      }),
  );

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

const GROUNDING_HOST = 'vertexaisearch.cloud.google.com';

/**
 * Gemini Grounding returns citation URLs as opaque redirects through
 * vertexaisearch.cloud.google.com. The real destination is only available
 * after following the redirect — we issue a HEAD with redirect:'manual'
 * and read the Location header. Falls back to the original URL on any
 * failure (5s timeout, network error, missing header).
 */
async function unwrapGroundingUrl(url: string): Promise<string> {
  if (!url.includes(GROUNDING_HOST)) return url;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const location = res.headers.get('location');
    if (location) return location;
  } catch {
    // fall through
  }
  return url;
}
