import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================================================
// VERTICALS — allow multi-vertical from Day 1 (sk-electronics first, sk-banking next)
// ============================================================================
export const verticals = pgTable('verticals', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  category: text('category').notNull(),
  language: text('language').notNull().default('sk'),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// BRANDS — tracked brands per vertical
// ============================================================================
export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verticalId: uuid('vertical_id')
      .notNull()
      .references(() => verticals.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
    website: text('website'),
    metadata: jsonb('metadata'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    verticalSlugUq: uniqueIndex('brands_vertical_slug_uq').on(table.verticalId, table.slug),
  }),
);

// ============================================================================
// PROMPTS — SK prompt library (1 176 promptov v Y1, 8 kategórií)
// ============================================================================
export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verticalId: uuid('vertical_id')
      .notNull()
      .references(() => verticals.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    category: text('category').notNull(),
    subcategory: text('subcategory'),
    language: text('language').notNull().default('sk'),
    text: text('text').notNull(),
    frequencyTier: text('frequency_tier').notNull(), // daily | weekly | monthly
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    externalIdUq: uniqueIndex('prompts_external_id_uq').on(table.externalId),
    verticalCategoryIdx: index('prompts_vertical_category_idx').on(
      table.verticalId,
      table.category,
    ),
    frequencyTierIdx: index('prompts_frequency_tier_idx').on(table.frequencyTier),
  }),
);

// ============================================================================
// LLM CALLS — every API call logged with tokens, cost, latency (cost-first design)
// ============================================================================
export const llmCalls = pgTable(
  'llm_calls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(), // anthropic | openai | perplexity | gemini
    model: text('model').notNull(),
    callType: text('call_type').notNull().default('collection'), // collection | analysis | report
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    cachedInputTokens: integer('cached_input_tokens'),
    searchFeeUsd: real('search_fee_usd'),
    estimatedCostUsd: real('estimated_cost_usd').notNull().default(0),
    latencyMs: integer('latency_ms'),
    status: text('status').notNull().default('success'), // success | error | rate_limited
    errorMessage: text('error_message'),
    isBatch: boolean('is_batch').notNull().default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    promptProviderIdx: index('llm_calls_prompt_provider_idx').on(table.promptId, table.provider),
    createdAtIdx: index('llm_calls_created_at_idx').on(table.createdAt),
    statusIdx: index('llm_calls_status_idx').on(table.status),
  }),
);

// ============================================================================
// RAW RESPONSES — 1:1 with llm_calls; the actual text + citations
// ============================================================================
export const rawResponses = pgTable(
  'raw_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    llmCallId: uuid('llm_call_id')
      .notNull()
      .references(() => llmCalls.id, { onDelete: 'cascade' }),
    responseText: text('response_text').notNull(),
    citations: jsonb('citations').$type<Array<{ url: string; title?: string; domain?: string }>>(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    llmCallUq: uniqueIndex('raw_responses_llm_call_uq').on(table.llmCallId),
  }),
);

// ============================================================================
// BRAND MENTIONS — extracted by analysis pipeline (per ANALYSIS.md §2.2)
// ============================================================================
export const brandMentions = pgTable(
  'brand_mentions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rawResponseId: uuid('raw_response_id')
      .notNull()
      .references(() => rawResponses.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    position: integer('position'), // 1 = first mentioned
    context: text('context'), // snippet around mention (max ~200 chars)
    mentionStrength: text('mention_strength'), // primary | secondary | passing
    sentiment: text('sentiment'), // positive | neutral | negative
    sentimentScore: real('sentiment_score'), // -1.0 to 1.0
    sentimentReasoning: text('sentiment_reasoning'),
    confidence: real('confidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    brandIdx: index('brand_mentions_brand_idx').on(table.brandId),
    rawResponseIdx: index('brand_mentions_raw_response_idx').on(table.rawResponseId),
  }),
);

// ============================================================================
// RESPONSE QUALITY — per-call quality scoring (per ANALYSIS.md §2.5)
// ============================================================================
export const responseQuality = pgTable(
  'response_quality',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    llmCallId: uuid('llm_call_id')
      .notNull()
      .references(() => llmCalls.id, { onDelete: 'cascade' }),
    qualityScore: real('quality_score').notNull(), // 0-10
    relevance: integer('relevance'), // 0-3
    specificity: integer('specificity'), // 0-3
    citationQuality: integer('citation_quality'), // 0-2
    languageCorrectness: integer('language_correctness'), // 0-2
    refused: boolean('refused').notNull().default(false),
    reasoning: text('reasoning'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    llmCallUq: uniqueIndex('response_quality_llm_call_uq').on(table.llmCallId),
  }),
);

// ============================================================================
// HALLUCINATION FLAGS — per ANALYSIS.md §2.6
// ============================================================================
export const hallucinationFlags = pgTable(
  'hallucination_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    llmCallId: uuid('llm_call_id')
      .notNull()
      .references(() => llmCalls.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    claim: text('claim').notNull(),
    claimType: text('claim_type'), // price | location | service | feature | company_info
    contradictsFacts: boolean('contradicts_facts').notNull().default(false),
    contradiction: text('contradiction'),
    confidence: real('confidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    llmCallIdx: index('hallucination_flags_llm_call_idx').on(table.llmCallId),
    brandIdx: index('hallucination_flags_brand_idx').on(table.brandId),
  }),
);

// ============================================================================
// KLIENTS — subscribers / paying customers (skeleton; populated when billing lands)
// ============================================================================
export const klients = pgTable('klients', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  company: text('company'),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  tier: text('tier'), // watch | pro | enterprise
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// REPORTS — generated PDFs (industry, audit, action, pulse)
// ============================================================================
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(), // industry | audit | action | pulse
    klientId: uuid('klient_id').references(() => klients.id, { onDelete: 'set null' }),
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    verticalId: uuid('vertical_id').references(() => verticals.id, { onDelete: 'set null' }),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    storageUrl: text('storage_url'),
    metadata: jsonb('metadata'),
    status: text('status').notNull().default('pending'), // pending | generating | ready | failed
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    klientTypeIdx: index('reports_klient_type_idx').on(table.klientId, table.type),
  }),
);

// ============================================================================
// RELATIONS
// ============================================================================
export const verticalsRelations = relations(verticals, ({ many }) => ({
  brands: many(brands),
  prompts: many(prompts),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  vertical: one(verticals, { fields: [brands.verticalId], references: [verticals.id] }),
  mentions: many(brandMentions),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  vertical: one(verticals, { fields: [prompts.verticalId], references: [verticals.id] }),
  llmCalls: many(llmCalls),
}));

export const llmCallsRelations = relations(llmCalls, ({ one }) => ({
  prompt: one(prompts, { fields: [llmCalls.promptId], references: [prompts.id] }),
  rawResponse: one(rawResponses, {
    fields: [llmCalls.id],
    references: [rawResponses.llmCallId],
  }),
  quality: one(responseQuality, {
    fields: [llmCalls.id],
    references: [responseQuality.llmCallId],
  }),
}));

export const rawResponsesRelations = relations(rawResponses, ({ one, many }) => ({
  llmCall: one(llmCalls, { fields: [rawResponses.llmCallId], references: [llmCalls.id] }),
  mentions: many(brandMentions),
}));

export const brandMentionsRelations = relations(brandMentions, ({ one }) => ({
  rawResponse: one(rawResponses, {
    fields: [brandMentions.rawResponseId],
    references: [rawResponses.id],
  }),
  brand: one(brands, { fields: [brandMentions.brandId], references: [brands.id] }),
}));
