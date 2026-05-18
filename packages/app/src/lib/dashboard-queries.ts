// Read queries for the customer dashboard. Each function powers one widget on
// the prototype. All queries scope to klient's brand (passed in) + last N days.

import { sql, type SQL } from 'drizzle-orm';
import { db } from '@mentivue/shared/db';

// ============================================================================
// 1. MENTIVUE INDEX SUMMARY — composite score + 30d sparkline + delta
// ============================================================================
export interface IndexSummary {
  current_sov_pct: number | null;
  previous_sov_pct: number | null;
  delta_pp: number | null;
  total_mentions: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  positive_pct: number | null;
  avg_position: number | null;
  avg_sentiment_score: number | null;
  mentivue_index: number | null;
  mentivue_index_prev: number | null;
}

// Mentivue Index = weighted composite:
//   40% normalized SoV (0–100)
//   30% sentiment ((score + 1) / 2 × 100)
//   20% position-inverse (max(0, (1 − (avg_pos − 1) / 4)) × 100)
//   10% positive mention share (positive / total × 100)
// Returned 0–100 with 1 decimal.
export async function klientIndexSummary(brandId: string, days = 30): Promise<IndexSummary> {
  const rows = await db.execute(sql`
    WITH bounds AS (
      SELECT
        NOW() - (${days} || ' days')::interval AS curr_start,
        NOW() - (${days * 2} || ' days')::interval AS prev_start
    ),
    curr_calls AS (
      SELECT lc.id FROM llm_calls lc
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= (SELECT curr_start FROM bounds)
    ),
    prev_calls AS (
      SELECT lc.id FROM llm_calls lc
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= (SELECT prev_start FROM bounds)
        AND lc.created_at <  (SELECT curr_start FROM bounds)
    ),
    curr_mentions AS (
      SELECT bm.*, rr.llm_call_id
      FROM brand_mentions bm
      JOIN raw_responses rr ON rr.id = bm.raw_response_id
      WHERE bm.brand_id = ${brandId}::uuid
        AND rr.llm_call_id IN (SELECT id FROM curr_calls)
    ),
    prev_mentions AS (
      SELECT bm.*, rr.llm_call_id
      FROM brand_mentions bm
      JOIN raw_responses rr ON rr.id = bm.raw_response_id
      WHERE bm.brand_id = ${brandId}::uuid
        AND rr.llm_call_id IN (SELECT id FROM prev_calls)
    ),
    curr_metrics AS (
      SELECT
        (SELECT COUNT(*) FROM curr_calls)::int AS total_calls,
        (SELECT COUNT(DISTINCT llm_call_id) FROM curr_mentions)::int AS responses_with_mention,
        (SELECT COUNT(*) FROM curr_mentions)::int AS total_mentions,
        (SELECT COUNT(*) FROM curr_mentions WHERE sentiment = 'positive')::int AS positive_mentions,
        (SELECT COUNT(*) FROM curr_mentions WHERE sentiment = 'negative')::int AS negative_mentions,
        (SELECT COUNT(*) FROM curr_mentions WHERE sentiment = 'neutral')::int AS neutral_mentions,
        (SELECT AVG(position) FROM curr_mentions)::float AS avg_position,
        (SELECT AVG(sentiment_score) FROM curr_mentions)::float AS avg_sentiment_score
    ),
    prev_metrics AS (
      SELECT
        (SELECT COUNT(*) FROM prev_calls)::int AS total_calls,
        (SELECT COUNT(DISTINCT llm_call_id) FROM prev_mentions)::int AS responses_with_mention,
        (SELECT AVG(position) FROM prev_mentions)::float AS avg_position,
        (SELECT AVG(sentiment_score) FROM prev_mentions)::float AS avg_sentiment_score,
        (SELECT COUNT(*) FROM prev_mentions WHERE sentiment = 'positive')::int AS positive_mentions,
        (SELECT COUNT(*) FROM prev_mentions)::int AS total_mentions
    )
    SELECT
      ROUND((cm.responses_with_mention::numeric / NULLIF(cm.total_calls, 0) * 100)::numeric, 2)::float AS current_sov_pct,
      ROUND((pm.responses_with_mention::numeric / NULLIF(pm.total_calls, 0) * 100)::numeric, 2)::float AS previous_sov_pct,
      ROUND(
        ((cm.responses_with_mention::numeric / NULLIF(cm.total_calls, 0) * 100)
        - (pm.responses_with_mention::numeric / NULLIF(pm.total_calls, 0) * 100))::numeric, 2
      )::float AS delta_pp,
      cm.total_mentions,
      cm.positive_mentions,
      cm.negative_mentions,
      cm.neutral_mentions,
      ROUND((cm.positive_mentions::numeric / NULLIF(cm.total_mentions, 0) * 100)::numeric, 2)::float AS positive_pct,
      ROUND(cm.avg_position::numeric, 2)::float AS avg_position,
      ROUND(cm.avg_sentiment_score::numeric, 3)::float AS avg_sentiment_score,
      -- Mentivue Index composite (current)
      ROUND((
        0.40 * COALESCE(cm.responses_with_mention::numeric / NULLIF(cm.total_calls, 0) * 100, 0)
      + 0.30 * COALESCE((cm.avg_sentiment_score + 1) * 50, 0)
      + 0.20 * GREATEST(0, 1 - ((cm.avg_position - 1) / 4)) * 100
      + 0.10 * COALESCE(cm.positive_mentions::numeric / NULLIF(cm.total_mentions, 0) * 100, 0)
      )::numeric, 1)::float AS mentivue_index,
      ROUND((
        0.40 * COALESCE(pm.responses_with_mention::numeric / NULLIF(pm.total_calls, 0) * 100, 0)
      + 0.30 * COALESCE((pm.avg_sentiment_score + 1) * 50, 0)
      + 0.20 * GREATEST(0, 1 - ((pm.avg_position - 1) / 4)) * 100
      + 0.10 * COALESCE(pm.positive_mentions::numeric / NULLIF(pm.total_mentions, 0) * 100, 0)
      )::numeric, 1)::float AS mentivue_index_prev
    FROM curr_metrics cm
    CROSS JOIN prev_metrics pm
  `);
  const [first] = rows as unknown as IndexSummary[];
  return (
    first ?? {
      current_sov_pct: null,
      previous_sov_pct: null,
      delta_pp: null,
      total_mentions: 0,
      positive_mentions: 0,
      negative_mentions: 0,
      neutral_mentions: 0,
      positive_pct: null,
      avg_position: null,
      avg_sentiment_score: null,
      mentivue_index: null,
      mentivue_index_prev: null,
    }
  );
}

