// Centralised Zod schemas for form bodies and route params.
// Used with @hono/zod-validator so invalid input returns a 400 before reaching
// the handler, instead of being silently coerced by `String(body.x ?? '')`.

import { z } from 'zod';

// ─── Common building blocks ───
export const uuidParam = z.object({ id: z.string().uuid() });

const trimmedEmail = z.string().trim().toLowerCase().email('Invalid email').max(254);

const trimmedShortText = z.string().trim().min(1).max(200);
const optionalShortText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const passwordMin = z.string().min(8, 'Password must be at least 8 characters').max(256);
const passwordCurrent = z.string().min(1).max(256);

// `next` redirect target — only allow same-origin paths
const nextPath = z
  .string()
  .max(200)
  .optional()
  .transform((v) => {
    if (!v) return '/app/dashboard';
    if (!v.startsWith('/') || v.startsWith('//')) return '/app/dashboard';
    return v;
  });

// Checkbox arrives as 'on' / 'true' / undefined depending on browser. Treat any
// truthy non-empty value as true; require 'on' explicitly for safety.
const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.literal(true), z.literal(undefined)])
  .optional()
  .transform((v) => v === 'on' || v === 'true' || v === true);

// ─── Auth ───
export const loginSchema = z.object({
  email: trimmedEmail,
  password: passwordCurrent,
  next: nextPath,
});

export const magicLinkRequestSchema = z.object({
  email: trimmedEmail,
  next: nextPath,
});

export const signupSchema = z.object({
  name: trimmedShortText,
  email: trimmedEmail,
  company: trimmedShortText,
  role: optionalShortText,
  brand: optionalShortText,
  terms: checkbox,
});

export const passwordChangeSchema = z.object({
  current_password: passwordCurrent,
  new_password: passwordMin,
});

// ─── Admin: klient create + reject reason ───
export const createKlientSchema = z.object({
  email: trimmedEmail,
  password: passwordMin,
  name: optionalShortText,
  company: optionalShortText,
  tier: z.enum(['watch', 'pro', 'enterprise']).optional().or(z.literal('')),
  brand_slug: z.string().trim().max(80).optional().or(z.literal('')),
});

export const rejectSignupSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

// ─── Reports ───
export const reportTypeQuery = z.object({
  type: z.enum(['pulse', 'action', 'audit', 'industry']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkRequestSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type CreateKlientInput = z.infer<typeof createKlientSchema>;
