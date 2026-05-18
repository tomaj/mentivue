import { Hono } from 'hono';
import type { FC, PropsWithChildren } from 'hono/jsx';
import { eq } from 'drizzle-orm';
import { db, signupRequests } from '@mentivue/shared/db';
import { env } from '@mentivue/shared/config';
import { AuthLayout } from '../layouts/AuthLayout.tsx';
import { C, LogoLockup, MonoLabel, PulseDot } from '../components/primitives.tsx';
import {
  consumeMagicLinkToken,
  findKlientByEmail,
  issueMagicLinkToken,
  verifyPassword,
} from '../lib/auth.ts';
import { createSession, destroySession } from '../lib/session.ts';
import { magicLinkEmail, sendEmail } from '../lib/email.ts';

// Block public email domains for B2B signup (per prototype)
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'yahoo.sk',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'seznam.cz',
  'centrum.sk',
  'centrum.cz',
  'azet.sk',
  'zoznam.sk',
  'post.sk',
]);

function isPublicEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return !!domain && PUBLIC_EMAIL_DOMAINS.has(domain);
}

const auth = new Hono();

function sanitizeNext(next: string | undefined): string {
  if (!next) return '/app/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) return '/app/dashboard';
  return next;
}

// ────────── Layout pieces (translated from auth-screens.jsx) ──────────
const LeftPanel: FC<PropsWithChildren> = ({ children }) => (
  <aside style={`background:${C.ink};color:${C.paper};padding:56px clamp(40px,5vw,72px) 56px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;gap:28px`}>
    {/* Subtle grain — inline SVG */}
    <div
      aria-hidden="true"
      style={`position:absolute;inset:0;opacity:0.18;pointer-events:none;mix-blend-mode:screen;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' type='fractalNoise'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`}
    />
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;justify-content:space-between;flex:1">
      {children}
    </div>
  </aside>
);

const RightPanel: FC<PropsWithChildren> = ({ children }) => (
  <section style={`background:${C.paper};padding:64px clamp(32px,5vw,72px) 48px;display:flex;justify-content:center;align-items:flex-start`}>
    <div style="width:100%;max-width:460px;display:flex;flex-direction:column;gap:24px">{children}</div>
  </section>
);

const FormHead: FC<{ eyebrow: string; title: unknown }> = ({ eyebrow, title }) => (
  <div style="display:flex;flex-direction:column;gap:14px">
    <MonoLabel size={10} tracking="0.18em">{eyebrow}</MonoLabel>
    <h2 style={`font-family:${C.fontDisplay};font-weight:400;font-size:30px;line-height:1.1;letter-spacing:-0.02em;color:${C.ink};margin:0`}>{title}</h2>
  </div>
);

const TabSwitcher: FC<{ activeTab: 'magic' | 'pw'; next: string }> = ({ activeTab, next }) => (
  <div style={`display:inline-flex;border:1px solid ${C.ink};align-self:flex-start`}>
    <a
      href={`/login?tab=magic${next !== '/app/dashboard' ? `&next=${encodeURIComponent(next)}` : ''}`}
      style={`padding:8px 16px;font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;background:${activeTab === 'magic' ? C.ink : 'transparent'};color:${activeTab === 'magic' ? C.paper : C.ink};text-decoration:none`}
    >
      Magic link
    </a>
    <a
      href={`/login?tab=pw${next !== '/app/dashboard' ? `&next=${encodeURIComponent(next)}` : ''}`}
      style={`padding:8px 16px;font-family:${C.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;background:${activeTab === 'pw' ? C.ink : 'transparent'};color:${activeTab === 'pw' ? C.paper : C.ink};text-decoration:none;border-left:1px solid ${C.ink}`}
    >
      Heslo
    </a>
  </div>
);

const labelStyle = `font-family:${C.fontMono};font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${C.inkSoft};display:block;margin-bottom:10px`;

