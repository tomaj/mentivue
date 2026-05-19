// Subscription tier × report-type entitlement matrix.
// Mirrors docs/SUBSCRIPTION.md and docs/REPORTS.md tier table.

export type ReportType = 'pulse' | 'action' | 'audit' | 'industry';
export type KlientTier = 'watch' | 'pro' | 'enterprise' | null;

// `industry` is the quarterly public report — every authenticated klient may
// download it regardless of tier (it's a free lead magnet / soft conversion tool).
// Per-brand reports follow tier:
//   watch       → pulse only
//   pro         → pulse, action, audit
//   enterprise  → everything per-brand + custom (handled outside)
export function canKlientAccessReport(tier: KlientTier, type: ReportType): boolean {
  if (type === 'industry') return true;
  if (!tier) return false;
  if (tier === 'watch') return type === 'pulse';
  if (tier === 'pro') return type === 'pulse' || type === 'action' || type === 'audit';
  if (tier === 'enterprise') return true;
  return false;
}

// How often the scheduler should produce each report type per active klient.
// Industry is global (not per-klient) so it's generated separately.
export interface CadenceDef {
  type: Exclude<ReportType, 'industry'>;
  intervalDays: number; // distance between periodEnd of consecutive issues
  windowDays: number; // analysis window for the report (data covered)
}

export function cadencesForTier(tier: KlientTier): CadenceDef[] {
  if (tier === 'watch') {
    return [{ type: 'pulse', intervalDays: 7, windowDays: 30 }];
  }
  if (tier === 'pro') {
    return [
      { type: 'pulse', intervalDays: 7, windowDays: 30 },
      { type: 'action', intervalDays: 30, windowDays: 30 },
      { type: 'audit', intervalDays: 90, windowDays: 90 },
    ];
  }
  if (tier === 'enterprise') {
    return [
      { type: 'pulse', intervalDays: 7, windowDays: 30 },
      { type: 'action', intervalDays: 30, windowDays: 30 },
      { type: 'audit', intervalDays: 90, windowDays: 90 },
    ];
  }
  return [];
}

export function reportTypeLabel(type: ReportType): string {
  switch (type) {
    case 'pulse':
      return 'Pulse newsletter';
    case 'action':
      return 'Action Report';
    case 'audit':
      return 'Per-Brand Audit';
    case 'industry':
      return 'Industry Report';
  }
}
