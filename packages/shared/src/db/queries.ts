// Aggregation queries for Mentivue reports (per ANALYSIS.md §3).
// Returns typed rows; complex aggregations use raw SQL via db.execute().
//
// Filters:
//   verticalSlug — restrict to e.g. 'sk-electronics'
//   provider     — restrict to e.g. 'anthropic'
//   sinceDays    — restrict to last N days (default: all time)
//
// All counts only include status='success' collection calls; analysis
// calls are excluded by call_type='collection' filter.

import { type SQL, sql } from 'drizzle-orm';
import { db } from './index.ts';

export interface QueryFilters {
  verticalSlug?: string;
  provider?: string;
  sinceDays?: number;
}

function buildFilter(f: QueryFilters): SQL {
  const clauses: SQL[] = [sql`lc.status = 'success'`, sql`lc.call_type = 'collection'`];
  if (f.verticalSlug) {
    clauses.push(sql`p.vertical_id = (SELECT id FROM verticals WHERE slug = ${f.verticalSlug})`);
  }
  if (f.provider) clauses.push(sql`lc.provider = ${f.provider}`);
  if (f.sinceDays !== undefined) {
    clauses.push(sql`lc.created_at >= NOW() - (${f.sinceDays} || ' days')::interval`);
  }
  return sql.join(clauses, sql` AND `);
}

// ============================================================================
// SHARE OF VOICE — % of collection responses in which each brand is mentioned
// ============================================================================
export type SovRow = {
  provider: string;
  brand_slug: string;
  brand_name: string;
  total_calls: number;
  responses_with_mention: number;
  sov_pct: number;
  avg_position: number | null;
  avg_sentiment_score: number | null;
};

export async function shareOfVoice(filters: QueryFilters = {}): Promise<SovRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<SovRow>(sql`
    WITH calls AS (
      SELECT lc.id, lc.provider
      FROM llm_calls lc
      LEFT JOIN prompts p ON p.id = lc.prompt_id
      WHERE ${where}
    ),
    totals AS (
      SELECT provider, COUNT(*)::int AS total_calls
      FROM calls
      GROUP BY provider
    )
    SELECT
      c.provider,
      b.slug AS brand_slug,
      b.name AS brand_name,
      t.total_calls,
      COUNT(DISTINCT bm.raw_response_id)::int AS responses_with_mention,
      ROUND(
        COUNT(DISTINCT bm.raw_response_id)::numeric / NULLIF(t.total_calls, 0) * 100,
        2
      )::float AS sov_pct,
      ROUND(AVG(bm.position)::numeric, 2)::float AS avg_position,
      ROUND(AVG(bm.sentiment_score)::numeric, 3)::float AS avg_sentiment_score
    FROM calls c
    JOIN totals t ON t.provider = c.provider
    CROSS JOIN brands b
    LEFT JOIN raw_responses rr ON rr.llm_call_id = c.id
    LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = b.id
    GROUP BY c.provider, b.id, b.slug, b.name, t.total_calls
    HAVING COUNT(DISTINCT bm.raw_response_id) > 0
    ORDER BY c.provider, sov_pct DESC, avg_position ASC NULLS LAST
  `);
  return rows as unknown as SovRow[];
}

// ============================================================================
// SENTIMENT SUMMARY per brand (across all providers)
// ============================================================================
export type SentimentRow = {
  brand_slug: string;
  brand_name: string;
  total_mentions: number;
  avg_sentiment_score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_pct: number;
};

export async function sentimentSummary(filters: QueryFilters = {}): Promise<SentimentRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<SentimentRow>(sql`
    SELECT
      b.slug AS brand_slug,
      b.name AS brand_name,
      COUNT(bm.id)::int AS total_mentions,
      ROUND(AVG(bm.sentiment_score)::numeric, 3)::float AS avg_sentiment_score,
      COUNT(*) FILTER (WHERE bm.sentiment = 'positive')::int AS positive_count,
      COUNT(*) FILTER (WHERE bm.sentiment = 'neutral')::int AS neutral_count,
      COUNT(*) FILTER (WHERE bm.sentiment = 'negative')::int AS negative_count,
      ROUND(
        COUNT(*) FILTER (WHERE bm.sentiment = 'positive')::numeric
          / NULLIF(COUNT(bm.id), 0) * 100,
        2
      )::float AS positive_pct
    FROM brand_mentions bm
    JOIN brands b ON b.id = bm.brand_id
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    JOIN llm_calls lc ON lc.id = rr.llm_call_id
    LEFT JOIN prompts p ON p.id = lc.prompt_id
    WHERE ${where}
    GROUP BY b.id, b.slug, b.name
    ORDER BY avg_sentiment_score DESC, total_mentions DESC
  `);
  return rows as unknown as SentimentRow[];
}

// ============================================================================
// TOP CITATION DOMAINS — what AI search cites
// ============================================================================
export type CitationRow = {
  domain: string;
  citation_count: number;
  unique_responses: number;
  citation_share_pct: number;
};

