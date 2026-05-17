#!/usr/bin/env bash
# ==============================================================================
# MENTIVUE MONOREPO SETUP
# ==============================================================================
# pnpm workspaces monorepo setup for solo developer + Claude Code workflow.
#
# What this creates:
#   - pnpm workspace with 4 packages: site, app, workers, shared
#   - TypeScript configuration (strict, monorepo paths)
#   - Biome for linting + formatting (faster than ESLint+Prettier)
#   - Docker compose for local Postgres + Redis
#   - Drizzle ORM setup with initial migration scaffolding
#   - Astro 5 marketing site
#   - Hono server for app
#   - Bun + BullMQ workers
#   - All env variables templated
#
# Usage:
#   chmod +x setup-monorepo.sh
#   ./setup-monorepo.sh
#
# Requirements:
#   - Bun (https://bun.sh) installed
#   - pnpm (https://pnpm.io) installed: `npm install -g pnpm`
#   - Docker + Docker Compose (for local DB)
#   - Git
#
# After running:
#   1. cp .env.example .env (and fill in API keys)
#   2. docker compose up -d (start Postgres + Redis)
#   3. pnpm dev (start all services in dev mode)
# ==============================================================================

set -e  # exit on error

PROJECT_NAME="mentivue"

# Color output for status messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}▸${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ==============================================================================
# 0. PRE-FLIGHT CHECKS
# ==============================================================================

log "Checking prerequisites..."

command -v pnpm >/dev/null 2>&1 || error "pnpm is not installed. Run: npm install -g pnpm"
command -v bun >/dev/null 2>&1 || error "bun is not installed. Visit: https://bun.sh"
command -v docker >/dev/null 2>&1 || warn "docker is not installed - you'll need it for local DB"
command -v git >/dev/null 2>&1 || error "git is not installed"

success "Prerequisites checked"

# ==============================================================================
# 1. CREATE PROJECT STRUCTURE
# ==============================================================================

log "Creating project structure..."

if [ -d "$PROJECT_NAME" ]; then
  error "Directory $PROJECT_NAME already exists. Remove it first or run from different location."
fi

mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Initialize git
git init -q

# Create folder structure
mkdir -p docs
mkdir -p prompts
mkdir -p infra
mkdir -p tests/{agents,api,fixtures}
mkdir -p packages/{site,app,workers,shared}
mkdir -p packages/site/src/{pages,components,content,layouts,styles}
mkdir -p packages/site/public
mkdir -p packages/app/src/{routes,components,middleware,public}
mkdir -p packages/app/src/routes/{auth,dashboard,reports,alerts,settings}
mkdir -p packages/workers/src/{agents,jobs}
mkdir -p packages/shared/src/{db,llm,types,utils,config}
mkdir -p packages/shared/src/db/migrations

success "Folder structure created"

# ==============================================================================
# 2. ROOT package.json
# ==============================================================================

log "Creating root package.json..."

cat > package.json <<'EOF'
{
  "name": "mentivue",
  "version": "0.1.0",
  "private": true,
  "description": "Mentivue - AI search visibility research for Slovak e-commerce brands",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm -r --parallel --stream dev",
    "dev:site": "pnpm --filter @mentivue/site dev",
    "dev:app": "pnpm --filter @mentivue/app dev",
    "dev:workers": "pnpm --filter @mentivue/workers dev",
    "build": "pnpm -r build",
    "build:site": "pnpm --filter @mentivue/site build",
    "build:app": "pnpm --filter @mentivue/app build",
    "build:workers": "pnpm --filter @mentivue/workers build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:generate": "pnpm --filter @mentivue/shared db:generate",
    "db:migrate": "pnpm --filter @mentivue/shared db:migrate",
    "db:studio": "pnpm --filter @mentivue/shared db:studio",
    "db:seed": "pnpm --filter @mentivue/shared db:seed",
    "docker:up": "docker compose -f infra/docker-compose.yml up -d",
    "docker:down": "docker compose -f infra/docker-compose.yml down",
    "docker:logs": "docker compose -f infra/docker-compose.yml logs -f",
    "deploy:site": "pnpm --filter @mentivue/site deploy",
    "deploy:app": "bash infra/deploy.sh app",
    "deploy:workers": "bash infra/deploy.sh workers"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0"
  }
}
EOF

success "Root package.json created"

# ==============================================================================
# 3. pnpm-workspace.yaml
# ==============================================================================

