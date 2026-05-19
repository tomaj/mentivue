// Pure-function auth tests — password hash/verify + magic-link token issue/consume
// against a real test DB. Run: cd packages/app && bun test
//
// These integration tests require docker stack + migrations applied. They
// create unique test klients per run and clean up at end.

import { afterAll, describe, expect, test } from 'bun:test';
import { db, klients, magicLinkTokens } from '@mentivue/shared/db';
import { eq, sql } from 'drizzle-orm';
import {
  consumeMagicLinkToken,
  hashPassword,
  issueMagicLinkToken,
  verifyPassword,
} from '../src/lib/auth.ts';

const TEST_PREFIX = `auth-test-${Date.now()}`;

async function makeKlient(label: string): Promise<string> {
  const [row] = await db
    .insert(klients)
    .values({
      email: `${TEST_PREFIX}-${label}@example.test`,
      name: label,
      status: 'active',
    })
    .returning({ id: klients.id });
  if (!row) throw new Error('failed to insert test klient');
  return row.id;
}

afterAll(async () => {
  // Delete all test klients (cascades to sessions + magic_link_tokens)
  await db.execute(sql`DELETE FROM klients WHERE email LIKE ${`${TEST_PREFIX}-%`}`);
});

describe('password hash / verify', () => {
  test('hash output is bcrypt/argon2 prefixed and longer than 50 chars', async () => {
    const h = await hashPassword('correct-horse-battery-staple');
    expect(h.length).toBeGreaterThan(50);
    expect(h).toMatch(/^\$argon2id\$/);
  });

  test('verify accepts correct password and rejects others', async () => {
    const h = await hashPassword('secret-pw-1234');
    expect(await verifyPassword('secret-pw-1234', h)).toBe(true);
    expect(await verifyPassword('different-pw', h)).toBe(false);
    expect(await verifyPassword('', h)).toBe(false);
  });

  test('verifyPassword swallows invalid hash format and returns false', async () => {
    expect(await verifyPassword('whatever', 'not-a-valid-hash')).toBe(false);
  });
});

describe('magic link tokens', () => {
  test('issue then consume — happy path returns klientId once', async () => {
    const klientId = await makeKlient('happy');
    const { token, expiresAt } = await issueMagicLinkToken(klientId);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    const result = await consumeMagicLinkToken(token);
    expect(result).toBe(klientId);
  });

  test('replay — second consume returns null (single-use)', async () => {
    const klientId = await makeKlient('replay');
    const { token } = await issueMagicLinkToken(klientId);
    const first = await consumeMagicLinkToken(token);
    expect(first).toBe(klientId);
    const second = await consumeMagicLinkToken(token);
    expect(second).toBeNull();
  });

  test('expired token — consume returns null and does not flip emailVerified', async () => {
    const klientId = await makeKlient('expired');
    const { token } = await issueMagicLinkToken(klientId);
    // Force-expire it
    await db
      .update(magicLinkTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(magicLinkTokens.klientId, klientId));
    const result = await consumeMagicLinkToken(token);
    expect(result).toBeNull();
  });

  test('invalid token (random hex) — returns null', async () => {
    const garbage = 'a'.repeat(64);
    const result = await consumeMagicLinkToken(garbage);
    expect(result).toBeNull();
  });

  test('race — concurrent consumes only one wins', async () => {
    const klientId = await makeKlient('race');
    const { token } = await issueMagicLinkToken(klientId);
    const [r1, r2, r3] = await Promise.all([
      consumeMagicLinkToken(token),
      consumeMagicLinkToken(token),
      consumeMagicLinkToken(token),
    ]);
    const wins = [r1, r2, r3].filter((x) => x !== null);
    expect(wins.length).toBe(1);
    expect(wins[0]).toBe(klientId);
  });
});