export async function topCitationDomains(
  filters: QueryFilters = {},
  limit = 20,
): Promise<CitationRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<CitationRow>(sql`
    WITH citation_data AS (
      SELECT rr.id AS response_id, jsonb_array_elements(rr.citations) AS citation
      FROM raw_responses rr
      JOIN llm_calls lc ON lc.id = rr.llm_call_id
      LEFT JOIN prompts p ON p.id = lc.prompt_id
      WHERE rr.citations IS NOT NULL AND ${where}
    ),
    totals AS (SELECT COUNT(*)::int AS total FROM citation_data)
    SELECT
      citation->>'domain' AS domain,
      COUNT(*)::int AS citation_count,
      COUNT(DISTINCT response_id)::int AS unique_responses,
      ROUND(COUNT(*)::numeric / NULLIF((SELECT total FROM totals), 0) * 100, 2)::float
        AS citation_share_pct
    FROM citation_data
    WHERE citation->>'domain' IS NOT NULL
    GROUP BY citation->>'domain'
    ORDER BY citation_count DESC, unique_responses DESC
    LIMIT ${limit}
  `);
  return rows as unknown as CitationRow[];
}

// ============================================================================
// PROVIDER QUALITY — refusal rate, avg quality, cost
// ============================================================================
export type ProviderQualityRow = {
  provider: string;
  total_calls: number;
  avg_quality_score: number | null;
  refusal_rate_pct: number | null;
  total_cost_usd: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  avg_latency_ms: number;
};

export async function providerQuality(filters: QueryFilters = {}): Promise<ProviderQualityRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<ProviderQualityRow>(sql`
    SELECT
      lc.provider,
      COUNT(*)::int AS total_calls,
      ROUND(AVG(rq.quality_score)::numeric, 2)::float AS avg_quality_score,
      ROUND(
        COUNT(*) FILTER (WHERE rq.refused = true)::numeric / NULLIF(COUNT(rq.id), 0) * 100,
        2
      )::float AS refusal_rate_pct,
      ROUND(SUM(lc.estimated_cost_usd)::numeric, 4)::float AS total_cost_usd,
      ROUND(AVG(lc.input_tokens)::numeric, 0)::int AS avg_input_tokens,
      ROUND(AVG(lc.output_tokens)::numeric, 0)::int AS avg_output_tokens,
      ROUND(AVG(lc.latency_ms)::numeric, 0)::int AS avg_latency_ms
    FROM llm_calls lc
    LEFT JOIN response_quality rq ON rq.llm_call_id = lc.id
    LEFT JOIN prompts p ON p.id = lc.prompt_id
    WHERE ${where}
    GROUP BY lc.provider
    ORDER BY lc.provider
  `);
  return rows as unknown as ProviderQualityRow[];
}

// ============================================================================
// POSITION RANKINGS — weighted by mention position (1/position)
// ============================================================================
export type PositionRow = {
  brand_slug: string;
  brand_name: string;
  mention_count: number;
  avg_position: number;
  position_score: number;
};

export async function positionRankings(filters: QueryFilters = {}): Promise<PositionRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<PositionRow>(sql`
    SELECT
      b.slug AS brand_slug,
      b.name AS brand_name,
      COUNT(bm.id)::int AS mention_count,
      ROUND(AVG(bm.position)::numeric, 2)::float AS avg_position,
      ROUND(AVG(1.0 / GREATEST(bm.position, 1))::numeric, 3)::float AS position_score
    FROM brand_mentions bm
    JOIN brands b ON b.id = bm.brand_id
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    JOIN llm_calls lc ON lc.id = rr.llm_call_id
    LEFT JOIN prompts p ON p.id = lc.prompt_id
    WHERE bm.position IS NOT NULL AND ${where}
    GROUP BY b.id, b.slug, b.name
    ORDER BY position_score DESC, mention_count DESC
  `);
  return rows as unknown as PositionRow[];
}

// ============================================================================
// UNTRACKED BRANDS — what AI cites that we don't track
// ============================================================================
export type UntrackedRow = {
  brand: string;
  occurrences: number;
};

export async function untrackedBrands(
  filters: QueryFilters = {},
  limit = 20,
): Promise<UntrackedRow[]> {
  const where = buildFilter(filters);
  const rows = await db.execute<UntrackedRow>(sql`
    SELECT
      LOWER(jsonb_array_elements_text(lc.metadata->'untracked_brands_seen')) AS brand,
      COUNT(*)::int AS occurrences
    FROM llm_calls lc
    LEFT JOIN prompts p ON p.id = lc.prompt_id
    WHERE lc.metadata ? 'untracked_brands_seen' AND ${where}
    GROUP BY brand
    ORDER BY occurrences DESC, brand ASC
    LIMIT ${limit}
  `);
  return rows as unknown as UntrackedRow[];
}

// ============================================================================
// COST SUMMARY — daily/total spend split by call_type
// ============================================================================
export type CostSummaryRow = {
  call_type: string;
  provider: string;
  total_calls: number;
  total_cost_usd: number;
  avg_cost_per_call: number;
};

export async function costSummary(sinceDays?: number): Promise<CostSummaryRow[]> {
  const dateClause = sinceDays
    ? sql`AND created_at >= NOW() - (${sinceDays} || ' days')::interval`
    : sql``;
  const rows = await db.execute<CostSummaryRow>(sql`
    SELECT
      call_type,
      provider,
      COUNT(*)::int AS total_calls,
      ROUND(SUM(estimated_cost_usd)::numeric, 6)::float AS total_cost_usd,
      ROUND(AVG(estimated_cost_usd)::numeric, 6)::float AS avg_cost_per_call
    FROM llm_calls
    WHERE status = 'success' ${dateClause}
    GROUP BY call_type, provider
    ORDER BY call_type, total_cost_usd DESC
  `);
  return rows as unknown as CostSummaryRow[];
}
