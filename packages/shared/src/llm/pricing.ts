// LLM pricing config (USD per million tokens + per-search fee).
// Update when providers change pricing — see docs/PRD.md §7.2 and ANALYSIS.md §1.

export type ProviderModel = `${string}:${string}`;

export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cachedInputPerMTok?: number;
  searchFeePerCall?: number;
}

export const PRICING: Record<ProviderModel, ModelPricing> = {
  'anthropic:claude-haiku-4-5': {
    inputPerMTok: 1.0,
    outputPerMTok: 5.0,
    cachedInputPerMTok: 0.1,
    searchFeePerCall: 0.005,
  },
  'anthropic:claude-sonnet-4-6': {
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cachedInputPerMTok: 0.3,
    searchFeePerCall: 0.005,
  },
  'openai:gpt-5.4-mini': {
    inputPerMTok: 0.75,
    outputPerMTok: 4.5,
    searchFeePerCall: 0,
  },
  'google:gemini-3.1-flash-lite': {
    inputPerMTok: 0.1,
    outputPerMTok: 0.4,
    searchFeePerCall: 0.014,
  },
  'perplexity:sonar': {
    inputPerMTok: 1.0,
    outputPerMTok: 1.0,
    searchFeePerCall: 0.005,
  },
};

export interface CostInputs {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  searchCalls?: number;
}

export function calculateCost(model: ProviderModel, inputs: CostInputs): number {
  const p = PRICING[model];
  if (!p) throw new Error(`Unknown model pricing: ${model}`);

  const cachedTokens = inputs.cachedInputTokens ?? 0;
  const billedInput = Math.max(inputs.inputTokens - cachedTokens, 0);

  const inputCost = (billedInput / 1_000_000) * p.inputPerMTok;
  const cachedCost = (cachedTokens / 1_000_000) * (p.cachedInputPerMTok ?? p.inputPerMTok);
  const outputCost = (inputs.outputTokens / 1_000_000) * p.outputPerMTok;
  const searchCost = (inputs.searchCalls ?? 0) * (p.searchFeePerCall ?? 0);

  return inputCost + cachedCost + outputCost + searchCost;
}
