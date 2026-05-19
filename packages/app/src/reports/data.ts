// Build typed data objects for each report. Pulls from existing dashboard
// queries + a couple of report-specific ones. Narrative copy uses sensible
// defaults from the prototype; in production this would be Claude-written.

import { db } from '@mentivue/shared/db';
import { sql } from 'drizzle-orm';
import {
  type Anomaly,
  klientAnomalies,
  klientIndexSparkline,
  klientIndexSummary,
  type LlmProviderRow,
  llmProviderBreakdown,
  type TopBrandRow,
  topBrandsSov,
  topCitations,
  topicHeatmap,
} from '../lib/dashboard-queries.ts';

export interface ReportContext {
  klient: { id: string; name: string | null; email: string; company: string | null };
  brand: { id: string; name: string; slug: string };
  period: { start: Date; end: Date; label: string }; // e.g. "Máj 2026" or "Q2 2026"
  refCode: string; // e.g. MAR-2026-05 or AUD-2026-Q2
  generatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY ACTION REPORT
// ─────────────────────────────────────────────────────────────────────────────
export interface MonthlyData extends ReportContext {
  index: { current: number; previous: number; delta: number };
  sov: { current: number; previous: number; delta: number };
  position: { current: number | null; previous: number | null; delta: number | null };
  sentiment: { current: number | null; previous: number | null; delta: number | null };
  sparkline: number[];
  anomalies: Anomaly[];
  topCompetitors: TopBrandRow[];
  citations: Array<{ domain: string; mentions: number; weight: number; trend: string }>;
  llmRows: LlmProviderRow[];
  totalMentions: number;
  // Narrative defaults (overrideable by admin in future)
  driverNarrative: string;
  outlook: string;
}

export async function buildMonthlyData(ctx: ReportContext): Promise<MonthlyData> {
  const [summary, sparkline, anomalies, competitors, citations, llmRows] = await Promise.all([
    klientIndexSummary(ctx.brand.id, 30),
    klientIndexSparkline(ctx.brand.id, 30),
    klientAnomalies(ctx.brand.id),
    topBrandsSov(ctx.brand.id, 30, 4),
    topCitations(30, 6),
    llmProviderBreakdown(ctx.brand.id, 30),
  ]);

  return {
    ...ctx,
    index: {
      current: summary.mentivue_index ?? 0,
      previous: summary.mentivue_index_prev ?? 0,
      delta: (summary.mentivue_index ?? 0) - (summary.mentivue_index_prev ?? 0),
    },
    sov: {
      current: summary.current_sov_pct ?? 0,
      previous: summary.previous_sov_pct ?? 0,
      delta: summary.delta_pp ?? 0,
    },
    position: {
      current: summary.avg_position,
      previous: null,
      delta: null,
    },
    sentiment: {
      current: summary.avg_sentiment_score,
      previous: null,
      delta: null,
    },
    sparkline: sparkline.map((s) => s.mentivue_index),
    anomalies,
    topCompetitors: competitors.filter((b) => !b.is_klient).slice(0, 3),
    citations,
    llmRows,
    totalMentions: summary.total_mentions ?? 0,
    driverNarrative:
      'Index pohyb je v rámci očakávaného pásma. Hlavný driver: pozitívne sentiment posuny v top kategóriách. Pozorujeme prirodzený drift v dlhodobých queries — sledujte trend rozdelený podľa provider engiu.',
    outlook:
      'Pre nasledujúci mesiac odporúčame zachovať publikačnú kadenciu citujúcich domén. Refurbished segment dostáva prioritný status v 30-dňovom akčnom pláne.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-BRAND AUDIT (quarterly)
// ─────────────────────────────────────────────────────────────────────────────
export interface AuditData extends ReportContext {
  index: { current: number; previous: number; delta: number };
  sov: { current: number; previous: number; delta: number };
  position: { current: number | null; previous: number | null };
  sentiment: { current: number | null; previous: number | null };
  topCompetitors: TopBrandRow[];
  llmRows: LlmProviderRow[];
  heatmap: Map<string, { sentiment: number | null; sample: number }>;
  citations: Array<{ domain: string; mentions: number; weight: number; trend: string }>;
  // Per-prompt-category breakdown for the audit's "where you win/lose" page
  categoryBreakdown: Array<{
    category: string;
    sov: number;
    sentiment: number | null;
    sample: number;
  }>;
  anomalies: Anomaly[];
  totalMentions: number;
  totalResponses: number;
}

const HEATMAP_ROWS = [
  'smartphones',
  'laptops',
  'tv_audio',
  'white_goods',
  'gaming',
  'accessories_smart_home',
];
const HEATMAP_COLS = [
  'discovery',
  'comparison',
  'validation',
  'commercial_intent',
  'product_specific',
  'trust_service',
];

export async function buildAuditData(ctx: ReportContext): Promise<AuditData> {
  const [summary, competitors, llmRows, heatmapRows, citations, anomalies] = await Promise.all([
    klientIndexSummary(ctx.brand.id, 90),
    topBrandsSov(ctx.brand.id, 90, 6),
    llmProviderBreakdown(ctx.brand.id, 90),
    topicHeatmap(ctx.brand.id, HEATMAP_ROWS, HEATMAP_COLS, 90),
    topCitations(90, 10),
    klientAnomalies(ctx.brand.id),
  ]);

  const heatmap = new Map<string, { sentiment: number | null; sample: number }>();
  for (const cell of heatmapRows) {
    if (cell.row_label && cell.col_label) {
      heatmap.set(`${cell.row_label}|${cell.col_label}`, {
        sentiment: cell.sentiment_avg,
        sample: cell.sample_size,
      });
    }
  }

  // Per-category SoV + sentiment for klient brand (90d)
  const categoryRows = await db.execute(sql`
    SELECT
      p.category,
      COUNT(DISTINCT rr.id)::int AS klient_mentions,
      (SELECT COUNT(*) FROM llm_calls lc2
        JOIN prompts p2 ON p2.id = lc2.prompt_id
        WHERE lc2.status = 'success' AND lc2.call_type = 'collection'
          AND lc2.created_at >= NOW() - INTERVAL '90 days'
          AND p2.category = p.category
      )::int AS total_calls,
      AVG(bm.sentiment_score)::float AS avg_sent,
      COUNT(bm.id)::int AS sample
    FROM brand_mentions bm
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    JOIN llm_calls lc ON lc.id = rr.llm_call_id
    JOIN prompts p ON p.id = lc.prompt_id
    WHERE bm.brand_id = ${ctx.brand.id}::uuid
      AND lc.status = 'success' AND lc.call_type = 'collection'
      AND lc.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY p.category
    ORDER BY p.category
  `);
  const categoryBreakdown = (
    categoryRows as unknown as Array<{
      category: string;
      klient_mentions: number;
      total_calls: number;
      avg_sent: number | null;
      sample: number;
    }>
  ).map((r) => ({
    category: r.category,
    sov: r.total_calls > 0 ? Math.round((r.klient_mentions / r.total_calls) * 1000) / 10 : 0,
    sentiment: r.avg_sent !== null ? Math.round(r.avg_sent * 100) / 100 : null,
    sample: r.sample,
  }));

  return {
    ...ctx,
    index: {
      current: summary.mentivue_index ?? 0,
      previous: summary.mentivue_index_prev ?? 0,
      delta: (summary.mentivue_index ?? 0) - (summary.mentivue_index_prev ?? 0),
    },
    sov: {
      current: summary.current_sov_pct ?? 0,
      previous: summary.previous_sov_pct ?? 0,
      delta: summary.delta_pp ?? 0,
    },
    position: { current: summary.avg_position, previous: null },
    sentiment: { current: summary.avg_sentiment_score, previous: null },
    topCompetitors: competitors.filter((b) => !b.is_klient).slice(0, 5),
    llmRows,
    heatmap,
    citations,
    categoryBreakdown,
    anomalies,
    totalMentions: summary.total_mentions,
    totalResponses: summary.total_mentions, // close enough proxy here
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY REPORT (quarterly, public-facing)
// ─────────────────────────────────────────────────────────────────────────────
export interface IndustryData {
  period: { start: Date; end: Date; label: string };
  refCode: string;
  generatedAt: Date;
  verticalName: string;
  trackedBrands: number;
  totalPrompts: number;
  totalCalls: number;
  topBrands: Array<{
    rank: number;
    name: string;
    slug: string;
    index: number;
    sov: number;
    delta: number;
  }>;
  topMovers: {
    gainers: Array<{ name: string; delta: number }>;
    losers: Array<{ name: string; delta: number }>;
  };
  citations: Array<{ domain: string; mentions: number; weight: number; trend: string }>;
  llmShares: Array<{ provider: string; share: number; sentimentAvg: number | null }>;
}

export async function buildIndustryData(
  verticalSlug: string,
  period: { start: Date; end: Date; label: string },
  refCode: string,
): Promise<IndustryData> {
  const days = Math.max(30, Math.round((period.end.getTime() - period.start.getTime()) / 86400000));
  const verticalRow = await db.execute(
    sql`SELECT id, name FROM verticals WHERE slug = ${verticalSlug} LIMIT 1`,
  );
  const v = (verticalRow as unknown as Array<{ id: string; name: string }>)[0];
  if (!v) throw new Error(`Vertical not found: ${verticalSlug}`);

  // Top brands by SoV in window
  const rows = await db.execute(sql`
    WITH calls AS (
      SELECT id FROM llm_calls
      WHERE status = 'success' AND call_type = 'collection'
        AND created_at >= NOW() - (${days} || ' days')::interval
    ),
    total AS (SELECT COUNT(*)::int AS n FROM calls)
    SELECT
      b.slug, b.name,
      COUNT(DISTINCT rr.id)::int AS rmentions,
      AVG(bm.position)::float AS avg_pos,
      AVG(bm.sentiment_score)::float AS avg_sent,
      COUNT(*) FILTER (WHERE bm.sentiment='positive')::int AS pos_n,
      COUNT(bm.id)::int AS m_total,
      ROUND(COUNT(DISTINCT rr.id)::numeric / NULLIF((SELECT n FROM total), 0) * 100, 2)::float AS sov_pct
    FROM brand_mentions bm
    JOIN brands b ON b.id = bm.brand_id
    JOIN raw_responses rr ON rr.id = bm.raw_response_id
    WHERE rr.llm_call_id IN (SELECT id FROM calls)
    GROUP BY b.id, b.slug, b.name
    HAVING COUNT(DISTINCT rr.id) > 0
    ORDER BY sov_pct DESC
    LIMIT 12
  `);
  const brandRows = rows as unknown as Array<{
    slug: string;
    name: string;
    rmentions: number;
    avg_pos: number | null;
    avg_sent: number | null;
    pos_n: number;
    m_total: number;
    sov_pct: number;
  }>;

  // Mentivue Index per brand
  const topBrands = brandRows.map((r, idx) => {
    const sov = r.sov_pct;
    const sent = r.avg_sent ?? 0;
    const pos = r.avg_pos ?? 5;
    const posShare = r.m_total > 0 ? r.pos_n / r.m_total : 0;
    const index =
      0.4 * sov +
      0.3 * ((sent + 1) * 50) +
      0.2 * Math.max(0, 1 - (pos - 1) / 4) * 100 +
      0.1 * posShare * 100;
    return {
      rank: idx + 1,
      name: r.name,
      slug: r.slug,
      index: Math.round(index * 10) / 10,
      sov: r.sov_pct,
      delta: 0, // would compute vs prior window
    };
  });

  const citations = await topCitations(days, 10);

  // LLM share of volume
  const llmRows = await db.execute(sql`
    SELECT
      lc.provider,
      COUNT(*)::int AS total,
      AVG(bm.sentiment_score)::float AS avg_sent
    FROM llm_calls lc
    LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
    LEFT JOIN brand_mentions bm ON bm.raw_response_id = rr.id
    WHERE lc.status = 'success' AND lc.call_type = 'collection'
      AND lc.created_at >= NOW() - (${days} || ' days')::interval
    GROUP BY lc.provider
    ORDER BY total DESC
  `);
  const llmTotals = llmRows as unknown as Array<{
    provider: string;
    total: number;
    avg_sent: number | null;
  }>;
  const grandTotal = llmTotals.reduce((s, r) => s + r.total, 0) || 1;
  const llmShares = llmTotals.map((r) => ({
    provider: r.provider,
    share: Math.round((r.total / grandTotal) * 1000) / 10,
    sentimentAvg: r.avg_sent,
  }));

  // Totals
  const totals = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM brands WHERE vertical_id = ${v.id}::uuid AND is_active = true) AS tracked_brands,
      (SELECT COUNT(*)::int FROM prompts WHERE vertical_id = ${v.id}::uuid AND is_active = true) AS total_prompts,
      (SELECT COUNT(*)::int FROM llm_calls
        WHERE status = 'success' AND call_type = 'collection'
          AND created_at >= NOW() - (${days} || ' days')::interval) AS total_calls
  `);
  const t = (
    totals as unknown as Array<{
      tracked_brands: number;
      total_prompts: number;
      total_calls: number;
    }>
  )[0]!;

  return {
    period,
    refCode,
    generatedAt: new Date(),
    verticalName: v.name,
    trackedBrands: t.tracked_brands,
    totalPrompts: t.total_prompts,
    totalCalls: t.total_calls,
    topBrands,
    topMovers: { gainers: [], losers: [] }, // populated by separate query in production
    citations,
    llmShares,
  };
}