log "Creating pnpm-workspace.yaml..."

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - 'packages/*'
EOF

success "pnpm-workspace.yaml created"

# ==============================================================================
# 4. ROOT tsconfig.json
# ==============================================================================

log "Creating root tsconfig.json..."

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@mentivue/shared": ["./packages/shared/src/index.ts"],
      "@mentivue/shared/*": ["./packages/shared/src/*"]
    }
  },
  "exclude": ["node_modules", "**/dist", "**/.astro", "**/build"]
}
EOF

success "Root tsconfig.json created"

# ==============================================================================
# 5. Biome config (linter + formatter)
# ==============================================================================

log "Creating Biome config..."

cat > biome.json <<'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "node_modules",
      "dist",
      ".astro",
      "build",
      "coverage",
      "*.lock",
      "*.lockb",
      "pnpm-lock.yaml"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "error",
        "useNodejsImportProtocol": "error"
      },
      "suspicious": {
        "noConsoleLog": "warn",
        "noExplicitAny": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
EOF

success "Biome config created"

# ==============================================================================
# 6. .gitignore
# ==============================================================================

log "Creating .gitignore..."

cat > .gitignore <<'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.astro/
.next/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Logs
logs/
*.log
npm-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db

# Test
coverage/
.nyc_output/

# Cache
.turbo/
.cache/

# Database
*.db
*.sqlite

# OS
.DS_Store
EOF

success ".gitignore created"

# ==============================================================================
# 7. .env.example
# ==============================================================================

log "Creating .env.example..."

cat > .env.example <<'EOF'
# ==============================================================================
# MENTIVUE ENVIRONMENT VARIABLES
# ==============================================================================
# Copy this file to .env and fill in real values.
# .env is gitignored, never commit it.

# ---- ENVIRONMENT ----
NODE_ENV=development
LOG_LEVEL=debug

# ---- DATABASE ----
# Local dev: docker compose provides these defaults
DATABASE_URL=postgresql://mentivue:dev@localhost:5432/mentivue
DATABASE_POOL_SIZE=10

# ---- REDIS (BullMQ) ----
REDIS_URL=redis://localhost:6379

# ---- LLM PROVIDERS ----
# Get keys from respective dashboards
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...

# ---- EMAIL (Resend) ----
RESEND_API_KEY=re_...
EMAIL_FROM=hello@mentivue.sk

# ---- STRIPE ----
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# ---- STORAGE (Cloudflare R2) ----
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=mentivue-reports

# ---- APP CONFIG ----
APP_URL=http://localhost:3000
APP_PORT=3000
SITE_URL=http://localhost:4321

# ---- AUTH ----
AUTH_SECRET=replace-with-32-char-random-string-here
SESSION_COOKIE_NAME=mentivue_session

# ---- OBSERVABILITY ----
SENTRY_DSN=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# ---- COST GUARDRAILS ----
DAILY_LLM_COST_LIMIT_USD=15
MONTHLY_LLM_COST_LIMIT_USD=500
EOF

success ".env.example created"
cp .env.example .env
success ".env created (fill in real values!)"

# ==============================================================================
# 8. Docker Compose (Postgres + Redis)
# ==============================================================================

log "Creating Docker Compose config..."

cat > infra/docker-compose.yml <<'EOF'
# Local development infrastructure
# Run: docker compose -f infra/docker-compose.yml up -d

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: mentivue-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: mentivue
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: mentivue
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mentivue"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mentivue-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

success "Docker Compose created"

# ==============================================================================
# 9. SHARED package (DB, LLM clients, types)
# ==============================================================================

log "Creating shared package..."

cat > packages/shared/package.json <<'EOF'
{
  "name": "@mentivue/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./db": "./src/db/index.ts",
    "./db/schema": "./src/db/schema.ts",
    "./llm": "./src/llm/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts",
    "./config": "./src/config/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run src/db/seed.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.34.0",
    "@google/generative-ai": "^0.21.0",
    "drizzle-orm": "^0.38.0",
    "openai": "^4.77.0",
    "pg": "^8.13.1",
    "postgres": "^3.4.5",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "drizzle-kit": "^0.30.0",
    "typescript": "^5.7.0"
  }
}
EOF

cat > packages/shared/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
EOF

# Shared index
cat > packages/shared/src/index.ts <<'EOF'
// Main exports for @mentivue/shared
export * from './db/index.ts';
export * from './types/index.ts';
export * from './utils/index.ts';
export * from './config/index.ts';
EOF