// ============================================================================
// 2. INDEX SPARKLINE — daily Mentivue Index for last N days
// ============================================================================
export interface IndexSparkRow {
  day: string;
  mentivue_index: number;
}

export async function klientIndexSparkline(brandId: string, days = 30): Promise<IndexSparkRow[]> {
  const rows = await db.execute(sql`
    WITH days AS (
      SELECT generate_series(
        DATE_TRUNC('day', NOW() - (${days - 1} || ' days')::interval),
        DATE_TRUNC('day', NOW()),
        '1 day'::interval
      )::date AS day
    ),
    calls_per_day AS (
      SELECT DATE_TRUNC('day', lc.created_at)::date AS day,
             COUNT(*)::int AS total_calls
      FROM llm_calls lc
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY 1
    ),
    mentions_per_day AS (
      SELECT DATE_TRUNC('day', lc.created_at)::date AS day,
             COUNT(DISTINCT rr.id)::int AS resp_w_mention,
             COUNT(*)::int AS total_mentions,
             COUNT(*) FILTER (WHERE bm.sentiment = 'positive')::int AS positive_mentions,
             AVG(bm.position)::float AS avg_position,
             AVG(bm.sentiment_score)::float AS avg_sentiment
      FROM brand_mentions bm
      JOIN raw_responses rr ON rr.id = bm.raw_response_id
      JOIN llm_calls lc ON lc.id = rr.llm_call_id
      WHERE bm.brand_id = ${brandId}::uuid
        AND lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY 1
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      ROUND((
          0.40 * COALESCE(m.resp_w_mention::numeric / NULLIF(c.total_calls, 0) * 100, 0)
        + 0.30 * COALESCE((m.avg_sentiment + 1) * 50, 0)
        + 0.20 * GREATEST(0, 1 - ((m.avg_position - 1) / 4)) * 100
        + 0.10 * COALESCE(m.positive_mentions::numeric / NULLIF(m.total_mentions, 0) * 100, 0)
      )::numeric, 1)::float AS mentivue_index
    FROM days d
    LEFT JOIN calls_per_day c ON c.day = d.day
    LEFT JOIN mentions_per_day m ON m.day = d.day
    ORDER BY d.day
  `);
  return rows as unknown as IndexSparkRow[];
}

