import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://mentivue:dev@localhost:5433/mentivue';

const migrationClient = postgres(databaseUrl, { max: 1 });
const db = drizzle(migrationClient);

console.log('▸ Applying migrations…');
await migrate(db, { migrationsFolder: './src/db/migrations' });
await migrationClient.end();
console.log('✓ Migrations applied');
