// Klient reports view + download route.
// Generation is automatic via scheduler (see reports/scheduler.ts).
// Klient does NOT generate manually — they just see status pills and download.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { zValidator } from '@hono/zod-validator';
import { brands, db, reports } from '@mentivue/shared/db';
import { desc, eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { C, MonoLabel, Num } from '../components/primitives.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { fmtDate } from '../lib/fmt.ts';
import { uuidParam } from '../lib/schemas.ts';
import {
  canKlientAccessReport,
  type KlientTier,
  type ReportType,
  reportTypeLabel,
} from '../reports/entitlements.ts';
import { getReportFilePath } from '../reports/generate.ts';

const r = new Hono();

function quarterLabel(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

// Klient sees rows in these states only. Pending/generating/needs_review are
// in-flight from their perspective ("Pripravujeme"). Failed = hidden.
const KLIENT_VISIBLE = new Set(['pending', 'generating', 'needs_review', 'ready', 'delivered']);

function statusPill(status: string) {
  if (status === 'ready' || status === 'delivered') {
    return (
      <span
        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.positive};border:1px solid ${C.positive};padding:3px 8px;text-transform:uppercase`}
      >
        Pripravené
      </span>
    );
  }
  if (status === 'pending' || status === 'generating' || status === 'needs_review') {
    return (
      <span
        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.signal};border:1px solid ${C.signal};padding:3px 8px;text-transform:uppercase`}
      >
        Pripravujeme
      </span>
    );
  }
  return (
    <span
      style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.inkSoft};border:1px solid ${C.bone};padding:3px 8px;text-transform:uppercase`}
    >
      {status}
    </span>
  );
}

r.get('/app/reports', async (c) => {
  const klient = c.get('klient');
  const brand = klient.brandId
    ? await db.query.brands.findFirst({ where: eq(brands.id, klient.brandId) })
    : null;
  const filterType = c.req.query('type');

  // Klient sees: their own reports + industry reports (public to all klients).
  const all = await db.query.reports.findMany({
    where: or(eq(reports.klientId, klient.id), eq(reports.type, 'industry')),
    orderBy: desc(reports.periodEnd),
  });

  // Hide rows in non-visible states (failed, etc) from klient view.
  // Admin sees everything (separate flag).
  const visible = all.filter((row) => klient.isAdmin || KLIENT_VISIBLE.has(row.status));
  const filtered = filterType ? visible.filter((row) => row.type === filterType) : visible;

  return c.html(
    <AppLayout
      klient={klient}
      active={
        filterType === 'action'
          ? 'actions'
          : filterType === 'audit'
            ? 'audits'
            : filterType === 'pulse'
              ? 'pulse'
              : 'actions'
      }
      title="Reporty"
      crumbs={['Reporty', brand?.name ?? '—', quarterLabel()]}
      brandName={brand?.name ?? '—'}
    >
      <div
        style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone};display:flex;justify-content:space-between;align-items:flex-end;gap:24px`}
      >
        <div>
          <MonoLabel size={10} tracking="0.18em">
            Reporty
          </MonoLabel>
          <h1
            style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}
          >
            {filterType ? (
              <>
                Vaše{' '}
                <em style={`font-style:italic;color:${C.signal}`}>
                  {reportTypeLabel(filterType as ReportType)}
                </em>{' '}
                reporty
              </>
            ) : (
              <>Všetky reporty</>
            )}
          </h1>
          <div style={`color:${C.inkSoft};font-size:13px;margin-top:6px`}>
            {filtered.length}{' '}
            {filtered.length === 1 ? 'položka' : filtered.length < 5 ? 'položky' : 'položiek'}
            {!klient.isAdmin && (
              <span style={`color:${C.inkSoft};margin-left:8px`}>
                · plán {klient.tier ?? '—'} · nové reporty pribúdajú automaticky podľa cadencu vášho
                predplatného
              </span>
            )}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <a
            href="/app/reports"
            style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType ? C.bone : C.ink};background:${filterType ? 'transparent' : C.ink};color:${filterType ? C.inkSoft : C.paper}`}
          >
            Všetky
          </a>
          <a
            href="/app/reports?type=audit"
            style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'audit' ? C.ink : C.bone};background:${filterType === 'audit' ? C.ink : 'transparent'};color:${filterType === 'audit' ? C.paper : C.inkSoft}`}
          >
            Audity
          </a>
          <a
            href="/app/reports?type=action"
            style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'action' ? C.ink : C.bone};background:${filterType === 'action' ? C.ink : 'transparent'};color:${filterType === 'action' ? C.paper : C.inkSoft}`}
          >
            Action
          </a>
          <a
            href="/app/reports?type=pulse"
            style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'pulse' ? C.ink : C.bone};background:${filterType === 'pulse' ? C.ink : 'transparent'};color:${filterType === 'pulse' ? C.paper : C.inkSoft}`}
          >
            Pulse
          </a>
          <a
            href="/app/reports?type=industry"
            style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'industry' ? C.ink : C.bone};background:${filterType === 'industry' ? C.ink : 'transparent'};color:${filterType === 'industry' ? C.paper : C.inkSoft}`}
          >
            Industry
          </a>
        </div>
      </div>

      <main style="padding:28px">
        {filtered.length === 0 ? (
          <div
            style={`border:1px dashed ${C.bone};background:${C.paperPure};padding:64px 24px;text-align:center;color:${C.inkSoft};font-size:14px`}
          >
            Zatiaľ žiadne reporty v tomto filtri.
            <br />
            <span style="font-size:12px">
              Prvý Pulse dostanete týždeň po onboardingu, Action Report po prvom mesiaci, Audit po
              prvom kvartáli.
            </span>
          </div>
        ) : (
          <table class="editorial">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Názov</th>
                <th>Obdobie</th>
                <th>Stav</th>
                <th class="num">Vytvorený</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const meta = row.metadata as {
                  title?: string;
                  pages?: number;
                  bytes?: number;
                } | null;
                const accessible =
                  klient.isAdmin ||
                  canKlientAccessReport(klient.tier as KlientTier, row.type as ReportType);
                const isReady = row.status === 'ready' || row.status === 'delivered';
                return (
                  <tr>
                    <td>
                      <span
                        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${C.inkSoft};padding:3px 8px;border:1px solid ${C.bone}`}
                      >
                        {reportTypeLabel(row.type as ReportType)}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={`font-family:${C.fontDisplay};font-size:15px;font-weight:500;letter-spacing:-0.012em`}
                      >
                        {meta?.title ?? '—'}
                      </strong>
                      {meta?.bytes && (
                        <span style={`color:${C.inkSoft};font-size:12px`}>
                          {' '}
                          · {Math.round(meta.bytes / 1024)} KB
                        </span>
                      )}
                    </td>
                    <td>
                      <Num size={12} color={C.ink}>
                        {fmtDate(row.periodStart)}
                      </Num>
                      <span style={`color:${C.inkSoft};font-size:11px`}> – </span>
                      <Num size={12} color={C.ink}>
                        {fmtDate(row.periodEnd)}
                      </Num>
                    </td>
                    <td>
                      {klient.isAdmin ? (
                        <span
                          style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.inkSoft};border:1px solid ${C.bone};padding:3px 8px;text-transform:uppercase`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        statusPill(row.status)
                      )}
                    </td>
                    <td class="num">
                      <Num size={12} color={C.ink}>
                        {fmtDate(row.createdAt)}
                      </Num>
                    </td>
                    <td>
                      {isReady && accessible ? (
                        <a
                          href={`/app/reports/${row.id}/download`}
                          target="_blank"
                          style={`color:${C.signal};font-size:12.5px;border-bottom:1px solid ${C.signal};padding-bottom:1px`}
                          rel="noreferrer"
                        >
                          Otvoriť →
                        </a>
                      ) : isReady && !accessible ? (
                        <a
                          href="/app/settings#billing"
                          style={`color:${C.inkSoft};font-size:12px;border-bottom:1px solid ${C.bone};padding-bottom:1px`}
                        >
                          Upgrade →
                        </a>
                      ) : (
                        <span style={`color:${C.inkSoft};font-size:12px`}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </AppLayout>,
  );
});

// ============================================================================
// GET /app/reports/:id/download — auth + tier gated
// ============================================================================
r.get('/app/reports/:id/download', zValidator('param', uuidParam), async (c) => {
  const klient = c.get('klient');
  const { id } = c.req.valid('param');
  const report = await db.query.reports.findFirst({ where: eq(reports.id, id) });
  if (!report) return c.text('Report not found', 404);

  // Owner check (industry is public among klients)
  const isOwnerOrIndustry =
    report.type === 'industry' || report.klientId === klient.id || klient.isAdmin;
  if (!isOwnerOrIndustry) return c.text('Forbidden', 403);

  // Tier check (klient must be entitled to this report type)
  if (!klient.isAdmin) {
    const allowed = canKlientAccessReport(klient.tier as KlientTier, report.type as ReportType);
    if (!allowed) return c.text('Subscription required — upgrade to access this report type.', 402);
  }

  // Status check: admin can preview needs_review; klient sees ready/delivered only
  const readableForKlient = report.status === 'ready' || report.status === 'delivered';
  const readableForAdmin = readableForKlient || report.status === 'needs_review';
  if (!klient.isAdmin && !readableForKlient)
    return c.text(`Report is ${report.status}, not ready yet.`, 409);
  if (klient.isAdmin && !readableForAdmin)
    return c.text(`Report is ${report.status} — not previewable.`, 409);

  const filePath = getReportFilePath(id);
  if (!existsSync(filePath)) return c.text('Generated file missing on disk', 410);

  const html = await readFile(filePath, 'utf-8');
  return c.html(html);
});

export default r;
