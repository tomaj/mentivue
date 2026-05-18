import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { brands, db, reports } from '@mentivue/shared/db';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { C, MonoLabel, Num } from '../components/primitives.tsx';
import { fmtDate } from '../lib/fmt.ts';

const r = new Hono();

const TYPE_LABEL: Record<string, string> = {
  audit: 'Quarterly Audit',
  action: 'Action Report',
  pulse: 'Pulse',
  industry: 'Industry',
};

function quarterLabel(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

r.get('/app/reports', async (c) => {
  const klient = c.get('klient');
  const brand = klient.brandId
    ? await db.query.brands.findFirst({ where: eq(brands.id, klient.brandId) })
    : null;
  const filterType = c.req.query('type');
  const all = await db.query.reports.findMany({
    where: eq(reports.klientId, klient.id),
    orderBy: desc(reports.createdAt),
  });
  const rows = filterType ? all.filter((row) => row.type === filterType) : all;

  return c.html(
    <AppLayout
      klient={klient}
      active={filterType === 'action' ? 'actions' : filterType === 'audit' ? 'audits' : filterType === 'pulse' ? 'pulse' : 'actions'}
      title="Reporty"
      crumbs={['Reporty', brand?.name ?? '—', quarterLabel()]}
      brandName={brand?.name ?? '—'}
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone};display:flex;justify-content:space-between;align-items:flex-end;gap:24px`}>
        <div>
          <MonoLabel size={10} tracking="0.18em">Reporty</MonoLabel>
          <h1 style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}>
            {filterType
              ? <>Vaše <em style={`font-style:italic;color:${C.signal}`}>{TYPE_LABEL[filterType] ?? filterType}</em> reporty</>
              : <>Všetky reporty</>
            }
          </h1>
          <div style={`color:${C.inkSoft};font-size:13px;margin-top:6px`}>
            {rows.length} {rows.length === 1 ? 'položka' : rows.length < 5 ? 'položky' : 'položiek'}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <a href="/app/reports" style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType ? C.bone : C.ink};background:${filterType ? 'transparent' : C.ink};color:${filterType ? C.inkSoft : C.paper}`}>Všetky</a>
          <a href="/app/reports?type=audit" style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'audit' ? C.ink : C.bone};background:${filterType === 'audit' ? C.ink : 'transparent'};color:${filterType === 'audit' ? C.paper : C.inkSoft}`}>Audity</a>
          <a href="/app/reports?type=action" style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'action' ? C.ink : C.bone};background:${filterType === 'action' ? C.ink : 'transparent'};color:${filterType === 'action' ? C.paper : C.inkSoft}`}>Action</a>
          <a href="/app/reports?type=pulse" style={`font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:8px 14px;border:1px solid ${filterType === 'pulse' ? C.ink : C.bone};background:${filterType === 'pulse' ? C.ink : 'transparent'};color:${filterType === 'pulse' ? C.paper : C.inkSoft}`}>Pulse</a>
        </div>
      </div>

      <main style="padding:28px">
        {rows.length === 0 ? (
          <div style={`border:1px dashed ${C.bone};background:${C.paperPure};padding:64px 24px;text-align:center;color:${C.inkSoft};font-size:14px`}>
            Žiadne reporty v tomto filtri.<br />
            <span style="font-size:12px">Prvý Pulse dostanete týždeň po onboardingu, Audit po prvom mesiaci.</span>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = row.metadata as { title?: string; pages?: number } | null;
                return (
                  <tr>
                    <td>
                      <span style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${C.inkSoft};padding:3px 8px;border:1px solid ${C.bone}`}>{TYPE_LABEL[row.type] ?? row.type}</span>
                    </td>
                    <td>
                      <strong style={`font-family:${C.fontDisplay};font-size:15px;font-weight:500;letter-spacing:-0.012em`}>{meta?.title ?? '—'}</strong>
                      {meta?.pages && <span style={`color:${C.inkSoft};font-size:12px`}> · {meta.pages} s.</span>}
                    </td>
                    <td>
                      <Num size={12} color={C.ink}>{fmtDate(row.periodStart)}</Num>
                      <span style={`color:${C.inkSoft};font-size:11px`}> – </span>
                      <Num size={12} color={C.ink}>{fmtDate(row.periodEnd)}</Num>
                    </td>
                    <td>
                      {row.status === 'ready' ? (
                        <span style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.positive};border:1px solid ${C.positive};padding:3px 8px;text-transform:uppercase`}>Ready</span>
                      ) : row.status === 'generating' ? (
                        <span style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.signal};border:1px solid ${C.signal};padding:3px 8px;text-transform:uppercase`}>Generating</span>
                      ) : (
                        <span style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.inkSoft};border:1px solid ${C.bone};padding:3px 8px;text-transform:uppercase`}>{row.status}</span>
                      )}
                    </td>
                    <td class="num"><Num size={12} color={C.ink}>{fmtDate(row.createdAt)}</Num></td>
                    <td>
                      {row.status === 'ready' && row.storageUrl ? (
                        <a href={row.storageUrl} style={`color:${C.signal};font-size:12.5px;border-bottom:1px solid ${C.signal};padding-bottom:1px`}>Stiahnuť →</a>
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

export default r;