// ============================================================================
// GET /login
// ============================================================================
auth.get('/login', (c) => {
  if (c.get('klient')) return c.redirect('/app/dashboard');
  const next = sanitizeNext(c.req.query('next'));
  const tab: 'magic' | 'pw' = c.req.query('tab') === 'pw' ? 'pw' : 'magic';
  const sent = c.req.query('sent') === '1';
  const error = c.req.query('error');
  const expired = c.req.query('expired') === '1';

  return c.html(
    <AuthLayout title="Prihlásenie">
      <LeftPanel>
        <LogoLockup color={C.paper} size={28} />
        <div style="display:flex;flex-direction:column;gap:28px;flex:1;justify-content:center">
          <div style="display:flex;align-items:center;gap:12px">
            <PulseDot size={7} />
            <MonoLabel size={10} tracking="0.22em" color="rgba(247,244,237,0.7)">Mentivue · Pro</MonoLabel>
          </div>
          <h2 style={`font-family:${C.fontDisplay};font-weight:400;font-size:clamp(34px, 3.4vw, 44px);line-height:1.08;letter-spacing:-0.025em;color:${C.paper};margin:0;max-width:460px`}>
            Vitajte späť.<br />
            <em style={`font-style:italic;color:${C.signal};font-weight:400`}>Pulse vás čaká.</em>
          </h2>
          <div style="display:flex;align-items:center;gap:14px;padding-top:18px;border-top:1px solid rgba(247,244,237,0.18)">
            <span style="width:18px;height:1px;background:rgba(247,244,237,0.5)" />
            <MonoLabel size={10} tracking="0.18em" color="rgba(247,244,237,0.6)">Posledné vydanie · štvrtok 06:00</MonoLabel>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <PulseDot size={6} />
          <MonoLabel size={9} tracking="0.22em" color="rgba(247,244,237,0.5)">Index · naživo · Q2 2026</MonoLabel>
        </div>
      </LeftPanel>

      <RightPanel>
        <LogoLockup size={26} />
        <FormHead eyebrow="Prihlásenie" title="Pokračujte vo vašom výskume." />

        <TabSwitcher activeTab={tab} next={next} />

        {expired && (
          <div class="alert err">Odkaz vypršal alebo už bol použitý. Vyžiadajte si nový.</div>
        )}
        {error && <div class="alert err">Nesprávne prihlasovacie údaje.</div>}
        {sent && (
          <div class="alert ok">Prihlasovací odkaz sme poslali na váš email. Skontrolujte schránku (alebo konzolu app servera v dev).</div>
        )}

        {tab === 'magic' ? (
          <form method="post" action="/magic" style="display:flex;flex-direction:column;gap:14px">
            <input type="hidden" name="next" value={next} />
            <div>
              <label for="magic-email" style={labelStyle}>Pracovný e-mail</label>
              <input id="magic-email" name="email" type="email" required autocomplete="email" placeholder="vy@značka.sk" />
            </div>
            <button
              type="submit"
              style={`background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:16px 22px;font-size:15px;font-weight:500;font-family:${C.fontBody};display:inline-flex;justify-content:center;align-items:center;gap:10px;width:100%`}
            >
              Poslať magic link <span>→</span>
            </button>
            <div style={`font-size:12.5px;color:${C.inkSoft};line-height:1.5`}>
              Pošleme vám link na prihlásenie do <span style={`font-family:${C.fontMono};color:${C.ink}`}>30 s</span>.
            </div>
          </form>
        ) : (
          <form method="post" action="/login" style="display:flex;flex-direction:column;gap:14px">
            <input type="hidden" name="next" value={next} />
            <div>
              <label for="login-email" style={labelStyle}>Pracovný e-mail</label>
              <input id="login-email" name="email" type="email" required autocomplete="email" placeholder="vy@značka.sk" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
                <label for="login-pw" style={`${labelStyle};margin-bottom:0`}>Heslo</label>
                <a href={`/login?tab=magic&next=${encodeURIComponent(next)}`} style={`font-size:12px;color:${C.signal};text-decoration:none`}>Zabudli ste heslo?</a>
              </div>
              <input id="login-pw" name="password" type="password" required autocomplete="current-password" placeholder="••••••••••••" />
            </div>
            <button
              type="submit"
              style={`background:${C.ink};color:${C.paper};border:1px solid ${C.ink};padding:16px 22px;font-size:15px;font-weight:500;font-family:${C.fontBody};display:inline-flex;justify-content:center;align-items:center;gap:10px;width:100%`}
            >
              Prihlásiť sa
            </button>
          </form>
        )}

        <div style={`font-size:13.5px;color:${C.inkSoft};text-align:center`}>
          Nemáte účet? <a href="/signup" style={`color:${C.ink};text-decoration:none;border-bottom:1px solid ${C.ink};padding-bottom:1px`}>Požiadať o prístup<span style="margin-left:4px">→</span></a>
        </div>
      </RightPanel>
    </AuthLayout>,
  );
});

