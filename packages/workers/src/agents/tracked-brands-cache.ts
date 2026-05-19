// Tracked-brands cache for the analyzer.
//
// Analyzer is invoked per raw_response — without cache, every analysis hits
// the DB to load tracked brands for the vertical. With the same query running
// hundreds of times per collection batch, that's pure waste.
//
// Two-tier cache:
//   • L1 — in-process Map, 5-minute TTL. Hot path; ~zero overhead.
//   • L2 — Redis, 5-minute TTL. Shared across worker replicas.
// Invalidate on brand mutations (writing path in admin) via `invalidateTrackedBrandsCache(verticalId)`.

import { brands, db } from '@mentivue/shared/db';
import { and, eq } from 'drizzle-orm';
import { connection } from '../queues.ts';

export interface TrackedBrand {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
}

const L1_TTL_MS = 5 * 60 * 1000;
const L2_TTL_SEC = 5 * 60;

type L1Entry = { value: TrackedBrand[]; expiresAt: number };
const l1 = new Map<string, L1Entry>();

function redisKey(verticalId: string): string {
  return `tracked-brands:${verticalId}`;
}

export async function getTrackedBrands(verticalId: string): Promise<TrackedBrand[]> {
  // L1 hit?
  const now = Date.now();
  const hot = l1.get(verticalId);
  if (hot && hot.expiresAt > now) return hot.value;

  // L2 hit?
  try {
    const cached = await connection.get(redisKey(verticalId));
    if (cached) {
      const value = JSON.parse(cached) as TrackedBrand[];
      l1.set(verticalId, { value, expiresAt: now + L1_TTL_MS });
      return value;
    }
  } catch {
    // Redis down — fall through to DB
  }

  // DB
  const rows = await db.query.brands.findMany({
    where: and(eq(brands.verticalId, verticalId), eq(brands.isActive, true)),
    columns: { id: true, slug: true, name: true, aliases: true },
  });
  const value: TrackedBrand[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    aliases: r.aliases ?? [],
  }));

  l1.set(verticalId, { value, expiresAt: now + L1_TTL_MS });
  // Best-effort write to L2; ignore failures.
  connection.set(redisKey(verticalId), JSON.stringify(value), 'EX', L2_TTL_SEC).catch(() => {});
  return value;
}

export async function invalidateTrackedBrandsCache(verticalId?: string): Promise<void> {
  if (verticalId) {
    l1.delete(verticalId);
    try {
      await connection.del(redisKey(verticalId));
    } catch {
      // ignore
    }
    return;
  }
  // Full wipe — used after bulk seed
  l1.clear();
  try {
    const keys = await connection.keys('tracked-brands:*');
    if (keys.length > 0) await connection.del(...keys);
  } catch {
    // ignore
  }
}

// Diagnostics for /admin/health later
export function trackedBrandsCacheStats(): { l1Entries: number } {
  return { l1Entries: l1.size };
}
