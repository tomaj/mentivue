import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { env } from '@mentivue/shared/config';
import auth from './routes/auth.tsx';
import dashboard from './routes/dashboard.tsx';
import reportsRoutes from './routes/reports.tsx';
import settings from './routes/settings.tsx';
import admin from './routes/admin.tsx';
import {
  purgeExpiredSessions,
  requireAdmin,
  requireAuth,
  sessionMiddleware,
} from './lib/session.ts';

// Fail fast if AUTH_SECRET missing — auth would silently allow anything.
if (!env.AUTH_SECRET) {
  console.error('FATAL: AUTH_SECRET missing in env. Generate via `openssl rand -hex 32`.');
  process.exit(1);
}

const app = new Hono();

app.use('*', logger());
app.use('*', sessionMiddleware);

// Health (no auth)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

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

// 404
app.notFound((c) => c.html(`<!doctype html><meta charset="utf-8"><title>404</title><p>Not found. <a href="/">Domov</a>.</p>`, 404));

// Best-effort housekeeping on boot
purgeExpiredSessions()
  .then((n) => n > 0 && console.log(`Purged ${n} expired sessions.`))
  .catch((err) => console.error('Session purge failed:', err));

const port = Number(env.APP_PORT ?? 3000);
console.log(`🦊 Mentivue app server: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
