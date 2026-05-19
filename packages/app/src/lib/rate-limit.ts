// Fixed-window rate limiter middleware. Backed by Redis (INCR + EXPIRE).
// Keyed by route + caller identity (IP + optional email from form body).
// Fails open on Redis errors so a Redis outage doesn't lock everyone out.

import type { MiddlewareHandler } from 'hono';
import { redis } from './redis.ts';

export type RateLimitOptions = {
  // Logical bucket name; combined with the keyOf result to form the Redis key.
  bucket: string;
  // Max allowed hits per window.
  max: number;
  // Window length in seconds.
  windowSec: number;
  // Per-route identity. Defaults to client IP only.
  keyOf?: (c: Parameters<MiddlewareHandler>[0]) => Promise<string> | string;
};

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === 'GET' || c.req.method === 'HEAD') return next();
    let identity: string;
    try {
      identity = (await opts.keyOf?.(c)) ?? clientIp(c);
    } catch {
      identity = clientIp(c);
    }
    const key = `rl:${opts.bucket}:${identity}`;
    try {
      const r = redis();
      const hits = await r.incr(key);
      if (hits === 1) await r.expire(key, opts.windowSec);
      if (hits > opts.max) {
        const ttl = await r.ttl(key);
        c.header('Retry-After', String(Math.max(ttl, 1)));
        return c.text('Too many requests. Try again later.', 429);
      }
    } catch (err) {
      // Fail open: don't block users when Redis hiccups, but log it.
      console.warn('Rate-limit Redis error (failing open):', err);
    }
    return next();
  };
}

// Helper: read `email` field from a parsed form body without consuming it.
// We re-parse in the route handler — parseBody can be called more than once
// in Hono since the body is buffered.
export async function emailFromForm(c: Parameters<MiddlewareHandler>[0]): Promise<string> {
  try {
    const body = await c.req.parseBody();
    const e = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    return e || 'anon';
  } catch {
    return 'anon';
  }
}