# Config (env validation)
cat > packages/shared/src/config/env.ts <<'EOF'
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // LLM
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  PERPLEXITY_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('hello@mentivue.sk'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // App
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_PORT: z.coerce.number().default(3000),
  SITE_URL: z.string().url().default('http://localhost:4321'),
  
  // Auth
  AUTH_SECRET: z.string().min(32),
  
  // Cost guardrails
  DAILY_LLM_COST_LIMIT_USD: z.coerce.number().default(15),
  MONTHLY_LLM_COST_LIMIT_USD: z.coerce.number().default(500),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
EOF

cat > packages/shared/src/config/index.ts <<'EOF'
export { env, type Env } from './env.ts';
EOF

# DB schema (initial - extend per ANALYSIS.md)
cat > packages/shared/src/db/schema.ts <<'EOF'
import { pgTable, uuid, text, timestamp, integer, real, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Verticals - allow multi-vertical from Day 1
export const verticals = pgTable('verticals', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  category: text('category').notNull(),
  language: text('language').notNull().default('sk'),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Brands
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  verticalId: uuid('vertical_id').notNull().references(() => verticals.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  aliases: jsonb('aliases').$type<string[]>(),
  website: text('website'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  verticalSlugIdx: index('brands_vertical_slug_idx').on(table.verticalId, table.slug),
}));

// Prompts
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  verticalId: uuid('vertical_id').notNull().references(() => verticals.id),
  externalId: text('external_id').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  language: text('language').notNull().default('sk'),
  text: text('text').notNull(),
  frequencyTier: text('frequency_tier').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  verticalCategoryIdx: index('prompts_vertical_category_idx').on(table.verticalId, table.category),
  externalIdIdx: index('prompts_external_id_idx').on(table.externalId),
}));

// LLM calls (raw data)
export const llmCalls = pgTable('llm_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  rawResponse: text('raw_response').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: real('cost_usd'),
  latencyMs: integer('latency_ms'),
  callType: text('call_type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  promptProviderIdx: index('llm_calls_prompt_provider_idx').on(table.promptId, table.provider),
  createdAtIdx: index('llm_calls_created_at_idx').on(table.createdAt),
}));

// Brand mentions (extracted from LLM responses)
export const brandMentions = pgTable('brand_mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  llmCallId: uuid('llm_call_id').notNull().references(() => llmCalls.id),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  position: integer('position'),
  sentiment: real('sentiment'),
  context: text('context'),
  confidence: real('confidence'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  brandIdx: index('brand_mentions_brand_idx').on(table.brandId),
  llmCallIdx: index('brand_mentions_llm_call_idx').on(table.llmCallId),
}));

// Klients (subscribers)
export const klients = pgTable('klients', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  company: text('company'),
  brandId: uuid('brand_id').references(() => brands.id),
  tier: text('tier'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Reports (generated PDFs)
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  klientId: uuid('klient_id').references(() => klients.id),
  brandId: uuid('brand_id').references(() => brands.id),
  verticalId: uuid('vertical_id').references(() => verticals.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  storageUrl: text('storage_url'),
  metadata: jsonb('metadata'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  klientTypeIdx: index('reports_klient_type_idx').on(table.klientId, table.type),
}));

// Relations
export const brandsRelations = relations(brands, ({ one, many }) => ({
  vertical: one(verticals, { fields: [brands.verticalId], references: [verticals.id] }),
  mentions: many(brandMentions),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  vertical: one(verticals, { fields: [prompts.verticalId], references: [verticals.id] }),
  llmCalls: many(llmCalls),
}));

export const llmCallsRelations = relations(llmCalls, ({ one, many }) => ({
  prompt: one(prompts, { fields: [llmCalls.promptId], references: [prompts.id] }),
  mentions: many(brandMentions),
}));
EOF

cat > packages/shared/src/db/index.ts <<'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.ts';
import * as schema from './schema.ts';

const queryClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_SIZE,
});

export const db = drizzle(queryClient, { schema });
export * from './schema.ts';
export type DbClient = typeof db;
EOF

# Drizzle config
cat > packages/shared/drizzle.config.ts <<'EOF'
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://mentivue:dev@localhost:5432/mentivue',
  },
} satisfies Config;
EOF

