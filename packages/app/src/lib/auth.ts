// Password hashing + magic-link token generation/verification.
// Uses Bun.password (Argon2id) — no external dep.

import { createHash, randomBytes } from 'node:crypto';
import { db, klients, magicLinkTokens } from '@mentivue/shared/db';
import { and, eq, gt, isNull } from 'drizzle-orm';

export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: 'argon2id' });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await Bun.password.verify(plain, hash);
  } catch {
    return false;
  }
}

const MAGIC_LINK_TTL_MIN = 15;

export async function issueMagicLinkToken(
  klientId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex'); // 64-char URL-safe
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MIN * 60 * 1000);
  await db.insert(magicLinkTokens).values({ klientId, tokenHash, expiresAt });
  return { token, expiresAt };
}

// Atomic single-use claim. Updating with `usedAt IS NULL` guard + RETURNING
// makes concurrent verify clicks safe — only the first one gets a row back.
export async function consumeMagicLinkToken(token: string): Promise<string | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();
  const claimed = await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        gt(magicLinkTokens.expiresAt, now),
        isNull(magicLinkTokens.usedAt),
      ),
    )
    .returning({ klientId: magicLinkTokens.klientId });
  const row = claimed[0];
  if (!row) return null;
  await db
    .update(klients)
    .set({ emailVerifiedAt: now, lastLoginAt: now })
    .where(eq(klients.id, row.klientId));
  return row.klientId;
}

export async function findKlientByEmail(email: string) {
  return db.query.klients.findFirst({ where: eq(klients.email, email.toLowerCase().trim()) });
}
