import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '../config/env.ts';
import * as schema from './schema.ts';

const env = getEnv();

const queryClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_SIZE,
});

export const db = drizzle(queryClient, { schema });
export type DbClient = typeof db;

export * from './schema.ts';