// ============================================================================
// 3. TOP BRANDS BAR — klient + top 3 competitors by SoV (one bar chart)
// ============================================================================
export interface TopBrandRow {
  brand_id: string;
  brand_slug: string;
  brand_name: string;
  responses_with_mention: number;
  sov_pct: number;
  is_klient: boolean;
}

export async function topBrandsSov(
  klientBrandId: string,
  days = 30,
  limit = 4,
): Promise<TopBrandRow[]> {
  const rows = await db.execute(sql`
    WITH calls AS (
      SELECT id FROM llm_calls
      WHERE status = 'success' AND call_type = 'collection'
        AND created_at >= NOW() - (${days} || ' days')::interval
    ),
    total AS (SELECT COUNT(*)::int AS n FROM calls)
    SELECT
      b.id::text AS brand_id,
      b.slug AS brand_slug,
      b.name AS brand_name,
      COUNT(DISTINCT rr.id)::int AS responses_with_mention,
      ROUND(
        (COUNT(DISTINCT rr.id)::numeric / NULLIF((SELECT n FROM total), 0) * 100)::numeric, 2
      )::float AS sov_pct,
      (b.id = ${klientBrandId}::uuid) AS is_klient
    FROM brand_mentions bm
    JOIN brands b ON b.id = bm.brand_id
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    WHERE rr.llm_call_id IN (SELECT id FROM calls)
    GROUP BY b.id, b.slug, b.name
    HAVING COUNT(DISTINCT rr.id) > 0
    ORDER BY (b.id = ${klientBrandId}::uuid) DESC, sov_pct DESC
    LIMIT ${limit}
  `);
  return rows as unknown as TopBrandRow[];
}

// ============================================================================
// 4. LLM PROVIDER BREAKDOWN — for the 4 engine cards
// ============================================================================
export interface LlmProviderRow {
  provider: string;
  total_calls: number;
  sov_pct: number;
  avg_position: number | null;
  avg_sentiment_score: number | null;
  total_cost_usd: number;
}

export async function llmProviderBreakdown(
  klientBrandId: string,
  days = 30,
): Promise<LlmProviderRow[]> {
  const rows = await db.execute(sql`
    WITH calls AS (
      SELECT id, provider, estimated_cost_usd
      FROM llm_calls
      WHERE status = 'success' AND call_type = 'collection'
        AND created_at >= NOW() - (${days} || ' days')::interval
    ),
    totals AS (
      SELECT provider, COUNT(*)::int AS total_calls, SUM(estimated_cost_usd)::float AS total_cost_usd
      FROM calls
      GROUP BY provider
    ),
    klient_responses AS (
      SELECT c.provider, COUNT(DISTINCT rr.id)::int AS rmentions,
             AVG(bm.position)::float AS avg_position,
             AVG(bm.sentiment_score)::float AS avg_sentiment_score
      FROM calls c
      LEFT JOIN raw_responses rr ON rr.llm_call_id = c.id
      LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = ${klientBrandId}::uuid
      WHERE bm.brand_id IS NOT NULL
      GROUP BY c.provider
    )
    SELECT
      t.provider,
      t.total_calls,
      ROUND((COALESCE(k.rmentions, 0)::numeric / NULLIF(t.total_calls, 0) * 100)::numeric, 2)::float AS sov_pct,
      ROUND(k.avg_position::numeric, 2)::float AS avg_position,
      ROUND(k.avg_sentiment_score::numeric, 3)::float AS avg_sentiment_score,
      ROUND(COALESCE(t.total_cost_usd, 0)::numeric, 4)::float AS total_cost_usd
    FROM totals t
    LEFT JOIN klient_responses k ON k.provider = t.provider
    ORDER BY sov_pct DESC NULLS LAST
  `);
  return rows as unknown as LlmProviderRow[];
}