# Migration runner
cat > packages/shared/src/db/migrate.ts <<'EOF'
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.ts';

const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: './src/db/migrations' });
await migrationClient.end();
console.log('✓ Migrations applied');
EOF

# Seed file
cat > packages/shared/src/db/seed.ts <<'EOF'
import { db, verticals, brands } from './index.ts';

console.log('Seeding initial data...');

// Insert Slovak Electronics vertical
const [vertical] = await db.insert(verticals).values({
  slug: 'sk-electronics',
  name: 'Slovak Electronics',
  country: 'SK',
  category: 'electronics',
  language: 'sk',
}).returning();

// Insert 15 brands
const brandData = [
  { slug: 'alza', name: 'Alza.sk', website: 'https://www.alza.sk', aliases: ['Alza', 'alza.sk'] },
  { slug: 'datart', name: 'Datart', website: 'https://www.datart.sk', aliases: ['Datart', 'datart.sk'] },
  { slug: 'nay', name: 'Nay', website: 'https://www.nay.sk', aliases: ['Nay', 'NAY', 'nay.sk'] },
  { slug: 'planeo', name: 'Planeo', website: 'https://www.planeo.sk', aliases: ['Planeo', 'Planeo Elektro'] },
  { slug: 'andrea-shop', name: 'Andrea Shop', website: 'https://www.andreashop.sk', aliases: ['Andrea Shop', 'AndreaShop'] },
  { slug: 'hej-sk', name: 'Hej.sk', website: 'https://www.hej.sk', aliases: ['Hej.sk', 'Hej'] },
  { slug: 'okay', name: 'Okay', website: 'https://www.okay.sk', aliases: ['Okay', 'OKAY'] },
  { slug: 'mall', name: 'Mall', website: 'https://www.mall.sk', aliases: ['Mall.sk', 'Mall'] },
  { slug: 'electro-world', name: 'Electro World', website: 'https://www.electroworld.sk', aliases: ['Electro World', 'ElectroWorld'] },
  { slug: 'istores', name: 'iStores', website: 'https://www.istores.sk', aliases: ['iStores', 'iStores.sk'] },
  { slug: 'mironet', name: 'Mironet', website: 'https://www.mironet.sk', aliases: ['Mironet'] },
  { slug: 'megapixel', name: 'Megapixel', website: 'https://www.megapixel.sk', aliases: ['Megapixel'] },
  { slug: 'tpd', name: 'TPD', website: 'https://www.tpd.sk', aliases: ['TPD'] },
  { slug: 'faxcopy', name: 'Faxcopy', website: 'https://www.faxcopy.sk', aliases: ['Faxcopy'] },
  { slug: 'notebooky-sk', name: 'Notebooky.sk', website: 'https://www.notebooky.sk', aliases: ['Notebooky.sk', 'Notebooky'] },
];

await db.insert(brands).values(
  brandData.map(b => ({ ...b, verticalId: vertical!.id }))
);

console.log(`✓ Seeded vertical "${vertical!.name}" with ${brandData.length} brands`);
process.exit(0);
EOF

# LLM clients
cat > packages/shared/src/llm/anthropic.ts <<'EOF'
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.ts';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface ClaudeCallOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}> {
  const response = await client.messages.create({
    model: opts.model ?? 'claude-haiku-4-5-20251001',
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt }],
  });
  
  const text = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { text: string }).text)
    .join('');
  
  const inputCost = (response.usage.input_tokens / 1_000_000) * 1.0;
  const outputCost = (response.usage.output_tokens / 1_000_000) * 5.0;
  
  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd: inputCost + outputCost,
  };
}
EOF

cat > packages/shared/src/llm/index.ts <<'EOF'
export { callClaude, type ClaudeCallOptions } from './anthropic.ts';
EOF

# Types
cat > packages/shared/src/types/index.ts <<'EOF'
export type Tier = 'watch' | 'pro' | 'enterprise';
export type ReportType = 'industry' | 'audit' | 'action' | 'pulse';
export type ProviderName = 'anthropic' | 'openai' | 'perplexity' | 'gemini';
export type FrequencyTier = 'daily' | 'weekly' | 'monthly';

export interface MentivueIndexScore {
  brandSlug: string;
  brandName: string;
  score: number;
  rank: number;
  deltaWow: number;
}
EOF

# Utils
cat > packages/shared/src/utils/format.ts <<'EOF'
// Slovak number formatting helpers
const NBSP = '\u00A0'; // non-breaking space

