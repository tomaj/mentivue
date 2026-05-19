// Report scheduler — creates pending report rows for every active klient based
// on their subscription tier × cadence, then kicks off generation immediately.
//
// Idempotent thanks to the unique index `(klient_id, type, period_end)`:
// re-running the scheduler on the same day will not create duplicates.
//
// State machine after this runs:
//   row created status=pending → generateReport() → generating → needs_review
//                                                                    ↓
//                                                       admin approves in /admin/approvals
//                                                                    ↓
//                                                       status=ready + delivered email

import { db, klients, reports, verticals } from '@mentivue/shared/db';
import { and, eq } from 'drizzle-orm';
import { type CadenceDef, cadencesForTier, type KlientTier } from './entitlements.ts';
import { generateReport } from './generate.ts';

export interface SchedulerResult {
  startedAt: Date;
  finishedAt: Date;
  klientsProcessed: number;
  rowsCreated: number;
  rowsGenerated: number;
  rowsFailed: number;
  errors: Array<{ klientId?: string; type: string; error: string }>;
  industryGenerated: number;
}

let lastRun: SchedulerResult | null = null;
let inFlight = false;

export function getLastSchedulerRun(): SchedulerResult | null {
  return lastRun;
}

export function isSchedulerRunning(): boolean {
  return inFlight;
}