// ============================================================================
// 5. 90-DAY SoV TREND — multi-brand time series for line chart
// ============================================================================
export interface SovTrendCell {
  day: string;
  brand_slug: string;
  brand_name: string;
  sov_pct: number;
}

export async function sovTrendMultiBrand(
  klientBrandId: string,
  competitorIds: string[],
  days = 90,
  granularity: 'day' | 'week' = 'week',
): Promise<SovTrendCell[]> {
  const ids = [klientBrandId, ...competitorIds];
  if (ids.length === 0) return [];
  const bucket = granularity === 'day' ? sql`'day'` : sql`'week'`;
  // Build VALUES list — drizzle/postgres.js doesn't natively cast JS arrays to typed PG arrays
  const brandIdValues = sql.join(
    ids.map((id) => sql`(${id}::uuid)`),
    sql`, `,
  );
  const rows = await db.execute(sql`
    WITH brand_filter AS (
      SELECT brand_id FROM (VALUES ${brandIdValues}) AS t(brand_id)
    ),
    days AS (
      SELECT generate_series(
        DATE_TRUNC(${bucket}, NOW() - (${days - 1} || ' days')::interval),
        DATE_TRUNC(${bucket}, NOW()),
        ('1 ' || ${bucket})::interval
      ) AS bucket
    ),
    calls_per_bucket AS (
      SELECT DATE_TRUNC(${bucket}, lc.created_at) AS bucket, COUNT(*)::int AS n
      FROM llm_calls lc
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY 1
    ),
    mentions_per_bucket AS (
      SELECT DATE_TRUNC(${bucket}, lc.created_at) AS bucket,
             bm.brand_id,
             COUNT(DISTINCT rr.id)::int AS rmentions
      FROM brand_mentions bm
      JOIN raw_responses rr ON rr.id = bm.raw_response_id
      JOIN llm_calls lc ON lc.id = rr.llm_call_id
      WHERE bm.brand_id IN (SELECT brand_id FROM brand_filter)
        AND lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY 1, 2
    )
    SELECT
      to_char(d.bucket, 'YYYY-MM-DD') AS day,
      b.slug AS brand_slug,
      b.name AS brand_name,
      ROUND(
        (COALESCE(m.rmentions, 0)::numeric / NULLIF(c.n, 0) * 100)::numeric, 2
      )::float AS sov_pct
    FROM days d
    CROSS JOIN brand_filter bf
    JOIN brands b ON b.id = bf.brand_id
    LEFT JOIN calls_per_bucket c ON c.bucket = d.bucket
    LEFT JOIN mentions_per_bucket m ON m.bucket = d.bucket AND m.brand_id = bf.brand_id
    ORDER BY d.bucket, b.slug
  `);
  return rows as unknown as SovTrendCell[];
}

// ============================================================================
// 6. TOPIC HEATMAP — subcategory × category matrix of sentiment score for klient brand
// ============================================================================
export interface HeatmapCell {
  row_label: string; // subcategory (e.g. smartphones)
  col_label: string; // category (e.g. discovery)
  sample_size: number;
  sentiment_avg: number | null;
}