// ============================================================================
// POST /login — email + password
// ============================================================================
auth.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const next = sanitizeNext(String(body.next ?? ''));

  if (!email || !password) return c.redirect(`/login?tab=pw&error=1&next=${encodeURIComponent(next)}`);

  const klient = await findKlientByEmail(email);
  if (!klient || !klient.passwordHash) {
    return c.redirect(`/login?tab=pw&error=1&next=${encodeURIComponent(next)}`);
  }
  const ok = await verifyPassword(password, klient.passwordHash);
  if (!ok) return c.redirect(`/login?tab=pw&error=1&next=${encodeURIComponent(next)}`);

  await createSession(c, klient.id);
  return c.redirect(next);
});

// ============================================================================
// POST /magic — request magic link
// ============================================================================
auth.post('/magic', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? '').trim();
  const next = sanitizeNext(String(body.next ?? ''));

  const klient = await findKlientByEmail(email);
  if (klient) {
    const { token } = await issueMagicLinkToken(klient.id);
    const url = `${env.APP_URL}/magic/verify?token=${token}&next=${encodeURIComponent(next)}`;
    const tmpl = magicLinkEmail(url);
    const result = await sendEmail({ to: klient.email, ...tmpl });
    if (!result.ok) console.error('Magic link email failed:', result.error);
  }
  return c.redirect(`/login?tab=magic&sent=1&next=${encodeURIComponent(next)}`);
});

// ============================================================================
// GET /magic/verify
// ============================================================================
auth.get('/magic/verify', async (c) => {
  const token = c.req.query('token');
  const next = sanitizeNext(c.req.query('next'));
  if (!token) return c.redirect('/login?expired=1');
  const klientId = await consumeMagicLinkToken(token);
  if (!klientId) return c.redirect('/login?expired=1');
  await createSession(c, klientId);
  return c.redirect(next);
});

// ============================================================================
// POST /logout
// ============================================================================
auth.post('/logout', async (c) => {
  await destroySession(c);
  return c.redirect('/login');
});

// ============================================================================
// GET /signup — curated B2B sign-up request form (admin must approve)
// ============================================================================
const roleOptions = ['CMO', 'Marketing Director', 'Digital Lead', 'E-commerce Manager', 'Iné'];

