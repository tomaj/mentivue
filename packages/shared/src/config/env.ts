import { z } from 'zod';

// Treats `KEY=` (empty string in .env) as absent — same as if the var were unset.
// Without this, optional .min(1) keys would fail validation for placeholders.
const optionalString = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  PERPLEXITY_API_KEY: optionalString,
  GEMINI_API_KEY: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().email().default('hello@mentivue.sk'),

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PUBLISHABLE_KEY: optionalString,

  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_PORT: z.coerce.number().default(3000),
  SITE_URL: z.string().url().default('http://localhost:4321'),

  AUTH_SECRET: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(32).optional(),
  ),

  DAILY_LLM_COST_LIMIT_USD: z.coerce.number().default(15),
  MONTHLY_LLM_COST_LIMIT_USD: z.coerce.number().default(500),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

function load(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}

// Lazy proxy — env vars are parsed on first property access, not at import time.
// Keeps tools like `drizzle-kit generate` (which only needs DATABASE_URL via
// drizzle.config.ts) from blowing up when other vars are missing.
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return load()[prop as keyof Env];
  },
});

export function getEnv(): Env {
  return load();
}
