import { anthropicClient } from './anthropic.ts';
import { geminiClient } from './gemini.ts';
import { openaiClient } from './openai.ts';
import { perplexityClient } from './perplexity.ts';
import type { LLMClient } from './types.ts';

export type {
  Citation,
  LLMCallOptions,
  LLMCallResult,
  LLMClient,
} from './types.ts';

export { callClaude, anthropicClient } from './anthropic.ts';
export { callOpenAI, openaiClient } from './openai.ts';
export { callPerplexity, perplexityClient } from './perplexity.ts';
export { callGemini, geminiClient } from './gemini.ts';
export {
  calculateCost,
  PRICING,
  pricingKey,
  type ModelPricing,
  type ProviderModel,
} from './pricing.ts';

export const ALL_CLIENTS: LLMClient[] = [
  anthropicClient,
  openaiClient,
  perplexityClient,
  geminiClient,
];

/** Returns only the clients whose API key + dependencies are wired up. */
export function getAvailableClients(): LLMClient[] {
  return ALL_CLIENTS.filter((c) => {
    try {
      return c.isAvailable();
    } catch {
      return false;
    }
  });
}

/** Crude heuristic for unfilled .env.example placeholders. */
export function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.endsWith('...') || value === '' || value.length < 10;
}