export function formatNumber(n: number): string {
  // SK format: 1 176 (not 1,176)
  return n.toLocaleString('sk-SK').replace(/\s/g, NBSP);
}

export function formatCurrency(n: number, currency: 'EUR' | 'USD' = 'EUR'): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace('.', ',')}${NBSP}%`;
}

export function formatDelta(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  return `${sign}${abs}`;
}
EOF

cat > packages/shared/src/utils/slugify.ts <<'EOF'
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
EOF

cat > packages/shared/src/utils/index.ts <<'EOF'
export * from './format.ts';
export * from './slugify.ts';
EOF

success "Shared package created"

# ==============================================================================
# 10. SITE package (Astro)
# ==============================================================================

log "Creating site package (Astro)..."

cat > packages/site/package.json <<'EOF'
{
  "name": "@mentivue/site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "deploy": "wrangler pages deploy dist"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.1",
    "@astrojs/tailwind": "^5.1.4",
    "@mentivue/shared": "workspace:*",
    "astro": "^5.1.0",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0",
    "wrangler": "^3.99.0"
  }
}
EOF

cat > packages/site/astro.config.mjs <<'EOF'
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mentivue.sk',
  integrations: [tailwind(), sitemap()],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    server: {
      port: 4321,
    },
  },
});
EOF

cat > packages/site/tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0E1116', soft: '#1F2429' },
        paper: { DEFAULT: '#F7F4ED', pure: '#FFFFFF' },
        bone: '#EBE5D7',
        depth: '#1B3A4B',
        signal: { DEFAULT: '#FF5B3A', soft: '#FFE8E0' },
        positive: '#2D6A4F',
        negative: '#C73E1D',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
} satisfies Config;
EOF

cat > packages/site/tsconfig.json <<'EOF'
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mentivue/shared": ["../shared/src/index.ts"],
      "@mentivue/shared/*": ["../shared/src/*"],
      "~/*": ["./src/*"]
    }
  }
}
EOF

cat > packages/site/src/pages/index.astro <<'EOF'
---
import '../styles/global.css';
---
<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mentivue — Výskum pre éru AI vyhľadávania</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body class="bg-paper text-ink font-body">
  <main class="container mx-auto px-6 py-20">
    <h1 class="font-display text-6xl tracking-tight">
      Čo AI hovorí o <em class="text-signal not-italic font-medium italic">vašej značke</em>.
    </h1>
    <p class="mt-6 max-w-xl text-lg text-ink-soft">
      Týždenne meriame ako ChatGPT, Claude, Perplexity a Gemini odpovedajú na reálne nákupné otázky vašich zákazníkov.
    </p>
  </main>
</body>
</html>
EOF

cat > packages/site/src/styles/global.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { -webkit-font-smoothing: antialiased; }
  body { font-feature-settings: 'ss01'; }
}
EOF

success "Site package created"

# ==============================================================================
# 11. APP package (Hono server)
# ==============================================================================

log "Creating app package (Hono server)..."

cat > packages/app/package.json <<'EOF'
{
  "name": "@mentivue/app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/server.ts",
    "build": "bun build src/server.ts --target=bun --outdir=dist",
    "start": "bun run dist/server.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.7",
    "@mentivue/shared": "workspace:*",
    "hono": "^4.6.14"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0"
  }
}
EOF

cat > packages/app/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["bun-types"],
    "rootDir": "./src",
    "outDir": "./dist",
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  },
  "include": ["src/**/*"]
}
EOF

cat > packages/app/src/server.ts <<'EOF'
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { env } from '@mentivue/shared/config';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => c.text('Mentivue app server running.'));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = env.APP_PORT;
console.log(`🦊 Mentivue app server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
EOF

success "App package created"

# ==============================================================================
# 12. WORKERS package (Bun + BullMQ)
# ==============================================================================

log "Creating workers package..."

cat > packages/workers/package.json <<'EOF'
{
  "name": "@mentivue/workers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --target=bun --outdir=dist",
    "start": "bun run dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mentivue/shared": "workspace:*",
    "bullmq": "^5.34.0",
    "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0"
  }
}
EOF

cat > packages/workers/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["bun-types"],
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
EOF

cat > packages/workers/src/index.ts <<'EOF'
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '@mentivue/shared/config';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log('⚙️  Mentivue workers starting...');

