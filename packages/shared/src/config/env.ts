import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_URL: z.string().url(),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('hello@mentivue.sk'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_PORT: z.coerce.number().default(3000),
  SITE_URL: z.string().url().default('http://localhost:4321'),

  AUTH_SECRET: z.string().min(32),

  DAILY_LLM_COST_LIMIT_USD: z.coerce.number().default(15),
  MONTHLY_LLM_COST_LIMIT_USD: z.coerce.number().default(500),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
