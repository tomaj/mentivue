// Shared helpers for LLM clients: domain extraction, env-key sanity check,
// and a retry wrapper with exponential backoff + jitter for transient failures.

export function safeDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function isValidKey(value: string | undefined): boolean {
  return Boolean(value && !value.endsWith('...') && value.length > 10);
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

export type RetryOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  // Treat the error as fatal (no retry) when this returns true.
  isFatal?: (err: unknown) => boolean;
  // For logging; gets retry attempt number (1-indexed).
  onRetry?: (attempt: number, err: unknown) => void;
};

// Default fatal-error policy: 4xx client errors (except 408, 425, 429) should not retry.
function defaultIsFatal(err: unknown): boolean {
  const status = extractStatus(err);
  if (status === undefined) return false;
  if (status === 408 || status === 425 || status === 429) return false; // timeout / too-early / rate-limit → retry
  return status >= 400 && status < 500;
}

function extractStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
  const s = e.status ?? e.statusCode ?? e.response?.status;
  return typeof s === 'number' ? s : undefined;
}

/**
 * Run `fn` with timeout + exponential-backoff retry. `fn` receives an
 * AbortSignal that fires when timeoutMs elapses; SDKs that accept a signal
 * will cancel cleanly.
 *
 * Retry policy: up to `maxRetries` extra attempts after the first try.
 * Backoff: 500ms · 2^attempt ± 30% jitter. 4xx (except 408/425/429) skip retry.
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const isFatal = opts.isFatal ?? defaultIsFatal;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(
      () => ctrl.abort(new Error(`Timeout after ${timeoutMs}ms`)),
      timeoutMs,
    );
    try {
      return await fn(ctrl.signal);
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || isFatal(err)) throw err;
      const delay = BASE_BACKOFF_MS * 2 ** attempt;
      const jitter = delay * (Math.random() * 0.6 - 0.3); // ±30%
      const wait = Math.max(0, Math.round(delay + jitter));
      opts.onRetry?.(attempt + 1, err);
      await sleep(wait);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