export async function topicHeatmap(
  klientBrandId: string,
  rowSubcats: string[],
  colCategories: string[],
  days = 30,
): Promise<HeatmapCell[]> {
  if (rowSubcats.length === 0 || colCategories.length === 0) return [];
  const subInList: SQL = sql.join(
    rowSubcats.map((s) => sql`${s}`),
    sql`, `,
  );
  const catInList: SQL = sql.join(
    colCategories.map((s) => sql`${s}`),
    sql`, `,
  );
  const rows = await db.execute(sql`
    SELECT
      p.subcategory AS row_label,
      p.category    AS col_label,
      COUNT(bm.id)::int AS sample_size,
      ROUND(AVG(bm.sentiment_score)::numeric, 2)::float AS sentiment_avg
    FROM brand_mentions bm
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    JOIN llm_calls lc ON lc.id = rr.llm_call_id
    JOIN prompts p ON p.id = lc.prompt_id
    WHERE bm.brand_id = ${klientBrandId}::uuid
      AND lc.status = 'success' AND lc.call_type = 'collection'
      AND lc.created_at >= NOW() - (${days} || ' days')::interval
      AND p.subcategory IN (${subInList})
      AND p.category    IN (${catInList})
    GROUP BY p.subcategory, p.category
  `);
  return rows as unknown as HeatmapCell[];
}

// ============================================================================
// 7. CITATIONS — top domains with WoW trend (for citation list)
// ============================================================================
export interface CitationRow {
  domain: string;
  mentions: number;
  weight: number; // 1..5
  trend: 'up' | 'down' | 'flat';
}

export async function topCitations(days = 30, limit = 10): Promise<CitationRow[]> {
  const rows = await db.execute(sql`
    WITH curr AS (
      SELECT jsonb_array_elements(rr.citations)->>'domain' AS domain
      FROM raw_responses rr
      JOIN llm_calls lc ON lc.id = rr.llm_call_id
      WHERE lc.created_at >= NOW() - (${days} || ' days')::interval
        AND rr.citations IS NOT NULL
    ),
    prev AS (
      SELECT jsonb_array_elements(rr.citations)->>'domain' AS domain
      FROM raw_responses rr
      JOIN llm_calls lc ON lc.id = rr.llm_call_id
      WHERE lc.created_at >= NOW() - (${days * 2} || ' days')::interval
        AND lc.created_at <  NOW() - (${days} || ' days')::interval
        AND rr.citations IS NOT NULL
    ),
    curr_agg AS (
      SELECT domain, COUNT(*)::int AS mentions FROM curr WHERE domain IS NOT NULL GROUP BY domain
    ),
    prev_agg AS (
      SELECT domain, COUNT(*)::int AS mentions FROM prev WHERE domain IS NOT NULL GROUP BY domain
    ),
    max_curr AS (SELECT MAX(mentions)::int AS m FROM curr_agg)
    SELECT
      c.domain,
      c.mentions,
      LEAST(5, GREATEST(1, CEIL(c.mentions::numeric / NULLIF((SELECT m FROM max_curr), 0) * 5)))::int AS weight,
      CASE
        WHEN c.mentions > COALESCE(p.mentions, 0) * 1.10 THEN 'up'
        WHEN c.mentions < COALESCE(p.mentions, 0) * 0.90 THEN 'down'
        ELSE 'flat'
      END AS trend
    FROM curr_agg c
    LEFT JOIN prev_agg p ON p.domain = c.domain
    ORDER BY c.mentions DESC
    LIMIT ${limit}
  `);
  return rows as unknown as CitationRow[];
}

// ============================================================================
// 8. ANOMALIES — rule-based WoW SoV and sentiment shifts for klient brand
// ============================================================================
export interface Anomaly {
  severity: 'red' | 'amber' | 'green';
  kind: 'sov_drop' | 'sov_jump' | 'sentiment_drop' | 'sentiment_jump';
  provider: string;
  subcategory: string | null;
  delta: number;
  curr: number;
  prev: number;
  sample_size: number;
  context: string;
  detected_at: Date;
}

