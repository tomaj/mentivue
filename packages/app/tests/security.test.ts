// Tests for security-relevant pure helpers: signup email blocklist + sanitizeNext.
// These are pure and don't touch the DB.

import { describe, expect, test } from 'bun:test';

// Re-implement the same blocklist + sanitize logic as src/routes/auth.tsx
// (they're not exported). Keep these in sync.
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

function sanitizeNext(next: string | undefined): string {
  if (!next) return '/app/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) return '/app/dashboard';
  return next;
}

describe('isPublicEmail', () => {
  test('blocks common consumer providers', () => {
    expect(isPublicEmail('me@gmail.com')).toBe(true);
    expect(isPublicEmail('test@hotmail.com')).toBe(true);
    expect(isPublicEmail('user@yahoo.sk')).toBe(true);
    expect(isPublicEmail('a@protonmail.com')).toBe(true);
    expect(isPublicEmail('z@zoznam.sk')).toBe(true);
  });

  test('allows work email domains', () => {
    expect(isPublicEmail('marek@alza.sk')).toBe(false);
    expect(isPublicEmail('cmo@startup.io')).toBe(false);
    expect(isPublicEmail('contact@my-firma.com')).toBe(false);
  });

  test('case-insensitive', () => {
    expect(isPublicEmail('Foo@GMAIL.com')).toBe(true);
    expect(isPublicEmail('FOO@WORK.SK')).toBe(false);
  });

  test('empty / malformed email returns false (not blocking valid input downstream)', () => {
    expect(isPublicEmail('')).toBe(false);
    expect(isPublicEmail('no-at-sign')).toBe(false);
  });
});

describe('sanitizeNext (open-redirect guard)', () => {
  test('plain path passes through', () => {
    expect(sanitizeNext('/app/reports')).toBe('/app/reports');
    expect(sanitizeNext('/admin/klients')).toBe('/admin/klients');
  });

  test('undefined / empty → default dashboard', () => {
    expect(sanitizeNext(undefined)).toBe('/app/dashboard');
    expect(sanitizeNext('')).toBe('/app/dashboard');
  });

  test('protocol-relative URL → blocked (default)', () => {
    expect(sanitizeNext('//evil.example.com/phish')).toBe('/app/dashboard');
  });

  test('absolute URL → blocked', () => {
    expect(sanitizeNext('https://evil.example.com')).toBe('/app/dashboard');
    expect(sanitizeNext('http://attacker')).toBe('/app/dashboard');
  });

  test('path traversal does not bypass (still starts with /)', () => {
    // It's not the sanitizer's job to validate the path content — just that
    // it stays same-origin. Path traversal still routes to a same-origin
    // 404, which is the correct behavior here.
    expect(sanitizeNext('/../etc/passwd')).toBe('/../etc/passwd');
  });
});
