import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { brands, db, klients } from '@mentivue/shared/db';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { C, MonoLabel, Num } from '../components/primitives.tsx';
import { hashPassword, verifyPassword } from '../lib/auth.ts';
import { fmtDateTime, tierLabel } from '../lib/fmt.ts';

const s = new Hono();

function quarterLabel(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

s.get('/app/settings', async (c) => {
  const klient = c.get('klient');
  const fresh = await db.query.klients.findFirst({ where: eq(klients.id, klient.id) });
  if (!fresh) return c.text('Not found', 404);
  const brand = klient.brandId
    ? await db.query.brands.findFirst({ where: eq(brands.id, klient.brandId) })
    : null;
  const success = c.req.query('saved') === '1';
  const error = c.req.query('error');

  return c.html(
    <AppLayout
      klient={klient}
      active="settings"
      title="Nastavenia"
      crumbs={['Nastavenia', brand?.name ?? '—', quarterLabel()]}
      brandName={brand?.name ?? '—'}
    >
      <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone}`}>
        <MonoLabel size={10} tracking="0.18em">Účet</MonoLabel>
        <h1 style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:8px 0 0;color:${C.ink}`}>
          Nastavenia účtu
        </h1>
      </div>

      <main style="padding:28px;display:grid;gap:24px;grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
        {success && <div class="alert ok" style="grid-column:1/-1">Uložené.</div>}
        {error === 'wrong_current' && <div class="alert err" style="grid-column:1/-1">Súčasné heslo nesedí.</div>}
        {error === 'too_short' && <div class="alert err" style="grid-column:1/-1">Nové heslo musí mať aspoň 8 znakov.</div>}

        <section style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">Účet</MonoLabel>
          <h2 style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 18px`}>Detaily</h2>
          <dl style="display:grid;grid-template-columns:auto 1fr;gap:10px 18px;font-size:14px">
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Email</dt>
            <dd>{fresh.email}</dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Meno</dt>
            <dd>{fresh.name ?? <span style={`color:${C.inkSoft}`}>—</span>}</dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Spoločnosť</dt>
            <dd>{fresh.company ?? <span style={`color:${C.inkSoft}`}>—</span>}</dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Značka</dt>
            <dd>{brand?.name ?? <span style={`color:${C.inkSoft}`}>—</span>}</dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Plán</dt>
            <dd>
              {fresh.tier ? (
                <span style={`font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${C.signal};border:1px solid ${C.signal};padding:3px 8px`}>{tierLabel(fresh.tier)}</span>
              ) : (
                <span style={`color:${C.inkSoft}`}>—</span>
              )}
            </dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Posl. prihlásenie</dt>
            <dd><Num size={13}>{fmtDateTime(fresh.lastLoginAt)}</Num></dd>
            <dt style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase`}>Účet od</dt>
            <dd><Num size={13}>{fmtDateTime(fresh.createdAt)}</Num></dd>
          </dl>
        </section>

        <section style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">Bezpečnosť</MonoLabel>
          <h2 style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 18px`}>Zmena hesla</h2>
          <form method="post" action="/app/settings/password" class="form-stack">
            <div>
              <label for="current_password">Súčasné heslo</label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                required
                autocomplete="current-password"
              />
            </div>
            <div>
              <label for="new_password">Nové heslo (min. 8 znakov)</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                autocomplete="new-password"
                minlength={8}
              />
            </div>
            <button
              type="submit"
              style={`align-self:flex-start;display:inline-flex;gap:8px;align-items:center;justify-content:center;background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:14px 22px;font-size:14px;font-weight:500`}
            >
              Uložiť nové heslo
            </button>
          </form>
        </section>

        <section id="billing" style={`grid-column:1/-1;border:1px solid ${C.bone};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">Predplatné</MonoLabel>
          <h2 style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 12px`}>Fakturácia</h2>
          <p style={`color:${C.inkSoft};font-size:14px;line-height:1.5`}>
            Stripe portál (úprava predplatného, fakturácia, výpoveď) bude dostupný po napojení Stripe v ďalšom kroku.
          </p>
          {fresh.stripeCustomerId && (
            <p style={`margin-top:8px;font-family:${C.fontMono};color:${C.inkSoft};font-size:12px`}>customer_id: {fresh.stripeCustomerId}</p>
          )}
        </section>

        <section id="team" style={`grid-column:1/-1;border:1px solid ${C.bone};background:${C.paperPure};padding:24px`}>
          <MonoLabel size={10} tracking="0.18em">Tím</MonoLabel>
          <h2 style={`font-family:${C.fontDisplay};font-size:22px;font-weight:400;letter-spacing:-0.018em;margin:8px 0 12px`}>Členovia</h2>
          <p style={`color:${C.inkSoft};font-size:14px`}>Viacero členov tímu pribudne s Enterprise plánom.</p>
        </section>
      </main>
    </AppLayout>,
  );
});

s.post('/app/settings/password', async (c) => {
  const klient = c.get('klient');
  const body = await c.req.parseBody();
  const current = String(body.current_password ?? '');
  const next = String(body.new_password ?? '');

  if (next.length < 8) return c.redirect('/app/settings?error=too_short');

  const fresh = await db.query.klients.findFirst({ where: eq(klients.id, klient.id) });
  if (!fresh || !fresh.passwordHash) return c.redirect('/app/settings?error=wrong_current');

  const ok = await verifyPassword(current, fresh.passwordHash);
  if (!ok) return c.redirect('/app/settings?error=wrong_current');

  const newHash = await hashPassword(next);
  await db.update(klients).set({ passwordHash: newHash }).where(eq(klients.id, klient.id));
  return c.redirect('/app/settings?saved=1');
});

export default s;