// Detects anomalies between (this 7d window) vs (prior 7d window):
//   • SoV drop ≥ 10 pp → RED, ≥ 5 pp → AMBER
//   • Sentiment drop ≥ 0.30 → RED, ≥ 0.15 → AMBER
//   • SoV jump ≥ 10 pp → GREEN
export async function klientAnomalies(klientBrandId: string): Promise<Anomaly[]> {
  const rows = await db.execute(sql`
    WITH curr_calls AS (
      SELECT lc.id, lc.provider, p.subcategory
      FROM llm_calls lc
      JOIN prompts p ON p.id = lc.prompt_id
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - INTERVAL '7 days'
    ),
    prev_calls AS (
      SELECT lc.id, lc.provider, p.subcategory
      FROM llm_calls lc
      JOIN prompts p ON p.id = lc.prompt_id
      WHERE lc.status = 'success' AND lc.call_type = 'collection'
        AND lc.created_at >= NOW() - INTERVAL '14 days'
        AND lc.created_at <  NOW() - INTERVAL '7 days'
    ),
    curr_totals AS (
      SELECT provider, subcategory, COUNT(*)::int AS total_calls
      FROM curr_calls
      GROUP BY provider, subcategory
    ),
    prev_totals AS (
      SELECT provider, subcategory, COUNT(*)::int AS total_calls
      FROM prev_calls
      GROUP BY provider, subcategory
    ),
    curr_metrics AS (
      SELECT
        cc.provider,
        cc.subcategory,
        COUNT(DISTINCT rr.id)::int AS rmentions,
        AVG(bm.sentiment_score)::float AS avg_sent
      FROM curr_calls cc
      LEFT JOIN raw_responses rr ON rr.llm_call_id = cc.id
      LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = ${klientBrandId}::uuid
      WHERE bm.brand_id IS NOT NULL
      GROUP BY cc.provider, cc.subcategory
    ),
    prev_metrics AS (
      SELECT
        pc.provider,
        pc.subcategory,
        COUNT(DISTINCT rr.id)::int AS rmentions,
        AVG(bm.sentiment_score)::float AS avg_sent
      FROM prev_calls pc
      LEFT JOIN raw_responses rr ON rr.llm_call_id = pc.id
      LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id AND bm.brand_id = ${klientBrandId}::uuid
      WHERE bm.brand_id IS NOT NULL
      GROUP BY pc.provider, pc.subcategory
    ),
    combined AS (
      SELECT
        ct.provider,
        ct.subcategory,
        ct.total_calls AS curr_total,
        COALESCE(pt.total_calls, 0) AS prev_total,
        COALESCE(cm.rmentions, 0)::float / NULLIF(ct.total_calls, 0) * 100 AS curr_sov,
        COALESCE(pm.rmentions, 0)::float / NULLIF(pt.total_calls, 0) * 100 AS prev_sov,
        cm.avg_sent AS curr_sent,
        pm.avg_sent AS prev_sent
      FROM curr_totals ct
      LEFT JOIN prev_totals pt ON pt.provider = ct.provider AND pt.subcategory = ct.subcategory
      LEFT JOIN curr_metrics cm ON cm.provider = ct.provider AND cm.subcategory = ct.subcategory
      LEFT JOIN prev_metrics pm ON pm.provider = ct.provider AND pm.subcategory = ct.subcategory
      WHERE ct.total_calls >= 5
        AND COALESCE(pt.total_calls, 0) >= 5
    )
    SELECT * FROM combined
    WHERE
      -- meaningful change in either dimension
      ABS(COALESCE(curr_sov, 0) - COALESCE(prev_sov, 0)) >= 5
      OR ABS(COALESCE(curr_sent, 0) - COALESCE(prev_sent, 0)) >= 0.15
  `);

  const list = rows as unknown as Array<{
    provider: string;
    subcategory: string | null;
    curr_total: number;
    prev_total: number;
    curr_sov: number | null;
    prev_sov: number | null;
    curr_sent: number | null;
    prev_sent: number | null;
  }>;

  const anomalies: Anomaly[] = [];
  for (const row of list) {
    const sovDelta = (row.curr_sov ?? 0) - (row.prev_sov ?? 0);
    const sentDelta = (row.curr_sent ?? 0) - (row.prev_sent ?? 0);
    const sample = row.curr_total + row.prev_total;

    if (sovDelta <= -10) {
      anomalies.push({
        severity: 'red',
        kind: 'sov_drop',
        provider: row.provider,
        subcategory: row.subcategory,
        delta: Number(sovDelta.toFixed(1)),
        curr: Number((row.curr_sov ?? 0).toFixed(1)),
        prev: Number((row.prev_sov ?? 0).toFixed(1)),
        sample_size: sample,
        context: `SoV klesol z ${(row.prev_sov ?? 0).toFixed(1)} % na ${(row.curr_sov ?? 0).toFixed(1)} % v kategórii ${row.subcategory ?? '—'}. Pravdepodobne konkurenčný posun.`,
        detected_at: new Date(),
      });
    } else if (sovDelta <= -5) {
      anomalies.push({
        severity: 'amber',
        kind: 'sov_drop',
        provider: row.provider,
        subcategory: row.subcategory,
        delta: Number(sovDelta.toFixed(1)),
        curr: Number((row.curr_sov ?? 0).toFixed(1)),
        prev: Number((row.prev_sov ?? 0).toFixed(1)),
        sample_size: sample,
        context: `Pokles SoV o ${Math.abs(sovDelta).toFixed(1)} pp v kategórii ${row.subcategory ?? '—'} (z ${(row.prev_sov ?? 0).toFixed(1)} % na ${(row.curr_sov ?? 0).toFixed(1)} %).`,
        detected_at: new Date(),
      });
    } else if (sovDelta >= 10) {
      anomalies.push({
        severity: 'green',
        kind: 'sov_jump',
        provider: row.provider,
        subcategory: row.subcategory,
        delta: Number(sovDelta.toFixed(1)),
        curr: Number((row.curr_sov ?? 0).toFixed(1)),
        prev: Number((row.prev_sov ?? 0).toFixed(1)),
        sample_size: sample,
        context: `SoV nárast o ${sovDelta.toFixed(1)} pp v kategórii ${row.subcategory ?? '—'}.`,
        detected_at: new Date(),
      });
    }

    if (sentDelta <= -0.3) {
      anomalies.push({
        severity: 'red',
        kind: 'sentiment_drop',
        provider: row.provider,
        subcategory: row.subcategory,
        delta: Number(sentDelta.toFixed(2)),
        curr: Number((row.curr_sent ?? 0).toFixed(2)),
        prev: Number((row.prev_sent ?? 0).toFixed(2)),
        sample_size: sample,
        context: `Sentiment v kategórii ${row.subcategory ?? '—'} klesol o ${Math.abs(sentDelta).toFixed(2)} (z ${(row.prev_sent ?? 0).toFixed(2)} na ${(row.curr_sent ?? 0).toFixed(2)}). Pozrite si nedávne recenzie.`,
        detected_at: new Date(),
      });
    } else if (sentDelta <= -0.15) {
      anomalies.push({
        severity: 'amber',
        kind: 'sentiment_drop',
        provider: row.provider,
        subcategory: row.subcategory,
        delta: Number(sentDelta.toFixed(2)),
        curr: Number((row.curr_sent ?? 0).toFixed(2)),
        prev: Number((row.prev_sent ?? 0).toFixed(2)),
        sample_size: sample,
        context: `Mierny sentiment posun v kategórii ${row.subcategory ?? '—'} (Δ ${sentDelta.toFixed(2)}).`,
        detected_at: new Date(),
      });
    }
  }

  // Sort: red first, then by absolute delta magnitude
  const sevOrder = { red: 0, amber: 1, green: 2 } as const;
  anomalies.sort((a, b) => {
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return Math.abs(b.delta) - Math.abs(a.delta);
  });

  return anomalies;
}

