import type { ProviderName } from '../types/index.ts';

export interface Citation {
  url: string;
  title?: string;
  domain?: string;
}

export interface LLMCallOptions {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * Enable web search / grounding when the provider supports a toggle.
   * Perplexity Sonar always searches; this flag is a no-op for it.
   */
  enableSearch?: boolean;
}

export interface LLMCallResult {
  provider: ProviderName;
  model: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  searchCalls: number;
  costUsd: number;
  latencyMs: number;
  citations: Citation[];
  rawResponse: unknown;
}

export interface LLMClient {
  readonly provider: ProviderName;
  readonly defaultModel: string;
  /**
   * Whether the necessary env / config is present. Lets callers skip a
   * provider gracefully without throwing.
   */
  isAvailable(): boolean;
  call(opts: LLMCallOptions): Promise<LLMCallResult>;
}