auth.get('/signup', async (c) => {
  if (c.get('klient')) return c.redirect('/app/dashboard');

  const submitted = c.req.query('submitted') === '1';
  const error = c.req.query('error'); // 'public_email' | 'invalid' | 'already_pending'
  const formEmail = c.req.query('email') ?? '';
  const formName = c.req.query('name') ?? '';
  const formCompany = c.req.query('company') ?? '';
  const formRole = c.req.query('role') ?? '';
  const formBrand = c.req.query('brand') ?? '';

  // Pending slots banner: count active pending requests
  const pendingCount = await db
    .select({ id: signupRequests.id })
    .from(signupRequests)
    .where(eq(signupRequests.status, 'pending'));
  const slotsLeft = Math.max(3 - pendingCount.length, 0);

  if (submitted) {
    return c.html(
      <AuthLayout title="Žiadosť odoslaná">
        <LeftPanel>
          <LogoLockup color={C.paper} size={28} />
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px">
            <div style="display:flex;align-items:center;gap:12px">
              <PulseDot size={7} />
              <MonoLabel size={10} tracking="0.22em" color="rgba(247,244,237,0.7)">Žiadosť prijatá</MonoLabel>
            </div>
            <h2 style={`font-family:${C.fontDisplay};font-weight:400;font-size:clamp(34px, 3.4vw, 44px);line-height:1.08;letter-spacing:-0.025em;color:${C.paper};margin:0;max-width:460px`}>
              Ďakujeme. <em style={`font-style:italic;color:${C.signal};font-weight:400`}>Ozveme sa do 2 prac. dní.</em>
            </h2>
          </div>
        </LeftPanel>
        <RightPanel>
          <LogoLockup size={26} />
          <FormHead eyebrow="Status" title={<>Vaša žiadosť čaká na prijatie.</>} />
          <p style={`color:${C.inkSoft};font-size:14px;line-height:1.6`}>
            Skontrolujem každú žiadosť osobne. Pri schválení dostanete magic link na váš pracovný e-mail. Vidím vaše prvé výsledky obyčajne do 48 hodín od schválenia.
          </p>
          <div style={`border:1px solid ${C.bone};background:${C.paperPure};padding:18px`}>
            <MonoLabel size={9} tracking="0.18em">Čo medzitým</MonoLabel>
            <ul style={`margin:10px 0 0 18px;color:${C.inkSoft};font-size:13.5px;line-height:1.6`}>
              <li>Pozrite si <a href="https://mentivue.sk/methodology" style={`color:${C.signal};border-bottom:1px solid ${C.signal}`}>metodológiu</a></li>
              <li>Prečítajte si posledné <a href="https://mentivue.sk/blog" style={`color:${C.signal};border-bottom:1px solid ${C.signal}`}>Pulse</a></li>
            </ul>
          </div>
          <div style={`font-size:13.5px;color:${C.inkSoft};text-align:center`}>
            Už máte účet? <a href="/login" style={`color:${C.ink};text-decoration:none;border-bottom:1px solid ${C.ink};padding-bottom:1px`}>Prihláste sa<span style="margin-left:4px">→</span></a>
          </div>
        </RightPanel>
      </AuthLayout>,
    );
  }

  return c.html(
    <AuthLayout title="Žiadosť o prístup">
      <LeftPanel>
        <LogoLockup color={C.paper} size={28} />
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px">
          <div style="display:flex;align-items:center;gap:12px">
            <PulseDot size={7} />
            <MonoLabel size={10} tracking="0.22em" color="rgba(247,244,237,0.7)">Žiadosť o prístup</MonoLabel>
          </div>
          <h2 style={`font-family:${C.fontDisplay};font-weight:400;font-size:clamp(34px, 3.4vw, 44px);line-height:1.08;letter-spacing:-0.025em;color:${C.paper};margin:0;max-width:460px`}>
            Pripojte sa k tým, ktorí už vidia<br />
            <em style={`font-style:italic;color:${C.signal};font-weight:400`}>čo AI hovorí o ich značke.</em>
          </h2>
          <div style="display:flex;align-items:center;gap:14px;padding-top:18px;border-top:1px solid rgba(247,244,237,0.18)">
            <span style="width:18px;height:1px;background:rgba(247,244,237,0.5)" />
            <MonoLabel size={10} tracking="0.18em" color="rgba(247,244,237,0.6)">Vlna I · Slovenský e-commerce</MonoLabel>
          </div>
          <div style="margin-top:auto;padding-top:32px;border-top:1px solid rgba(247,244,237,0.14)">
            <p style={`font-family:${C.fontDisplay};font-style:italic;font-weight:400;font-size:17px;line-height:1.45;color:rgba(247,244,237,0.86);margin:0;max-width:420px`}>
              "Mentivue mi za 4 týždne ukázal, kde stratím €120k ročne. Stál ma jeden pondelkový ranný kávový čas."
            </p>
            <div style="margin-top:14px">
              <MonoLabel size={9} tracking="0.22em" color="rgba(247,244,237,0.5)">Marek H. · CMO · veľký SK retailer</MonoLabel>
            </div>
          </div>
        </div>
      </LeftPanel>

      <RightPanel>
        <LogoLockup size={26} />
        <div style="display:flex;align-items:center;gap:10px">
          <span style={`width:24px;height:1px;background:${C.signal}`} />
          <MonoLabel size={10} tracking="0.18em">Voľné miesta · Vlna I: {slotsLeft}</MonoLabel>
        </div>
        <FormHead eyebrow="" title={<>Vy najprv. <em style={`font-style:italic;color:${C.signal};font-weight:400`}>Reklama nikdy.</em></>} />

        {error === 'public_email' && (
          <div class="alert err">Použite pracovný e-mail. Verejné domény (gmail.com, hotmail.com, …) nie sú povolené.</div>
        )}
        {error === 'invalid' && <div class="alert err">Vyplňte všetky povinné polia.</div>}
        {error === 'already_pending' && (
          <div class="alert err">Pre tento e-mail už evidujeme žiadosť. Ozveme sa.</div>
        )}

        <form method="post" action="/signup" style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label for="su-name" style={labelStyle}>Meno</label>
            <input id="su-name" name="name" type="text" required placeholder="Marek Horváth" value={formName} />
          </div>
          <div>
            <label for="su-email" style={labelStyle}>Pracovný e-mail</label>
            <input id="su-email" name="email" type="email" required placeholder="marek@značka.sk" value={formEmail} />
            <div style={`margin-top:8px;font-size:12px;color:${C.inkSoft};line-height:1.45`}>
              Iba pracovné e-maily. Gmail / Hotmail / ostatné verejné domény zablokované.
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <label for="su-co" style={labelStyle}>Firma</label>
              <input id="su-co" name="company" type="text" required placeholder="Slovenská sporiteľňa" value={formCompany} />
            </div>
            <div>
              <label for="su-role" style={labelStyle}>Pozícia</label>
              <select id="su-role" name="role">
                <option value="">Vyberte rolu</option>
                {roleOptions.map((r) => (
                  <option value={r} selected={r === formRole}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label for="su-brand" style={labelStyle}>Vaša značka</label>
            <input id="su-brand" name="brand" type="text" placeholder="Ktorú značku chcete sledovať?" value={formBrand} />
            <div style={`margin-top:8px;font-size:12px;color:${C.inkSoft};line-height:1.45`}>
              Voliteľné. Pomôže nám pripraviť relevantnú ukážku.
            </div>
          </div>
          <label style="display:flex;align-items:flex-start;gap:10px;margin-top:4px;font-size:13.5px;color:#1F2429;line-height:1.5;cursor:pointer">
            <input type="checkbox" name="terms" required style="margin-top:3px;width:auto" />
            <span>
              Súhlasím s <a href="https://mentivue.sk/terms" style={`color:${C.ink};border-bottom:1px solid ${C.signal};padding-bottom:1px`}>Podmienkami</a> a <a href="https://mentivue.sk/cookies" style={`color:${C.ink};border-bottom:1px solid ${C.signal};padding-bottom:1px`}>Spracovaním údajov</a>.
            </span>
          </label>

          <button
            type="submit"
            style={`background:${C.signal};color:${C.paper};border:1px solid ${C.signal};padding:18px 24px;font-size:15px;font-weight:500;font-family:${C.fontBody};display:inline-flex;justify-content:center;align-items:center;gap:10px;width:100%`}
          >
            Odoslať žiadosť <span>→</span>
          </button>
          <div style={`font-size:12.5px;color:${C.inkSoft};line-height:1.5`}>
            Odpoveď do <span style={`font-family:${C.fontMono};color:${C.ink}`}>2</span> pracovných dní. Pri schválení dostanete magic link.
          </div>
        </form>

        <div style={`margin-top:8px;height:1px;background:${C.bone}`} />
        <div style={`font-size:13.5px;color:${C.inkSoft};text-align:center`}>
          Už máte účet? <a href="/login" style={`color:${C.ink};text-decoration:none;border-bottom:1px solid ${C.ink};padding-bottom:1px`}>Prihláste sa<span style="margin-left:4px">→</span></a>
        </div>
      </RightPanel>
    </AuthLayout>,
  );
});

// ============================================================================
// POST /signup — record a request; admin approves later
// ============================================================================
auth.post('/signup', async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const company = String(body.company ?? '').trim();
  const role = String(body.role ?? '').trim();
  const brand = String(body.brand ?? '').trim() || null;
  const terms = body.terms === 'on' || body.terms === 'true';

  if (!name || !email || !company || !terms) {
    const qs = new URLSearchParams({ error: 'invalid', name, email, company, role, brand: brand ?? '' });
    return c.redirect(`/signup?${qs.toString()}`);
  }
  if (isPublicEmail(email)) {
    const qs = new URLSearchParams({ error: 'public_email', name, company, role, brand: brand ?? '' });
    return c.redirect(`/signup?${qs.toString()}`);
  }

  // Dedupe by email — only one pending request per email
  const existing = await db.query.signupRequests.findFirst({
    where: eq(signupRequests.email, email),
  });
  if (existing && existing.status === 'pending') {
    return c.redirect(`/signup?error=already_pending&email=${encodeURIComponent(email)}`);
  }

  await db.insert(signupRequests).values({
    name,
    email,
    company,
    role: role || null,
    brandSlug: brand,
    termsAcceptedAt: new Date(),
    status: 'pending',
  });

  // Notify admin (in dev: console; in prod: Resend → tomas@mentivue.sk)
  await sendEmail({
    to: 'tomas@mentivue.sk',
    subject: `Nová žiadosť o prístup: ${name} (${company})`,
    html: `<p>${name} z ${company} (${email}) žiada o prístup. Schváliť v /admin/klients.</p>`,
    text: `${name} z ${company} (${email}) žiada o prístup. Schváliť v /admin/klients.`,
  });

  return c.redirect('/signup?submitted=1');
});

export default auth;