// ============================================================================
// 9. UPCOMING ITEMS — right rail (pending/generating reports + a hardcoded
//    strategy call that production would store in calendar)
// ============================================================================
export interface UpcomingItem {
  kind: 'coming' | 'wip' | 'reserve';
  title: string;
  date: string;
  action?: string;
}

export async function upcomingItems(klientId: string): Promise<UpcomingItem[]> {
  const pending = await db.execute(sql`
    SELECT type, status, period_end, metadata
    FROM reports
    WHERE klient_id = ${klientId}::uuid
      AND status IN ('generating', 'pending')
    ORDER BY period_end ASC
    LIMIT 4
  `);

  const items: UpcomingItem[] = [];
  for (const r of pending as unknown as Array<{
    type: string;
    status: string;
    period_end: string;
    metadata: { title?: string; pages?: number } | null;
  }>) {
    const date = new Date(r.period_end);
    const title = r.metadata?.title ?? r.type;
    const dateLabel = new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' }).format(date);
    if (r.status === 'generating') {
      items.push({ kind: 'coming', title, date: `${dateLabel} · pripravujeme`, action: 'Pozrieť osnovu' });
    } else {
      items.push({ kind: 'wip', title, date: `${dateLabel} · v príprave` });
    }
  }

  // Hardcoded strategy call (production: calendar table)
  const nextCall = new Date();
  nextCall.setDate(nextCall.getDate() + 21);
  const callDateLabel = new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' }).format(nextCall);
  items.splice(1, 0, {
    kind: 'reserve',
    title: 'Strategický call s Tomášom',
    date: `${callDateLabel} · online · 30 min`,
    action: 'Rezervovať čas',
  });

  return items;
}