// Main queue for all background jobs
export const queue = new Queue('mentivue-jobs', { connection });

// Worker processor
const worker = new Worker(
  'mentivue-jobs',
  async (job) => {
    console.log(`Processing job: ${job.name}`);
    
    switch (job.name) {
      case 'daily-collection':
        // TODO: Run daily LLM data collection
        return { status: 'collected', timestamp: new Date().toISOString() };
        
      case 'generate-pulse':
        // TODO: Generate weekly Pulse newsletter
        return { status: 'generated', timestamp: new Date().toISOString() };
        
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`✓ Job ${job.name} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`✗ Job ${job?.name} failed:`, err);
});

console.log('✓ Workers initialized. Waiting for jobs...');
EOF

success "Workers package created"

# ==============================================================================
# 13. CLAUDE.md (navigation guide for AI)
# ==============================================================================

log "Creating CLAUDE.md navigation guide..."

cat > CLAUDE.md <<'EOF'
# Mentivue - Project Navigation for Claude Code

## What this project is

B2B research firm measuring AI search visibility for Slovak e-commerce brands.
Sells PDF reports (€2 990 Audit, €299 Industry) and subscriptions (€490-4 990/mes).

## Read these first

Before any task, read relevant docs in `docs/`:
- `PRD.md` - product strategy, decisions, scope
- `METRICS.md` - per-metric formulas and SQL
- `ANALYSIS.md` - data pipeline architecture
- `AUTOMATION.md` - 12 AI agents specifications
- `VALIDATION.md` - quality control methods (M1-M22)
- `READINESS_AUDIT.md` - what's ready, what's missing
- `MONOREPO.md` - this folder structure rationale

## Where things live

### Adding a new metric
1. Schema → `packages/shared/src/db/schema.ts`
2. Migration → `pnpm db:generate`
3. Query → `packages/shared/src/db/queries.ts`
4. Agent logic → `packages/workers/src/agents/`
5. Display → `packages/app/src/components/` or `packages/site/src/components/`

### Adding a new vertical (e.g. banking)
1. Prompts → `prompts/sk-banking.yaml`
2. Seed → `packages/shared/src/db/seed.ts` (extend)
3. Update queries to filter by `vertical_id`
4. Add brand cards → `packages/site/src/pages/brand/[slug].astro`

### Adding a new agent
1. Definition → `packages/workers/src/agents/[name].ts`
2. Register in worker → `packages/workers/src/index.ts`
3. Schedule cron → BullMQ repeat option

## Tech stack rules

- **TypeScript only.** No JavaScript files.
- **Bun runtime** for app and workers. Not Node.js.
- **pnpm workspaces** for monorepo. Not Turborepo (yet).
- **Drizzle ORM** for all DB access. No raw SQL except in queries.ts.
- **Zod** for all input validation.
- **Astro** for marketing site. Islands only when needed.
- **Hono server-rendered** for app. JSX rendered on server.
- **HTMX** for app interactivity. No client-side state management.
- **Biome** for lint + format. Not ESLint+Prettier.

## Import patterns

### From shared package
```typescript
import { db, brands } from '@mentivue/shared/db';
import { env } from '@mentivue/shared/config';
import { callClaude } from '@mentivue/shared/llm';
import { formatNumber } from '@mentivue/shared/utils';
import type { Tier } from '@mentivue/shared/types';
```

### Within same package
Use relative imports:
```typescript
import { someHelper } from './lib/helper.ts';
```

## Code patterns

### LLM calls
Always use shared clients:
```typescript
import { callClaude } from '@mentivue/shared/llm';
const result = await callClaude({ 
  prompt: 'Analyze this...',
  model: 'claude-haiku-4-5-20251001' 
});
```

### DB queries
Always use Drizzle:
```typescript
import { db, brands } from '@mentivue/shared/db';
import { eq } from 'drizzle-orm';

const brand = await db.select().from(brands).where(eq(brands.slug, slug));
```

### Slovak number formatting
Always use helper:
```typescript
import { formatNumber } from '@mentivue/shared/utils';
formatNumber(1176); // "1 176" (SK with non-breaking space)
```

### Env access
Never `process.env.X` directly. Always:
```typescript
import { env } from '@mentivue/shared/config';
const apiKey = env.ANTHROPIC_API_KEY;
```

## Don'ts

- ❌ No client-side React in app (server-render with HTMX)
- ❌ No Next.js (we use Hono + Bun for app, Astro for site)
- ❌ No raw SQL outside `packages/shared/src/db/queries.ts`
- ❌ No env vars accessed directly (use `@mentivue/shared/config`)
- ❌ No new dependencies without checking with Tomas first
- ❌ No `any` types (use `unknown` if truly unknown)
- ❌ No JavaScript files (TypeScript only)
- ❌ No `--legacy-peer-deps` or workarounds (fix root causes)

## Brand voice (for any user-facing copy)

- Slovak primary language for marketing site (target = SK CMOs)
- Vykanie (vy/váš), never tykanie (ty/tvoj) - B2B respect
- Editorial autorita - like Trend, SME Tech, FT
- No startup-speak ("revolučný", "nakopnite", "boost")
- No literal EN translations ("share of voice" stays EN, "sentiment" stays EN)
- Numbers in SK format: 1 176 (not 1,176)

## When unsure - ask Tomas first

Before:
- Adding new dependencies
- Major refactoring
- Changing public APIs
- Modifying pricing or product copy
- Schema changes that require data migration
- Adding new vertical or geographic market

## Current focus

Week 1-4 build per `AUTOMATION.md` priorities:
1. Foundation (DB, hosting, billing infra)
2. Report Writer + Pulse Writer agents
3. Anomaly Watcher
4. Klient Onboarding flow
5. Sales agents + quality patterns
6. Tomas Command Center dashboard

Read `PHASED_GTM.md` for full launch timeline.

## Build/test commands

```bash
pnpm dev              # All services in parallel
pnpm dev:site         # Just marketing site
pnpm dev:app          # Just app server
pnpm dev:workers      # Just workers

pnpm typecheck        # TypeScript check across all packages
pnpm lint             # Biome lint check
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format all files

pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio (DB browser)
pnpm db:seed          # Seed initial data

pnpm docker:up        # Start local Postgres + Redis
pnpm docker:down      # Stop containers
```
EOF

success "CLAUDE.md created"

# ==============================================================================
# 14. README.md
# ==============================================================================

log "Creating README.md..."

cat > README.md <<'EOF'
# Mentivue

> Výskum pre éru AI vyhľadávania. Research for the AI search era.

Mentivue measures how AI search engines (ChatGPT, Claude, Perplexity, Gemini)
talk about Slovak e-commerce brands. We sell quarterly Industry Reports (€299),
Per-Brand Audits (€2 990), and Pro subscriptions (€1 490/mes).

## Stack

- **Marketing site:** Astro 5 → Cloudflare Pages
- **App server:** Hono + Bun → Hetzner CX22
- **Workers:** Bun + BullMQ → Hetzner CX22
- **Database:** PostgreSQL 16 + pgvector
- **Cache/Queue:** Redis 7
- **Monorepo:** pnpm workspaces
- **Lint/Format:** Biome

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and fill in API keys

# 3. Start local infrastructure
pnpm docker:up

# 4. Apply migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start all services
pnpm dev
```

Services run on:
- Marketing site: http://localhost:4321
- App server: http://localhost:3000
- Workers: background processes (logs to console)
- Postgres: localhost:5432
- Redis: localhost:6379

## Project structure

```
mentivue/
├── docs/               # All documentation (PRD, METRICS, etc.)
├── packages/
│   ├── site/           # Astro marketing site (mentivue.sk)
│   ├── app/            # Hono app server (app.mentivue.sk)
│   ├── workers/        # Bun + BullMQ background jobs
│   └── shared/         # Shared TypeScript: DB, LLM clients, types
├── prompts/            # Prompt libraries (sk-electronics.yaml, etc.)
├── infra/              # Docker, deploy scripts
├── tests/              # Integration tests
├── CLAUDE.md           # Navigation guide for Claude Code
└── README.md
```

## Documentation

All strategy and implementation docs are in `docs/`:

- **PRD.md** - product strategy
- **REPORTS.md** - report types and structure
- **METRICS.md** - per-metric formulas and SQL
- **ANALYSIS.md** - data pipeline architecture
- **VALIDATION.md** - quality control (M1-M22)
- **SALES_VALUE.md** - actionability layer
- **SUBSCRIPTION.md** - recurring revenue model
- **PHASED_GTM.md** - 4-phase go-to-market
- **AUTOMATION.md** - 12 AI agents
- **READINESS_AUDIT.md** - launch readiness assessment
- **STACK_COMPARISON.md** - why this stack vs Next.js
- **MONOREPO.md** - monorepo rationale

## Common commands

```bash
# Development
pnpm dev                    # All services in parallel
pnpm dev:site               # Just marketing site
pnpm dev:app                # Just app server
pnpm dev:workers            # Just workers

# Type checking
pnpm typecheck              # Across all packages

# Linting / Formatting
pnpm lint                   # Check
pnpm lint:fix               # Auto-fix
pnpm format                 # Format all files

# Database
pnpm db:generate            # Generate migration from schema
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio
pnpm db:seed                # Seed initial data

# Docker
pnpm docker:up              # Start Postgres + Redis
pnpm docker:down            # Stop containers
pnpm docker:logs            # Tail logs

# Build / Deploy
pnpm build                  # Build all packages
pnpm deploy:site            # Deploy marketing site
pnpm deploy:app             # Deploy app server
pnpm deploy:workers         # Deploy workers
```

## License

Proprietary. Copyright © Mentivue, 2026.
EOF

success "README.md created"

# ==============================================================================
# 15. Deploy script template
# ==============================================================================

log "Creating deploy script template..."

cat > infra/deploy.sh <<'EOF'
#!/usr/bin/env bash
# Mentivue deployment script
# Usage: bash infra/deploy.sh [app|workers]

set -e

SERVICE=$1
if [ -z "$SERVICE" ]; then
  echo "Usage: bash infra/deploy.sh [app|workers]"
  exit 1
fi

REMOTE_HOST=${MENTIVUE_DEPLOY_HOST:-"mentivue@your-hetzner-vm.example.com"}
REMOTE_PATH=${MENTIVUE_DEPLOY_PATH:-"/opt/mentivue"}

echo "▸ Deploying $SERVICE to $REMOTE_HOST..."

ssh "$REMOTE_HOST" <<REMOTE
  set -e
  cd $REMOTE_PATH
  git pull origin main
  pnpm install --frozen-lockfile
  pnpm build:$SERVICE
  pm2 reload $SERVICE
  echo "✓ $SERVICE deployed"
REMOTE

echo "✓ Deployment complete"
EOF

chmod +x infra/deploy.sh

success "Deploy script created"

# ==============================================================================
# 16. Install dependencies
# ==============================================================================

log "Installing dependencies (this takes 2-3 minutes)..."

pnpm install

success "Dependencies installed"

# ==============================================================================
# 17. Initial git commit
# ==============================================================================

log "Creating initial git commit..."

git add -A
git commit -q -m "feat: initial monorepo setup

- pnpm workspaces with 4 packages: site, app, workers, shared
- Astro 5 marketing site
- Hono + Bun app server
- Bun + BullMQ workers
- Drizzle ORM with PostgreSQL
- Biome for lint + format
- Docker compose for local dev
- CLAUDE.md navigation guide"

success "Initial commit created"

# ==============================================================================
# DONE
# ==============================================================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ MENTIVUE MONOREPO READY${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Edit .env and add your API keys:"
echo "     ${YELLOW}cd $PROJECT_NAME && code .env${NC}"
echo ""
echo "  2. Copy documentation files to docs/ folder:"
echo "     ${YELLOW}cp ~/Downloads/*.md docs/${NC}"
echo ""
echo "  3. Copy prompts file:"
echo "     ${YELLOW}cp ~/Downloads/prompts-sk.yaml prompts/sk-electronics.yaml${NC}"
echo ""
echo "  4. Start local infrastructure:"
echo "     ${YELLOW}pnpm docker:up${NC}"
echo ""
echo "  5. Generate and apply DB migrations:"
echo "     ${YELLOW}pnpm db:generate${NC}"
echo "     ${YELLOW}pnpm db:migrate${NC}"
echo "     ${YELLOW}pnpm db:seed${NC}"
echo ""
echo "  6. Start all services:"
echo "     ${YELLOW}pnpm dev${NC}"
echo ""
echo "  7. Open in VS Code and start Claude Code session:"
echo "     ${YELLOW}cd $PROJECT_NAME && code .${NC}"
echo "     First prompt: 'Read CLAUDE.md and docs/PRD.md, then we begin Week 1'"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  Marketing site: http://localhost:4321"
echo "  App server:     http://localhost:3000"
echo "  Postgres:       localhost:5432"
echo "  Redis:          localhost:6379"
echo ""
