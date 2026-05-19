import { env } from '@mentivue/shared/config';
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { deepHealth } from './lib/health.ts';
import { logger as appLogger, requestLogger } from './lib/logger.ts';
import { initSentry, sentryMiddleware } from './lib/sentry.ts';
import {
  purgeExpiredSessions,
  requireAdmin,
  requireAuth,
  sessionMiddleware,
} from './lib/session.ts';
import { startSchedulerLoop } from './reports/scheduler.ts';
import admin from './routes/admin.tsx';
import approvals from './routes/approvals.tsx';
import auth from './routes/auth.tsx';
import dashboard from './routes/dashboard.tsx';
import reportsRoutes from './routes/reports.tsx';
import settings from './routes/settings.tsx';

// Fail fast if AUTH_SECRET missing — auth would silently allow anything.
if (!env.AUTH_SECRET) {
  appLogger.fatal('AUTH_SECRET missing. Generate via `openssl rand -hex 32`.');
  process.exit(1);
}

initSentry();

const app = new Hono();

// Security headers on every response.
// HSTS only fires on HTTPS — it's a no-op locally.
app.use('*', async (c, next) => {
  await next();
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  // CSP — app is server-rendered JSX with inline <style> + Google Fonts + HTMX from unpkg.
  // We do NOT permit unsafe-inline for scripts; HTMX is loaded from unpkg as an external script.
  // Violations are POSTed to /csp-report so we hear about regressions instead of guessing.
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self'",
      "object-src 'none'",
      'report-uri /csp-report',
      'report-to csp-endpoint',
    ].join('; '),
  );
  c.header('Reporting-Endpoints', 'csp-endpoint="/csp-report"');
});

// CSRF: hono/csrf rejects state-changing requests (POST/PATCH/PUT/DELETE) whose
// Origin header does not match an allowed origin. Same-origin form submissions
// from a browser always send Origin, so this blocks cross-site form posts.
// APP_URL host is the canonical allowed origin; the regex below also covers
// the dev URL forms (http://localhost:<port>, http://127.0.0.1:<port>).
const appOrigin = new URL(env.APP_URL).origin;
app.use(
  '*',
  csrf({
    origin: (origin) => {
      if (!origin) return false;
      if (origin === appOrigin) return true;
      return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    },
  }),
);

app.use('*', requestLogger);
app.use('*', sentryMiddleware);
app.use('*', sessionMiddleware);

// Liveness — process-alive only. No deps; safe for high-frequency probes.
app.get('/health/live', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  }),
);

// Deep readiness — pings DB + Redis. Returns 503 if any dep is down so load
// balancers can route around the instance without taking the process down.
app.get('/health', async (c) => {
  const report = await deepHealth();
  return c.json(report, report.status === 'ok' ? 200 : 503);
});

// CSP violation reports. Browsers POST either application/csp-report (legacy
// report-uri) or application/reports+json (Reporting-Endpoints). We log both
// at warn level — high volume from a single source indicates a real regression.
app.post('/csp-report', async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const log = c.get('log') ?? appLogger;
    log.warn({ cspReport: body, ua: c.req.header('user-agent') }, 'CSP violation');
  } catch {
    // Browsers occasionally send malformed payloads — swallow rather than 500.
  }
  return c.body(null, 204);
});

// Root → dashboard or login
app.get('/', (c) => (c.get('klient') ? c.redirect('/app/dashboard') : c.redirect('/login')));

// Public auth pages
app.route('/', auth);

// Authed customer pages
app.use('/app/*', requireAuth);
app.route('/', dashboard);
app.route('/', reportsRoutes);
app.route('/', settings);

// Admin pages
app.use('/admin/*', requireAdmin);
app.route('/', admin);
app.route('/', approvals);

// 404
app.notFound((c) =>
  c.html(
    `<!doctype html><meta charset="utf-8"><title>404</title><p>Not found. <a href="/">Domov</a>.</p>`,
    404,
  ),
);

// Best-effort housekeeping on boot
purgeExpiredSessions()
  .then((n) => n > 0 && appLogger.info({ n }, 'Purged expired sessions'))
  .catch((err) => appLogger.error({ err }, 'Session purge failed'));

// Auto-scheduler — generates pending reports per klient tier every 6h.
// Skipped in test env. First tick fires ~5s after boot (non-blocking).
if (env.NODE_ENV !== 'test') {
  startSchedulerLoop();
}

const port = Number(env.APP_PORT ?? 3000);
appLogger.info({ port }, `🦊 Mentivue app server: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
