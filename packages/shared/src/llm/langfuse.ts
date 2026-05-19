// Optional Langfuse instrumentation for LLM calls.
//
// Activates only when LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY are set.
// Otherwise traceLLMCall just runs the inner fn — zero overhead, zero deps invoked.
// Captures input, output, model, latency, tokens, cost per call.
//
// We use dynamic import so workers/app that never set Langfuse keys don't pay
// the cold-start cost of loading the SDK.

import { getEnv } from '../config/env.ts';
import type { LLMCallOptions, LLMCallResult } from './types.ts';

interface LangfuseClient {
  trace(args: { name: string; metadata?: Record<string, unknown> }): {
    generation(args: {
      name: string;
      model: string;
      input: unknown;
      output?: unknown;
      metadata?: Record<string, unknown>;
      usage?: { input?: number; output?: number; total?: number; unit?: string };
      level?: 'DEFAULT' | 'WARNING' | 'ERROR';
      statusMessage?: string;
      startTime?: Date;
      endTime?: Date;
    }): void;
    update(args: { output?: unknown; metadata?: Record<string, unknown> }): void;
  };
  shutdownAsync(): Promise<void>;
}

let langfuseInstance: LangfuseClient | null = null;
let initAttempted = false;

async function getClient(): Promise<LangfuseClient | null> {
  if (langfuseInstance) return langfuseInstance;
  if (initAttempted) return null;
  initAttempted = true;

  const env = getEnv();
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null;

  try {
    const mod = await import('langfuse');
    // SDK constructor signature changes between minor versions; use loose typing.
    const LangfuseCtor = (
      mod as { Langfuse: new (opts: Record<string, unknown>) => LangfuseClient }
    ).Langfuse;
    langfuseInstance = new LangfuseCtor({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
    });
    return langfuseInstance;
  } catch (err) {
    console.warn(
      'Langfuse SDK not installed or failed to load — tracing disabled:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Wrap an LLM call with a Langfuse trace + generation. No-op when Langfuse
 * isn't configured. Errors in the trace itself never propagate.
 *
 * Usage in a provider client:
 *   return traceLLMCall('anthropic', model, opts, () => doActualCall(...))
 */
export async function traceLLMCall(
  provider: string,
  model: string,
  opts: LLMCallOptions,
  fn: () => Promise<LLMCallResult>,
): Promise<LLMCallResult> {
  const client = await getClient();
  if (!client) return fn();

  const startTime = new Date();
  let result: LLMCallResult | undefined;
  let error: Error | undefined;
  try {
    result = await fn();
    return result;
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
    throw err;
  } finally {
    try {
      const trace = client.trace({
        name: `llm.${provider}`,
        metadata: { provider, model, search: opts.enableSearch ?? false },
      });
      trace.generation({
        name: `${provider}.call`,
        model,
        input: { prompt: opts.prompt, system: opts.system, search: opts.enableSearch },
        output: result?.text,
        startTime,
        endTime: new Date(),
        usage: result
          ? {
              input: result.inputTokens,
              output: result.outputTokens,
              total: result.inputTokens + result.outputTokens,
              unit: 'TOKENS',
            }
          : undefined,
        metadata: result
          ? {
              latencyMs: result.latencyMs,
              costUsd: result.costUsd,
              cachedInputTokens: result.cachedInputTokens,
              searchCalls: result.searchCalls,
              citations: result.citations?.length ?? 0,
            }
          : undefined,
        level: error ? 'ERROR' : 'DEFAULT',
        statusMessage: error?.message,
      });
    } catch {
      // Tracing must never break the actual LLM call
    }
  }
}

// Best-effort flush on process exit. Workers handle this in their shutdown
// hook; for one-shot scripts (test:collect, smoke:all) it's nice to have.
export async function shutdownLangfuse(): Promise<void> {
  if (!langfuseInstance) return;
  try {
    await langfuseInstance.shutdownAsync();
  } catch {
    // ignore
  }
}