// ============================================================================
// 10. LAST UPDATED — most recent successful collection call (TopBar "live")
// ============================================================================
export async function lastUpdateAt(): Promise<Date | null> {
  const rows = await db.execute(sql`
    SELECT MAX(created_at) AS latest
    FROM llm_calls
    WHERE status = 'success' AND call_type = 'collection'
  `);
  const [first] = rows as unknown as Array<{ latest: string | null }>;
  return first?.latest ? new Date(first.latest) : null;
}

// ============================================================================
// 11. ADMIN — today's per-provider health (reused on /admin/health)
// ============================================================================
export interface AdminHealthRow {
  provider: string;
  total_calls: number;
  errors: number;
  total_cost_usd: number;
  avg_latency_ms: number | null;
}

export async function adminHealthToday(): Promise<AdminHealthRow[]> {
  const rows = await db.execute(sql`
    SELECT
      provider,
      COUNT(*)::int AS total_calls,
      COUNT(*) FILTER (WHERE status != 'success')::int AS errors,
      ROUND(SUM(estimated_cost_usd)::numeric, 4)::float AS total_cost_usd,
      ROUND(AVG(latency_ms)::numeric, 0)::int AS avg_latency_ms
    FROM llm_calls
    WHERE created_at >= DATE_TRUNC('day', NOW())
    GROUP BY provider
    ORDER BY total_cost_usd DESC NULLS LAST
  `);
  return rows as unknown as AdminHealthRow[];
}

export interface AdminCostHistoryRow {
  day: string;
  total_calls: number;
  total_cost_usd: number;
}

export async function adminCostHistory(days = 7): Promise<AdminCostHistoryRow[]> {
  const rows = await db.execute(sql`
    WITH days AS (
      SELECT generate_series(
        DATE_TRUNC('day', NOW() - (${days - 1} || ' days')::interval),
        DATE_TRUNC('day', NOW()),
        '1 day'::interval
      )::date AS day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      COALESCE(COUNT(lc.id), 0)::int AS total_calls,
      COALESCE(ROUND(SUM(lc.estimated_cost_usd)::numeric, 4), 0)::float AS total_cost_usd
    FROM days d
    LEFT JOIN llm_calls lc ON DATE_TRUNC('day', lc.created_at)::date = d.day
    GROUP BY d.day
    ORDER BY d.day
  `);
  return rows as unknown as AdminCostHistoryRow[];
}
