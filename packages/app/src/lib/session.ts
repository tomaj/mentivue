// Server-side session store. Cookie carries opaque 32-byte hex id; lookup against `sessions` table.
// Sliding expiration: lastSeenAt bumped on every authed request; absolute expiry = 30 days.

import { randomBytes } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { db, klients, sessions } from '@mentivue/shared/db';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { env } from '@mentivue/shared/config';

const COOKIE_NAME = 'mentivue_session';
const SESSION_TTL_DAYS = 30;

export type SessionKlient = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  brandId: string | null;
  tier: string | null;
  isAdmin: boolean;
};

declare module 'hono' {
  interface ContextVariableMap {
    klient: SessionKlient;
  }
}

function isProd(): boolean {
  return env.NODE_ENV === 'production';
}

export async function createSession(c: Context, klientId: string): Promise<void> {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400000);
  await db.insert(sessions).values({
    id,
    klientId,
    expiresAt,
    userAgent: c.req.header('user-agent') ?? null,
    ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
  });
  await db.update(klients).set({ lastLoginAt: new Date() }).where(eq(klients.id, klientId));
  setCookie(c, COOKIE_NAME, id, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'Lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(c: Context): Promise<void> {
  const id = getCookie(c, COOKIE_NAME);
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

async function lookupSession(sessionId: string): Promise<SessionKlient | null> {
  const row = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { klient: true },
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  // Bump lastSeenAt (best-effort, non-blocking semantics OK here)
  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, sessionId));
  const k = row.klient;
  return {
    id: k.id,
    email: k.email,
    name: k.name,
    company: k.company,
    brandId: k.brandId,
    tier: k.tier,
    isAdmin: k.isAdmin,
  };
}

// Middleware: attaches `c.get('klient')` if logged in, no-op otherwise.
export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const id = getCookie(c, COOKIE_NAME);
  if (id) {
    const klient = await lookupSession(id);
    if (klient) c.set('klient', klient);
  }
  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!c.get('klient')) {
    const redirectTo = encodeURIComponent(c.req.path);
    return c.redirect(`/login?next=${redirectTo}`);
  }
  return next();
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const k = c.get('klient');
  if (!k) return c.redirect(`/login?next=${encodeURIComponent(c.req.path)}`);
  if (!k.isAdmin) return c.text('Forbidden', 403);
  return next();
};

// Optional housekeeping: delete expired sessions. Call on boot.
export async function purgeExpiredSessions(): Promise<number> {
  const res = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning({ id: sessions.id });
  return res.length;
}