// Compute the next "current" period end for a given cadence anchored to today.
// Pulse: end of current ISO week (Sunday 23:59:59).
// Action: end of current month.
// Audit: end of current quarter.
function nextPeriodEnd(cadence: CadenceDef, now = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  if (cadence.type === 'pulse') {
    // Roll to upcoming Sunday end-of-day (ISO weekday: Mon=1..Sun=7)
    const day = end.getDay() || 7; // JS: Sun=0 → treat as 7
    end.setDate(end.getDate() + (7 - day));
    end.setHours(23, 59, 59, 999);
  } else if (cadence.type === 'action') {
    // End of current month
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    // audit → end of current quarter
    const q = Math.floor(end.getMonth() / 3);
    end.setMonth(q * 3 + 3, 0); // last day of quarter
    end.setHours(23, 59, 59, 999);
  }
  const start = new Date(end);
  start.setDate(start.getDate() - cadence.windowDays);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

async function ensureReportRow(
  klientId: string,
  brandId: string | null,
  type: CadenceDef['type'],
  start: Date,
  end: Date,
): Promise<{ created: boolean; id: string }> {
  // Idempotent insert (relies on the unique index).
  const inserted = await db
    .insert(reports)
    .values({
      type,
      klientId,
      brandId,
      periodStart: start,
      periodEnd: end,
      status: 'pending',
      metadata: { scheduled: true, autoCreated: new Date().toISOString() },
    })
    .onConflictDoNothing({ target: [reports.klientId, reports.type, reports.periodEnd] })
    .returning({ id: reports.id });

  if (inserted[0]) return { created: true, id: inserted[0].id };

  // Already existed — fetch it
  const existing = await db.query.reports.findFirst({
    where: and(eq(reports.klientId, klientId), eq(reports.type, type), eq(reports.periodEnd, end)),
  });
  if (!existing) throw new Error('upsert + lookup both failed for report row');
  return { created: false, id: existing.id };
}

// Industry report — single per vertical per quarter, no klient ownership.
async function ensureIndustryRow(
  verticalId: string,
  end: Date,
): Promise<{ created: boolean; id: string }> {
  const start = new Date(end);
  start.setDate(start.getDate() - 90);
  const existing = await db.query.reports.findFirst({
    where: and(
      eq(reports.type, 'industry'),
      eq(reports.verticalId, verticalId),
      eq(reports.periodEnd, end),
    ),
  });
  if (existing) return { created: false, id: existing.id };
  const [row] = await db
    .insert(reports)
    .values({
      type: 'industry',
      verticalId,
      periodStart: start,
      periodEnd: end,
      status: 'pending',
      metadata: { scheduled: true, autoCreated: new Date().toISOString() },
    })
    .returning({ id: reports.id });
  if (!row) throw new Error('failed to insert industry report row');
  return { created: true, id: row.id };
}

// Idempotent end-to-end run. Safe to call multiple times per day.
export async function runScheduler(): Promise<SchedulerResult> {
  if (inFlight) throw new Error('scheduler already running');
  inFlight = true;

  const result: SchedulerResult = {
    startedAt: new Date(),
    finishedAt: new Date(),
    klientsProcessed: 0,
    rowsCreated: 0,
    rowsGenerated: 0,
    rowsFailed: 0,
    errors: [],
    industryGenerated: 0,
  };

  try {
    // 1. Per-klient cadences
    const active = await db.query.klients.findMany({
      where: eq(klients.status, 'active'),
    });
    for (const k of active) {
      if (k.isAdmin && !k.brandId) continue; // skip Tomas-only admin accounts
      if (!k.brandId || !k.tier) continue;

      result.klientsProcessed++;
      const cadences = cadencesForTier(k.tier as KlientTier);
      for (const cad of cadences) {
        try {
          const { start, end } = nextPeriodEnd(cad);
          const { created, id } = await ensureReportRow(k.id, k.brandId, cad.type, start, end);
          if (created) {
            result.rowsCreated++;
            // Kick off generation immediately
            const gen = await generateReport(id);
            if (gen.ok) {
              // Move from 'ready' (set by generator) to 'needs_review' awaiting admin
              await db.update(reports).set({ status: 'needs_review' }).where(eq(reports.id, id));
              result.rowsGenerated++;
            } else {
              result.rowsFailed++;
              result.errors.push({ klientId: k.id, type: cad.type, error: gen.error });
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push({ klientId: k.id, type: cad.type, error: msg });
        }
      }
    }

    // 2. Industry report per vertical (quarterly)
    const allVerticals = await db.query.verticals.findMany({ where: eq(verticals.isActive, true) });
    const cadAudit: CadenceDef = { type: 'audit', intervalDays: 90, windowDays: 90 };
    for (const v of allVerticals) {
      try {
        const { end } = nextPeriodEnd(cadAudit);
        const { created, id } = await ensureIndustryRow(v.id, end);
        if (created) {
          result.rowsCreated++;
          const gen = await generateReport(id);
          if (gen.ok) {
            // Industry is public — go straight to ready (no per-klient approval needed)
            await db
              .update(reports)
              .set({ status: 'ready', approvedAt: new Date() })
              .where(eq(reports.id, id));
            result.industryGenerated++;
          } else {
            result.rowsFailed++;
            result.errors.push({ type: 'industry', error: gen.error });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push({ type: 'industry', error: msg });
      }
    }
  } finally {
    inFlight = false;
    result.finishedAt = new Date();
    lastRun = result;
  }

  return result;
}

// Background auto-run. Called once at app boot; re-runs every `intervalMs`.
// Conservative defaults: every 6h. Skip if last run was < `intervalMs / 2` ago
// (handles boot-after-restart so we don't slam the DB on dev reloads).
let timer: ReturnType<typeof setInterval> | null = null;
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function startSchedulerLoop(intervalMs = DEFAULT_INTERVAL_MS): void {
  if (timer) return; // already started
  const tick = async () => {
    if (lastRun && Date.now() - lastRun.startedAt.getTime() < intervalMs / 2) return;
    try {
      const r = await runScheduler();
      console.log(
        `📅 Scheduler: ${r.klientsProcessed} klientov · ${r.rowsCreated} nových riadkov · ${r.rowsGenerated} vygenerovaných · ${r.industryGenerated} industry · ${r.rowsFailed} chyb`,
      );
    } catch (err) {
      console.error('Scheduler tick failed:', err);
    }
  };
  // Run once shortly after boot (don't block server start)
  setTimeout(tick, 5_000);
  timer = setInterval(tick, intervalMs);
}

export function stopSchedulerLoop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
