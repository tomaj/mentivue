import { getEnv } from '../config/env.ts';
import type { LLMCallOptions, LLMCallResult, LLMClient } from './types.ts';

// Stub: Gemini is weekly-only per PRD §3.3 and not yet wired up.
// Will use @google/generative-ai SDK with Grounding tool when implemented.

export const geminiClient: LLMClient = {
  provider: 'gemini',
  defaultModel: 'gemini-2.5-flash',
  isAvailable: () => {
    const key = getEnv().GEMINI_API_KEY;
    return Boolean(key && !key.endsWith('...') && key.length > 10);
  },
  call: callGemini,
};

export async function callGemini(_opts: LLMCallOptions): Promise<LLMCallResult> {
  throw new Error('Gemini client not yet implemented — see packages/shared/src/llm/gemini.ts');
}
