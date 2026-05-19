// Admin approval queue + scheduler control panel.
// Routes:
//   GET  /admin/approvals       — list reports with status=needs_review
//   POST /admin/approvals/:id/approve  — set status=ready + send delivery email
//   POST /admin/approvals/:id/reject   — set status=failed, store notes
//   GET  /admin/scheduler       — last run summary + counts
//   POST /admin/scheduler/run   — trigger runScheduler() now

import { zValidator } from '@hono/zod-validator';
import { env } from '@mentivue/shared/config';
import { brands, db, klients, reports } from '@mentivue/shared/db';
import { desc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { C, MonoLabel, Num } from '../components/primitives.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { reportReadyEmail, sendEmail } from '../lib/email.ts';
import { fmtDate, fmtDateTime } from '../lib/fmt.ts';
import { uuidParam } from '../lib/schemas.ts';
import { reportTypeLabel } from '../reports/entitlements.ts';
import { getLastSchedulerRun, isSchedulerRunning, runScheduler } from '../reports/scheduler.ts';

const ap = new Hono();

function quarterLabel(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

function periodLabel(start: Date, end: Date): string {
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days <= 35)
    return new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(end);
  if (days <= 100) return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

// ============================================================================
// GET /admin/approvals
// ============================================================================
ap.get('/admin/approvals', async (c) => {
  const klient = c.get('klient');
  const pending = await db.query.reports.findMany({
    where: eq(reports.status, 'needs_review'),
    orderBy: desc(reports.createdAt),
  });

  // Fetch klient + brand for each
  const klientIds = [...new Set(pending.map((p) => p.klientId).filter((x): x is string => !!x))];
  const brandIds = [...new Set(pending.map((p) => p.brandId).filter((x): x is string => !!x))];
  const ks = klientIds.length
    ? await db.query.klients.findMany({ where: inArray(klients.id, klientIds) })
    : [];
  const bs = brandIds.length
    ? await db.query.brands.findMany({ where: inArray(brands.id, brandIds) })
    : [];
  const klientMap = new Map(ks.map((k) => [k.id, k]));
  const brandMap = new Map(bs.map((b) => [b.id, b]));

  const approved = c.req.query('approved');
  const rejected = c.req.query('rejected');

  return c.html(
    <AppLayout
      klient={klient}
      active="admin_klients"
      title="Admin · Approvals"
      crumbs={['Admin', 'Approvals', quarterLabel()]}
      brandName="Mentivue"
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone}`}>
        <MonoLabel size={10} tracking="0.18em">
          Admin · Approval queue
        </MonoLabel>
        <h1
          style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}
        >
          {pending.length === 0 ? (
            <>
              Žiadne čakajúce <em style={`font-style:italic;color:${C.signal}`}>schvaľovania.</em>
            </>
          ) : (
            <>
              Čaká na schválenie{' '}
              <em style={`font-style:italic;color:${C.signal}`}>· {pending.length}</em>
            </>
          )}
        </h1>
        <div style={`color:${C.inkSoft};font-size:13px;margin-top:6px`}>
          Schválené reporty sa odošlú klientovi e-mailom a stanú sa stiahnuteľné v jeho
          /app/reports.
        </div>
      </div>

      <main style="padding:28px;display:flex;flex-direction:column;gap:14px">
        {approved && <div class="alert ok">Schválené a odoslané klientovi: {approved}</div>}
        {rejected && <div class="alert ok">Zamietnuté: {rejected}</div>}

        {pending.length === 0 ? (
          <div
            style={`border:1px dashed ${C.bone};background:${C.paperPure};padding:48px 24px;text-align:center;color:${C.inkSoft};font-size:14px`}
          >
            Queue je prázdna. Spustite Scheduler ak chcete vygenerovať nové reporty.
            <div style="margin-top:14px">
              <a
                href="/admin/scheduler"
                style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.signal};border-bottom:1px solid ${C.signal};padding-bottom:1px`}
              >
                Scheduler →
              </a>
            </div>
          </div>
        ) : (
          pending.map((r) => {
            const k = r.klientId ? klientMap.get(r.klientId) : null;
            const b = r.brandId ? brandMap.get(r.brandId) : null;
            const meta = r.metadata as { title?: string; bytes?: number } | null;
            return (
              <div
                style={`border:1px solid ${C.bone};border-left:3px solid ${C.signal};background:${C.paperPure};padding:20px 22px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:20px;align-items:center`}
              >
                <div>
                  <span
                    style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${C.signal};border:1px solid ${C.signal};padding:2px 8px`}
                  >
                    {reportTypeLabel(r.type as 'pulse' | 'action' | 'audit' | 'industry')}
                  </span>
                  <h3
                    style={`font-family:${C.fontDisplay};font-size:18px;font-weight:500;letter-spacing:-0.014em;margin:8px 0 4px`}
                  >
                    {meta?.title ??
                      `${reportTypeLabel(r.type as 'pulse' | 'action' | 'audit' | 'industry')} · ${periodLabel(r.periodStart, r.periodEnd)}`}
                  </h3>
                  <div style={`color:${C.inkSoft};font-size:13px`}>
                    Obdobie {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                    {meta?.bytes && (
                      <>
                        {' '}
                        ·{' '}
                        <Num size={11} color={C.inkSoft}>
                          {Math.round(meta.bytes / 1024)} KB
                        </Num>
                      </>
                    )}
                  </div>
                </div>
                <div style={`font-size:13.5px;color:${C.ink}`}>
                  <div>
                    <strong>{k?.name ?? k?.email ?? '— admin —'}</strong>
                  </div>
                  {b && (
                    <div style={`color:${C.inkSoft};font-size:12px;margin-top:2px`}>
                      Značka: {b.name}
                    </div>
                  )}
                  <Num size={10} color={C.inkSoft}>
                    vytvorené · {fmtDateTime(r.createdAt)}
                  </Num>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;min-width:200px">
                  <a
                    href={`/app/reports/${r.id}/download`}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={`background:transparent;color:${C.ink};border:1px solid ${C.bone};padding:8px 14px;font-size:12.5px;text-align:center;text-decoration:none`}
                  >
                    👁 Preview
                  </a>
                  <form method="post" action={`/admin/approvals/${r.id}/approve`} style="margin:0">
                    <button
                      type="submit"
                      style={`width:100%;background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:8px 14px;font-size:12.5px;font-weight:500`}
                    >
                      ✓ Schváliť a odoslať
                    </button>
                  </form>
                  <form method="post" action={`/admin/approvals/${r.id}/reject`} style="margin:0">
                    <button
                      type="submit"
                      style={`width:100%;background:transparent;color:${C.inkSoft};border:1px solid ${C.bone};padding:8px 14px;font-size:11.5px`}
                    >
                      ✕ Zamietnuť
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </main>
    </AppLayout>,
  );
});

// ============================================================================
// POST /admin/approvals/:id/approve
// ============================================================================
ap.post('/admin/approvals/:id/approve', zValidator('param', uuidParam), async (c) => {
  const { id } = c.req.valid('param');
  const admin = c.get('klient');
  const report = await db.query.reports.findFirst({ where: eq(reports.id, id) });
  if (!report) return c.redirect('/admin/approvals?error=not_found');
  if (report.status !== 'needs_review')
    return c.redirect(`/admin/approvals?error=wrong_status:${report.status}`);

  await db
    .update(reports)
    .set({ status: 'ready', approvedAt: new Date(), approvedBy: admin.id })
    .where(eq(reports.id, id));

  // Send delivery email to klient (skip for industry — public, no per-klient delivery)
  if (report.type !== 'industry' && report.klientId) {
    const k = await db.query.klients.findFirst({ where: eq(klients.id, report.klientId) });
    const b = report.brandId
      ? await db.query.brands.findFirst({ where: eq(brands.id, report.brandId) })
      : null;
    if (k) {
      const tmpl = reportReadyEmail({
        recipientName: k.name,
        recipientEmail: k.email,
        brandName: b?.name ?? null,
        reportType: report.type,
        periodLabel: periodLabel(report.periodStart, report.periodEnd),
        downloadUrl: `${env.APP_URL}/app/reports/${id}/download`,
      });
      const res = await sendEmail({ to: k.email, ...tmpl });
      if (res.ok) {
        await db
          .update(reports)
          .set({ deliveredAt: new Date(), status: 'delivered' })
          .where(eq(reports.id, id));
      } else {
        console.error('Report delivery email failed:', res.error);
      }
    }
  }

  return c.redirect(`/admin/approvals?approved=${id}`);
});

// ============================================================================
// POST /admin/approvals/:id/reject
// ============================================================================
ap.post('/admin/approvals/:id/reject', zValidator('param', uuidParam), async (c) => {
  const { id } = c.req.valid('param');
  const body = await c.req.parseBody();
  const notes =
    String(body.notes ?? '')
      .trim()
      .slice(0, 500) || 'Zamietnuté adminom';
  await db
    .update(reports)
    .set({ status: 'failed', rejectionNotes: notes })
    .where(eq(reports.id, id));
  return c.redirect(`/admin/approvals?rejected=${id}`);
});

// ============================================================================
// GET /admin/scheduler
// ============================================================================
ap.get('/admin/scheduler', async (c) => {
  const klient = c.get('klient');
  const last = getLastSchedulerRun();
  const running = isSchedulerRunning();
  const counts = await db.execute(
    // status counts by type
    // drizzle's sql template imported via export
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (await import('drizzle-orm')).sql`
      SELECT status, COUNT(*)::int AS n
      FROM reports
      GROUP BY status
      ORDER BY status
    `,
  );
  const statusCounts = counts as unknown as Array<{ status: string; n: number }>;

  return c.html(
    <AppLayout
      klient={klient}
      active="admin_klients"
      title="Admin · Scheduler"
      crumbs={['Admin', 'Scheduler', quarterLabel()]}
      brandName="Mentivue"
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone}`}>
        <MonoLabel size={10} tracking="0.18em">
          Admin · Report scheduler
        </MonoLabel>
        <h1
          style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}
        >
          Scheduler
        </h1>
        <div style={`color:${C.inkSoft};font-size:13px;margin-top:6px`}>
          Cron beží automaticky každých 6 hodín. Manuálne spustenie je idempotentné — nedoduplikuje
          existujúce reporty.
        </div>
      </div>

      <main style="padding:28px;display:flex;flex-direction:column;gap:20px">
        <section style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">
            Posledný beh
          </MonoLabel>
          {last ? (
            <div style="margin-top:14px;display:grid;grid-template-columns:auto 1fr;gap:8px 18px;font-size:14px">
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Spustené
              </span>
              <span>
                <Num size={13}>{fmtDateTime(last.startedAt)}</Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Trvalo
              </span>
              <span>
                <Num size={13}>
                  {Math.round((last.finishedAt.getTime() - last.startedAt.getTime()) / 100) / 10} s
                </Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Klientov
              </span>
              <span>
                <Num size={13}>{last.klientsProcessed}</Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Nové riadky
              </span>
              <span>
                <Num size={13}>{last.rowsCreated}</Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Vygenerované (na review)
              </span>
              <span>
                <Num size={13}>{last.rowsGenerated}</Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Industry (rovno ready)
              </span>
              <span>
                <Num size={13}>{last.industryGenerated}</Num>
              </span>
              <span
                style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}
              >
                Chyby
              </span>
              <span style={last.rowsFailed > 0 ? `color:${C.negative}` : undefined}>
                <Num size={13}>{last.rowsFailed}</Num>
              </span>
            </div>
          ) : (
            <p style={`margin-top:10px;color:${C.inkSoft};font-size:13px`}>
              Scheduler ešte v tejto inštancii nebežal. Spustite ho manuálne tlačidlom nižšie.
            </p>
          )}
        </section>

        <section style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">
            Reports podľa stavu
          </MonoLabel>
          <table class="editorial" style="margin-top:12px">
            <thead>
              <tr>
                <th>Status</th>
                <th class="num">Počet</th>
              </tr>
            </thead>
            <tbody>
              {statusCounts.map((row) => (
                <tr>
                  <td>
                    <Num size={13}>{row.status}</Num>
                  </td>
                  <td class="num">{row.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <form method="post" action="/admin/scheduler/run">
          <button
            type="submit"
            disabled={running}
            style={`background:${running ? C.bone : C.ink};color:${running ? C.inkSoft : C.paper};border:1px solid ${C.ink};padding:14px 22px;font-size:14px;font-weight:500;cursor:${running ? 'wait' : 'pointer'}`}
          >
            {running ? '⏳ Beží…' : '▶ Spustiť scheduler teraz'}
          </button>
        </form>

        {last && last.errors.length > 0 && (
          <section style={`border:1px solid ${C.negative};background:#FFE8E0;padding:20px`}>
            <MonoLabel size={10} tracking="0.18em" color={C.negative}>
              Chyby z posledného behu
            </MonoLabel>
            <ul
              style={`margin-top:10px;padding-left:18px;font-size:12.5px;color:${C.ink};line-height:1.6`}
            >
              {last.errors.slice(0, 10).map((e) => (
                <li>
                  <code style={`font-family:${C.fontMono};font-size:11px`}>{e.type}</code> ·{' '}
                  {e.error}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </AppLayout>,
  );
});

// ============================================================================
// POST /admin/scheduler/run
// ============================================================================
ap.post('/admin/scheduler/run', async (c) => {
  if (isSchedulerRunning()) return c.redirect('/admin/scheduler?already=1');
  try {
    await runScheduler();
  } catch (err) {
    console.error('Manual scheduler run failed:', err);
  }
  return c.redirect('/admin/scheduler?ran=1');
});

export default ap;
