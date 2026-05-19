import { randomBytes } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { env } from '@mentivue/shared/config';
import { brands, db, klients, signupRequests } from '@mentivue/shared/db';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { C, MonoLabel, Num } from '../components/primitives.tsx';
import { Sparkline } from '../components/Widgets.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { hashPassword, issueMagicLinkToken } from '../lib/auth.ts';
import { adminCostHistory, adminHealthToday } from '../lib/dashboard-queries.ts';
import { passwordResetEmail, sendEmail, signupApprovedEmail } from '../lib/email.ts';
import { fmtDate, fmtDateTime, fmtDecimal, fmtInt, fmtUsd, tierLabel } from '../lib/fmt.ts';
import { uuidParam } from '../lib/schemas.ts';

const admin = new Hono();

function quarterLabel(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

// ============================================================================
// GET /admin/klients
// ============================================================================
admin.get('/admin/klients', async (c) => {
  const klient = c.get('klient');
  const rows = await db.query.klients.findMany({
    orderBy: desc(klients.createdAt),
    with: { brand: true },
  });
  const allBrands = await db.query.brands.findMany();
  const pendingSignups = await db.query.signupRequests.findMany({
    where: eq(signupRequests.status, 'pending'),
    orderBy: desc(signupRequests.createdAt),
  });
  const created = c.req.query('created');
  const updated = c.req.query('updated');
  const approved = c.req.query('approved');
  const rejected = c.req.query('rejected');
  const err = c.req.query('error');

  return c.html(
    <AppLayout
      klient={klient}
      active="admin_klients"
      title="Admin · Klienti"
      crumbs={['Admin', 'Klienti', quarterLabel()]}
      brandName="Mentivue"
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone}`}>
        <MonoLabel size={10} tracking="0.18em">
          Admin
        </MonoLabel>
        <h1
          style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}
        >
          Klienti <em style={`font-style:italic;color:${C.signal}`}>· {rows.length}</em>
        </h1>
      </div>

      <main style="padding:28px;display:grid;gap:24px">
        {created && <div class="alert ok">Klient vytvorený: {created}</div>}
        {updated && <div class="alert ok">Klient aktualizovaný.</div>}
        {approved && (
          <div class="alert ok">Žiadosť schválená a magic link odoslaný: {approved}</div>
        )}
        {rejected && <div class="alert ok">Žiadosť zamietnutá: {rejected}</div>}
        {err === 'email_exists' && <div class="alert err">Email je už registrovaný.</div>}
        {err === 'invalid_brand' && <div class="alert err">Neexistujúca značka.</div>}

        {pendingSignups.length > 0 && (
          <section>
            <MonoLabel size={10} tracking="0.18em" color={C.signal}>
              Žiadosti o prístup · {pendingSignups.length} pending
            </MonoLabel>
            <h2
              style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 14px`}
            >
              Na schválenie
            </h2>
            <div style="display:flex;flex-direction:column;gap:10px">
              {pendingSignups.map((req) => (
                <div
                  style={`border:1px solid ${C.bone};border-left:3px solid ${C.signal};background:${C.paperPure};padding:18px 20px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:18px;align-items:center`}
                >
                  <div>
                    <div
                      style={`font-family:${C.fontDisplay};font-size:17px;font-weight:500;letter-spacing:-0.012em`}
                    >
                      {req.name}
                    </div>
                    <div style={`color:${C.inkSoft};font-size:13px;margin-top:2px`}>
                      {req.email}
                    </div>
                    {req.role && (
                      <Num size={10} color={C.inkSoft}>
                        {req.role}
                      </Num>
                    )}
                  </div>
                  <div style={`font-size:13.5px;color:${C.ink}`}>
                    <div>
                      <strong>{req.company ?? '—'}</strong>
                    </div>
                    {req.brandSlug && (
                      <div style={`color:${C.inkSoft};font-size:12px;margin-top:2px`}>
                        značka: {req.brandSlug}
                      </div>
                    )}
                    <Num size={10} color={C.inkSoft}>
                      žiadosť · {fmtDate(req.createdAt)}
                    </Num>
                  </div>
                  <div style="display:flex;gap:8px">
                    <form
                      method="post"
                      action={`/admin/signups/${req.id}/approve`}
                      style="margin:0"
                    >
                      <button
                        type="submit"
                        style={`background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:10px 14px;font-size:12.5px;font-weight:500`}
                      >
                        Schváliť →
                      </button>
                    </form>
                    <form method="post" action={`/admin/signups/${req.id}/reject`} style="margin:0">
                      <button
                        type="submit"
                        style={`background:transparent;color:${C.inkSoft};border:1px solid ${C.bone};padding:10px 14px;font-size:12.5px`}
                      >
                        Zamietnuť
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">
            Nový klient
          </MonoLabel>
          <h2
            style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 18px`}
          >
            Vytvoriť účet
          </h2>
          <form method="post" action="/admin/klients" class="form-stack">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <div>
                <label for="email">Email</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div>
                <label for="password">Počiatočné heslo (min. 8)</label>
                <input id="password" name="password" type="text" minlength={8} required />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <div>
                <label for="name">Meno</label>
                <input id="name" name="name" type="text" />
              </div>
              <div>
                <label for="company">Spoločnosť</label>
                <input id="company" name="company" type="text" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <div>
                <label for="tier">Plán</label>
                <select id="tier" name="tier">
                  <option value="">— žiadny —</option>
                  <option value="watch">Watch</option>
                  <option value="pro" selected>
                    Pro
                  </option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label for="brand_slug">Sledovaná značka</label>
                <select id="brand_slug" name="brand_slug">
                  <option value="">— žiadna —</option>
                  {allBrands.map((b) => (
                    <option value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={`align-self:flex-start;background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:14px 22px;font-size:14px;font-weight:500`}
            >
              Vytvoriť klienta
            </button>
          </form>
        </section>

        <section>
          <MonoLabel size={10} tracking="0.18em">
            Existujúci klienti
          </MonoLabel>
          <h2
            style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 14px`}
          >
            Účty
          </h2>
          <table class="editorial">
            <thead>
              <tr>
                <th>Email</th>
                <th>Meno / Spoločnosť</th>
                <th>Značka</th>
                <th>Plán</th>
                <th>Status</th>
                <th class="num">Posl. prihl.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr>
                  <td>
                    <strong
                      style={`font-family:${C.fontDisplay};font-size:15px;letter-spacing:-0.012em`}
                    >
                      {k.email}
                    </strong>
                    {k.isAdmin && (
                      <span
                        style={`margin-left:6px;font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;color:${C.signal};border:1px solid ${C.signal};padding:2px 6px;text-transform:uppercase`}
                      >
                        Admin
                      </span>
                    )}
                  </td>
                  <td>
                    {k.name ?? <span style={`color:${C.inkSoft}`}>—</span>}
                    {k.company && (
                      <div style={`color:${C.inkSoft};font-size:12px`}>{k.company}</div>
                    )}
                  </td>
                  <td>{k.brand?.name ?? <span style={`color:${C.inkSoft}`}>—</span>}</td>
                  <td>
                    {k.tier ? (
                      <span
                        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${C.signal};border:1px solid ${C.signal};padding:2px 8px`}
                      >
                        {tierLabel(k.tier)}
                      </span>
                    ) : (
                      <span style={`color:${C.inkSoft}`}>—</span>
                    )}
                  </td>
                  <td>
                    {k.status === 'active' ? (
                      <span
                        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;color:${C.positive};border:1px solid ${C.positive};padding:2px 8px;text-transform:uppercase`}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;color:${C.inkSoft};border:1px solid ${C.bone};padding:2px 8px;text-transform:uppercase`}
                      >
                        {k.status}
                      </span>
                    )}
                  </td>
                  <td class="num">
                    <Num size={12}>{k.lastLoginAt ? fmtDateTime(k.lastLoginAt) : '—'}</Num>
                  </td>
                  <td>
                    <form
                      method="post"
                      action={`/admin/klients/${k.id}/reset`}
                      style="display:inline"
                    >
                      <button
                        type="submit"
                        style={`background:transparent;border:1px solid ${C.bone};font-family:${C.fontBody};font-size:11.5px;color:${C.inkSoft};padding:6px 10px`}
                      >
                        Reset heslo
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </AppLayout>,
  );
});

// ============================================================================
// POST /admin/klients — create
// ============================================================================
admin.post('/admin/klients', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '');
  const name = String(body.name ?? '').trim() || null;
  const company = String(body.company ?? '').trim() || null;
  const tierRaw = String(body.tier ?? '').trim();
  const tier = tierRaw === '' ? null : tierRaw;
  const brandSlug = String(body.brand_slug ?? '').trim();

  if (!email || password.length < 8) return c.redirect('/admin/klients?error=invalid');
  const existing = await db.query.klients.findFirst({ where: eq(klients.email, email) });
  if (existing) return c.redirect('/admin/klients?error=email_exists');

  let brandId: string | null = null;
  if (brandSlug) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.slug, brandSlug) });
    if (!brand) return c.redirect('/admin/klients?error=invalid_brand');
    brandId = brand.id;
  }

  const hash = await hashPassword(password);
  await db.insert(klients).values({
    email,
    name,
    company,
    brandId,
    tier,
    passwordHash: hash,
    emailVerifiedAt: new Date(),
    status: 'active',
  });

  return c.redirect(`/admin/klients?created=${encodeURIComponent(email)}`);
});

// ============================================================================
// POST /admin/signups/:id/approve — convert request to klient + email magic link
// ============================================================================
admin.post('/admin/signups/:id/approve', zValidator('param', uuidParam), async (c) => {
  const id = c.req.param('id');
  const adminKlient = c.get('klient');
  const req = await db.query.signupRequests.findFirst({ where: eq(signupRequests.id, id) });
  if (!req) return c.redirect('/admin/klients?error=signup_missing');
  if (req.status !== 'pending') return c.redirect('/admin/klients?error=already_decided');

  // Resolve brand if slug provided
  let brandId: string | null = null;
  if (req.brandSlug) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.slug, req.brandSlug) });
    if (brand) brandId = brand.id;
  }

  // Atomicity: klient upsert + request status flip happen together, so a
  // partial failure can't leave a klient row with a still-pending request.
  let klientId: string;
  try {
    klientId = await db.transaction(async (tx) => {
      const existing = await tx.query.klients.findFirst({ where: eq(klients.email, req.email) });
      let kId: string;
      if (existing) {
        kId = existing.id;
      } else {
        const [inserted] = await tx
          .insert(klients)
          .values({
            email: req.email,
            name: req.name,
            company: req.company,
            brandId,
            tier: 'pro',
            status: 'active',
            emailVerifiedAt: new Date(),
          })
          .returning({ id: klients.id });
        if (!inserted) throw new Error('klient_insert_failed');
        kId = inserted.id;
      }
      await tx
        .update(signupRequests)
        .set({ status: 'approved', decidedAt: new Date(), decidedBy: adminKlient.id })
        .where(eq(signupRequests.id, id));
      return kId;
    });
  } catch (err) {
    console.error('Admin approve failed:', err);
    return c.redirect('/admin/klients?error=insert_failed');
  }

  // Email + token are outside the tx — slow/external; magic link can be re-issued if needed.
  const approvedBrand = brandId
    ? await db.query.brands.findFirst({ where: eq(brands.id, brandId) })
    : null;
  const { token } = await issueMagicLinkToken(klientId);
  const url = `${env.APP_URL}/magic/verify?token=${token}&next=/app/dashboard`;
  const tmpl = signupApprovedEmail({
    recipientName: req.name,
    recipientEmail: req.email,
    brandName: approvedBrand?.name ?? null,
    magicUrl: url,
  });
  const result = await sendEmail({ to: req.email, ...tmpl });
  if (!result.ok) console.error('Approval magic link email failed:', result.error);

  return c.redirect(`/admin/klients?approved=${encodeURIComponent(req.email)}`);
});

admin.post('/admin/signups/:id/reject', zValidator('param', uuidParam), async (c) => {
  const id = c.req.param('id');
  const adminKlient = c.get('klient');
  const req = await db.query.signupRequests.findFirst({ where: eq(signupRequests.id, id) });
  if (!req) return c.redirect('/admin/klients?error=signup_missing');
  await db
    .update(signupRequests)
    .set({ status: 'rejected', decidedAt: new Date(), decidedBy: adminKlient.id })
    .where(eq(signupRequests.id, id));
  return c.redirect(`/admin/klients?rejected=${encodeURIComponent(req.email)}`);
});

// ============================================================================
// POST /admin/klients/:id/reset — rotate password
// ============================================================================
admin.post('/admin/klients/:id/reset', zValidator('param', uuidParam), async (c) => {
  const id = c.req.param('id');
  const target = await db.query.klients.findFirst({ where: eq(klients.id, id) });
  if (!target) return c.redirect('/admin/klients?error=klient_missing');

  const tempPassword = randomBytes(12).toString('base64url');
  const hash = await hashPassword(tempPassword);
  await db.update(klients).set({ passwordHash: hash }).where(eq(klients.id, id));

  const tmpl = passwordResetEmail({
    recipientName: target.name,
    recipientEmail: target.email,
    tempPassword,
    loginUrl: `${env.APP_URL}/login?tab=pw`,
  });
  const result = await sendEmail({ to: target.email, ...tmpl });
  if (!result.ok) console.error('Password reset email failed:', result.error);

  return c.redirect(`/admin/klients?updated=${encodeURIComponent(target.email)}`);
});

// ============================================================================
// GET /admin/health
// ============================================================================
admin.get('/admin/health', async (c) => {
  const klient = c.get('klient');
  const [today, history] = await Promise.all([adminHealthToday(), adminCostHistory(7)]);

  const todayTotal = today.reduce(
    (acc, r) => ({
      calls: acc.calls + r.total_calls,
      errors: acc.errors + r.errors,
      cost: acc.cost + r.total_cost_usd,
    }),
    { calls: 0, errors: 0, cost: 0 },
  );

  const costValues = history.map((h) => h.total_cost_usd);

  return c.html(
    <AppLayout
      klient={klient}
      active="admin_health"
      title="Admin · Health"
      crumbs={['Admin', 'System Health', quarterLabel()]}
      brandName="Mentivue"
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone}`}>
        <MonoLabel size={10} tracking="0.18em">
          Admin
        </MonoLabel>
        <h1
          style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}
        >
          System Health
        </h1>
        <div style={`color:${C.inkSoft};font-size:13px;margin-top:6px`}>
          LLM volania, náklady, chybovosť — dnešok a 7-dňový trend.
        </div>
      </div>

      <main style="padding:28px;display:flex;flex-direction:column;gap:32px">
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:0">
          <div
            style={`border:1px solid ${C.ink};border-right:none;background:${C.paperPure};padding:20px 22px;min-height:120px`}
          >
            <MonoLabel size={10} tracking="0.18em">
              Dnes · volania
            </MonoLabel>
            <div
              style={`font-family:${C.fontDisplay};font-size:36px;font-weight:400;letter-spacing:-0.025em;margin-top:8px;font-variant-numeric:tabular-nums`}
            >
              {fmtInt(todayTotal.calls)}
            </div>
          </div>
          <div
            style={`border:1px solid ${C.ink};border-right:none;background:${C.paperPure};padding:20px 22px`}
          >
            <MonoLabel size={10} tracking="0.18em">
              Dnes · chyby
            </MonoLabel>
            <div
              style={`font-family:${C.fontDisplay};font-size:36px;font-weight:400;letter-spacing:-0.025em;margin-top:8px;color:${todayTotal.errors > 0 ? C.negative : C.ink};font-variant-numeric:tabular-nums`}
            >
              {fmtInt(todayTotal.errors)}
            </div>
            <Num size={11} color={C.inkSoft}>
              {todayTotal.calls > 0
                ? `${fmtDecimal((todayTotal.errors / todayTotal.calls) * 100, 1)} % error rate`
                : '—'}
            </Num>
          </div>
          <div
            style={`border:1px solid ${C.ink};border-right:none;background:${C.paperPure};padding:20px 22px`}
          >
            <MonoLabel size={10} tracking="0.18em">
              Dnes · náklady
            </MonoLabel>
            <div
              style={`font-family:${C.fontDisplay};font-size:36px;font-weight:400;letter-spacing:-0.025em;margin-top:8px;font-variant-numeric:tabular-nums`}
            >
              {fmtUsd(todayTotal.cost)}
            </div>
          </div>
          <div style={`border:1px solid ${C.ink};background:${C.paperPure};padding:20px 22px`}>
            <MonoLabel size={10} tracking="0.18em">
              7d · náklady
            </MonoLabel>
            <div
              style={`font-family:${C.fontDisplay};font-size:36px;font-weight:400;letter-spacing:-0.025em;margin-top:8px;font-variant-numeric:tabular-nums`}
            >
              {fmtUsd(history.reduce((s, h) => s + h.total_cost_usd, 0))}
            </div>
          </div>
        </div>

        <section>
          <MonoLabel size={10} tracking="0.18em">
            7-dňový trend nákladov
          </MonoLabel>
          <div
            style={`border:1px solid ${C.ink};background:${C.paperPure};padding:20px;margin-top:12px`}
          >
            <Sparkline values={costValues} color={C.signal} fill height={80} />
            <div style="margin-top:8px;display:flex;justify-content:space-between">
              <Num size={10} color={C.inkSoft}>
                {history[0]?.day ?? '—'}
              </Num>
              <Num size={10} color={C.inkSoft}>
                {history[history.length - 1]?.day ?? '—'}
              </Num>
            </div>
          </div>
        </section>

        <section>
          <MonoLabel size={10} tracking="0.18em">
            Dnes podľa providera
          </MonoLabel>
          {today.length === 0 ? (
            <div
              style={`border:1px dashed ${C.bone};padding:32px;color:${C.inkSoft};font-size:13px;background:${C.paperPure};margin-top:12px`}
            >
              Dnes ešte žiadne LLM volania.
            </div>
          ) : (
            <table class="editorial" style="margin-top:12px">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th class="num">Volania</th>
                  <th class="num">Chyby</th>
                  <th class="num">Náklady</th>
                  <th class="num">Priem. latencia</th>
                </tr>
              </thead>
              <tbody>
                {today.map((row) => (
                  <tr>
                    <td>
                      <Num size={13}>{row.provider}</Num>
                    </td>
                    <td class="num">{fmtInt(row.total_calls)}</td>
                    <td class="num">
                      {row.errors > 0 ? (
                        <span
                          style={`font-family:${C.fontMono};color:${C.negative};border:1px solid ${C.negative};padding:2px 8px`}
                        >
                          {row.errors}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td class="num">{fmtUsd(row.total_cost_usd)}</td>
                    <td class="num">
                      {row.avg_latency_ms !== null ? `${fmtInt(row.avg_latency_ms)} ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </AppLayout>,
  );
});

export default admin;
