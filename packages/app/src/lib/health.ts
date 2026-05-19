// Deep health check — pings DB + Redis with a short timeout so a stuck
// dependency surfaces as `degraded` instead of hanging the probe.
//
// Used by:
//   GET /health       — full deep check (DB + Redis)
//   GET /health/live  — process-alive only (no deps; cheap for k8s liveness)

import { db } from '@mentivue/shared/db';
import { sql } from 'drizzle-orm';
import { redis } from './redis.ts';

const PROBE_TIMEOUT_MS = 1500;

async function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), PROBE_TIMEOUT_MS),
    ),
  ]);
}

async function pingDb(): Promise<{ ok: true; ms: number } | { ok: false; error: string }> {
  const start = Date.now();
  try {
    await withTimeout(db.execute(sql`select 1`), 'db');
    return { ok: true, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function pingRedis(): Promise<{ ok: true; ms: number } | { ok: false; error: string }> {
  const start = Date.now();
  try {
    const client = redis();
    if (client.status !== 'ready' && client.status !== 'connecting') {
      await client.connect();
    }
    await withTimeout(client.ping(), 'redis');
    return { ok: true, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    db: { ok: true; ms: number } | { ok: false; error: string };
    redis: { ok: true; ms: number } | { ok: false; error: string };
  };
}

export async function deepHealth(): Promise<HealthReport> {
  const [dbResult, redisResult] = await Promise.all([pingDb(), pingRedis()]);
  return {
    status: dbResult.ok && redisResult.ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks: { db: dbResult, redis: redisResult },
  };
}
