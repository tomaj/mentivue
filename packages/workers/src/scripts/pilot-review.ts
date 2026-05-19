// Renders a human-readable HTML review of the latest pilot run.
// Joins llm_calls (where metadata.pilot_run_id is set) → raw_responses →
// brand_mentions (with brand names) → response_quality. Writes a static
// HTML file you open in the browser and read top-to-bottom while filling in
// the quality questions from docs/PROMPT_CADENCE.md / the launch-readiness
// chat (relevance / brand extraction / sentiment / citations).
//
// Usage:
//   pnpm --filter @mentivue/workers pilot:review [run_id]
//
// If run_id is omitted, takes the most recent pilot run found in the DB.

import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '@mentivue/shared/db';
import { sql } from 'drizzle-orm';

const argRunId = process.argv[2];

const latest = argRunId
  ? [{ run_id: argRunId }]
  : ((await db.execute<{ run_id: string }>(sql`
      SELECT DISTINCT metadata->>'pilot_run_id' AS run_id
      FROM llm_calls
      WHERE metadata ? 'pilot_run_id'
      ORDER BY 1 DESC
      LIMIT 1
    `)) as unknown as Array<{ run_id: string }>);

if (latest.length === 0) {
  console.error('✗ No pilot runs found in DB. Run `pnpm --filter @mentivue/workers pilot` first.');
  process.exit(1);
}
const runId = latest[0]?.run_id;
if (!runId) {
  console.error('✗ Latest pilot row missing run_id.');
  process.exit(1);
}
console.log(`▸ Building review for pilot ${runId}`);

type PilotRow = {
  prompt_id: string;
  external_id: string;
  category: string;
  prompt_text: string;
  llm_call_id: string;
  provider: string;
  model: string;
  status: string;
  error_message: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  response_text: string | null;
  citations: Array<{ url: string; title?: string; domain?: string }> | null;
  quality_score: number | null;
  relevance: number | null;
  specificity: number | null;
  citation_quality: number | null;
  language_correctness: number | null;
  refused: boolean | null;
  quality_reasoning: string | null;
  language_detected: string | null;
  untracked_brands: string[] | null;
};

const rows = (await db.execute<PilotRow>(sql`
  SELECT
    p.id AS prompt_id,
    p.external_id,
    p.category,
    p.text AS prompt_text,
    lc.id AS llm_call_id,
    lc.provider,
    lc.model,
    lc.status,
    lc.error_message,
    lc.input_tokens,
    lc.output_tokens,
    lc.estimated_cost_usd AS cost_usd,
    lc.latency_ms,
    rr.response_text,
    rr.citations,
    rq.quality_score,
    rq.relevance,
    rq.specificity,
    rq.citation_quality,
    rq.language_correctness,
    rq.refused,
    rq.reasoning AS quality_reasoning,
    lc.metadata->>'language_detected' AS language_detected,
    (lc.metadata->'untracked_brands_seen')::jsonb AS untracked_brands
  FROM llm_calls lc
  JOIN prompts p ON p.id = lc.prompt_id
  LEFT JOIN raw_responses rr ON rr.llm_call_id = lc.id
  LEFT JOIN response_quality rq ON rq.llm_call_id = lc.id
  WHERE lc.call_type = 'collection'
    AND lc.metadata->>'pilot_run_id' = ${runId}
  ORDER BY p.category, p.external_id, lc.provider
`)) as unknown as PilotRow[];

if (rows.length === 0) {
  console.error(`✗ No rows for pilot run ${runId}.`);
  process.exit(1);
}

type Mention = {
  brand_slug: string;
  brand_name: string;
  position: number | null;
  context: string | null;
  mention_strength: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  sentiment_reasoning: string | null;
  llm_call_id: string;
};

const mentionRows = (await db.execute<Mention>(sql`
  SELECT
    b.slug AS brand_slug,
    b.name AS brand_name,
    bm.position,
    bm.context,
    bm.mention_strength,
    bm.sentiment,
    bm.sentiment_score,
    bm.sentiment_reasoning,
    rr.llm_call_id
  FROM brand_mentions bm
  JOIN brands b ON b.id = bm.brand_id
  JOIN raw_responses rr ON rr.id = bm.raw_response_id
  JOIN llm_calls lc ON lc.id = rr.llm_call_id
  WHERE lc.call_type = 'collection'
    AND lc.metadata->>'pilot_run_id' = ${runId}
  ORDER BY bm.position NULLS LAST, b.slug
`)) as unknown as Mention[];

const mentionsByCall = new Map<string, Mention[]>();
for (const m of mentionRows) {
  const arr = mentionsByCall.get(m.llm_call_id) ?? [];
  arr.push(m);
  mentionsByCall.set(m.llm_call_id, arr);
}

// Group by prompt
const promptMap = new Map<string, { prompt: PilotRow; calls: PilotRow[] }>();
for (const r of rows) {
  const key = r.prompt_id;
  const existing = promptMap.get(key);
  if (existing) existing.calls.push(r);
  else promptMap.set(key, { prompt: r, calls: [r] });
}

function escHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sentimentBadge(sentiment: string | null, score: number | null): string {
  if (!sentiment) return '';
  const color =
    sentiment === 'positive' ? '#15803d' : sentiment === 'negative' ? '#b91c1c' : '#6b7280';
  const s = score == null ? '' : ` (${score.toFixed(2)})`;
  return `<span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:11px;">${sentiment}${s}</span>`;
}

function strengthBadge(strength: string | null): string {
  if (!strength) return '';
  const color =
    strength === 'primary' ? '#1d4ed8' : strength === 'secondary' ? '#7c3aed' : '#9ca3af';
  return `<span style="background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:11px;">${strength}</span>`;
}

function qualityBadge(score: number | null): string {
  if (score == null) return '—';
  const color = score >= 8 ? '#15803d' : score >= 5 ? '#b45309' : '#b91c1c';
  return `<span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-weight:600;">${score.toFixed(1)}/10</span>`;
}

const categoryHeaders: Record<string, string> = {
  commercial_intent: 'Commercial Intent — rozhodovacia fáza',
  comparison: 'Comparison — brand vs brand',
  discovery: 'Discovery — najlepší eshop',
  long_tail: 'Long-tail — špecifický scenár (repasované)',
};

const grouped = new Map<string, Array<{ prompt: PilotRow; calls: PilotRow[] }>>();
for (const entry of promptMap.values()) {
  const arr = grouped.get(entry.prompt.category) ?? [];
  arr.push(entry);
  grouped.set(entry.prompt.category, arr);
}

const totalCost = rows.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
const totalCalls = rows.length;
const successful = rows.filter((r) => r.status === 'success').length;
const refused = rows.filter((r) => r.refused).length;
const avgQuality =
  rows.filter((r) => r.quality_score != null).reduce((s, r) => s + (r.quality_score ?? 0), 0) /
  Math.max(1, rows.filter((r) => r.quality_score != null).length);

const sections: string[] = [];

for (const [catKey, label] of Object.entries(categoryHeaders)) {
  const items = grouped.get(catKey);
  if (!items) continue;
  sections.push(
    `<h2 style="margin-top:48px;border-bottom:2px solid #111;padding-bottom:6px;">${label}</h2>`,
  );
  for (const { prompt: p, calls } of items) {
    sections.push(`
      <div class="prompt-block">
        <h3>
          <code class="ext-id">${escHtml(p.external_id)}</code>
          ${escHtml(p.prompt_text)}
        </h3>
        <div class="providers">
          ${calls
            .map((c) => {
              const mentions = mentionsByCall.get(c.llm_call_id) ?? [];
              const mentionList =
                mentions.length === 0
                  ? '<em style="color:#9ca3af;">— žiadne tracked brandy —</em>'
                  : mentions
                      .map(
                        (m) => `
                <li>
                  <strong>${m.position ?? '?'}.</strong>
                  <strong>${escHtml(m.brand_name)}</strong>
                  ${strengthBadge(m.mention_strength)}
                  ${sentimentBadge(m.sentiment, m.sentiment_score)}
                  ${m.sentiment_reasoning ? `<div class="reasoning">${escHtml(m.sentiment_reasoning)}</div>` : ''}
                  ${m.context ? `<div class="context">"${escHtml(m.context.slice(0, 250))}"</div>` : ''}
                </li>`,
                      )
                      .join('');

              const untracked =
                c.untracked_brands && c.untracked_brands.length > 0
                  ? `<div class="untracked"><strong>Untracked brands seen:</strong> ${(c.untracked_brands as string[]).map(escHtml).join(', ')}</div>`
                  : '';

              const cites = c.citations ?? [];
              const citesHtml =
                cites.length === 0
                  ? ''
                  : `<details class="citations"><summary>${cites.length} citation(s)</summary><ul>${cites
                      .slice(0, 20)
                      .map(
                        (cit) =>
                          `<li><a href="${escHtml(cit.url)}" target="_blank">${escHtml(cit.domain ?? cit.url)}</a>${cit.title ? ` — ${escHtml(cit.title)}` : ''}</li>`,
                      )
                      .join('')}</ul></details>`;

              const responseText = c.response_text ?? '';
              const isError = c.status !== 'success';

              return `
              <div class="provider-card ${isError ? 'error' : ''}">
                <div class="provider-head">
                  <strong>${escHtml(c.provider)}</strong>
                  <span class="model">${escHtml(c.model)}</span>
                  ${qualityBadge(c.quality_score)}
                  ${c.refused ? '<span class="refused">REFUSED</span>' : ''}
                  ${c.language_detected && c.language_detected !== 'sk' ? `<span class="lang-warn">lang=${escHtml(c.language_detected)}</span>` : ''}
                </div>
                <div class="meta">
                  ${c.output_tokens ?? 0} tokens out · ${cites.length} cites · $${(c.cost_usd ?? 0).toFixed(5)} · ${c.latency_ms ?? 0}ms
                </div>
                ${isError ? `<div class="err">${escHtml(c.error_message ?? '')}</div>` : ''}
                <details class="response"${responseText.length < 600 ? ' open' : ''}>
                  <summary>Response (${responseText.length} chars)</summary>
                  <div class="response-text">${escHtml(responseText)}</div>
                </details>
                <div class="mentions">
                  <strong>Extracted mentions (${mentions.length}):</strong>
                  <ol>${mentionList}</ol>
                  ${untracked}
                </div>
                ${citesHtml}
                ${c.quality_reasoning ? `<div class="q-reasoning"><strong>Quality reasoning:</strong> ${escHtml(c.quality_reasoning)}</div>` : ''}
              </div>`;
            })
            .join('')}
        </div>
      </div>
    `);
  }
}

const html = `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<title>Pilot review — ${escHtml(runId)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 1400px; margin: 24px auto; padding: 0 24px; color: #111; }
  h1 { margin: 0; font-size: 22px; }
  h2 { font-size: 18px; margin-top: 32px; }
  h3 { font-size: 14px; font-weight: 600; margin: 12px 0 8px; }
  .ext-id { background:#eef2ff;color:#3730a3;padding:2px 6px;border-radius:3px;font-size:11px;margin-right:8px;font-weight:400; }
  .summary { background: #f9fafb; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; }
  .summary span { display:inline-block;margin-right:24px; }
  .prompt-block { margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background:#fff; }
  .providers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .provider-card { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; font-size: 13px; background: #fafafa; }
  .provider-card.error { background: #fef2f2; border-color: #fca5a5; }
  .provider-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .provider-head .model { font-size: 11px; color: #6b7280; font-family: monospace; }
  .refused { background: #b91c1c; color: white; padding: 1px 6px; border-radius: 3px; font-size: 11px; }
  .lang-warn { background: #f59e0b; color: white; padding: 1px 6px; border-radius: 3px; font-size: 11px; }
  .meta { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
  .err { color: #b91c1c; font-family: monospace; font-size: 12px; padding: 4px 0; }
  .response { margin: 6px 0; }
  .response summary { cursor: pointer; font-size: 11px; color: #6b7280; }
  .response-text { white-space: pre-wrap; background:#f3f4f6; padding:8px; border-radius:4px; margin-top:4px; font-size:12px; max-height: 400px; overflow-y: auto; }
  .mentions ol { padding-left: 18px; margin: 4px 0; }
  .mentions li { margin: 4px 0; }
  .context { background:#fffbeb; padding:4px 6px; border-left:2px solid #f59e0b; margin-top:3px; font-size:11px; }
  .reasoning { color:#6b7280; font-size:11px; font-style: italic; margin-top:2px; }
  .untracked { margin-top:6px; padding:4px 8px; background:#fef3c7; border-radius:3px; font-size:11px; }
  .citations { margin-top: 8px; font-size: 11px; }
  .citations summary { cursor: pointer; color: #6b7280; }
  .citations ul { margin: 4px 0 0 0; padding-left: 18px; }
  .q-reasoning { font-size: 11px; color: #4b5563; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #d1d5db; }
  .checklist { background:#ecfdf5; padding:16px; border-radius:6px; margin-top:24px; font-size:13px; line-height:1.6; }
</style>
</head>
<body>
<h1>Pilot review · <code>${escHtml(runId)}</code></h1>
<div class="summary">
  <span><strong>${totalCalls}</strong> prompt × provider pairs</span>
  <span><strong>${successful}</strong> successful</span>
  <span><strong>${refused}</strong> refused</span>
  <span><strong>${avgQuality.toFixed(2)}/10</strong> avg quality</span>
  <span><strong>$${totalCost.toFixed(4)}</strong> total cost</span>
</div>

<div class="checklist">
  <strong>Pri prechode si pre každý prompt × provider over štyri otázky:</strong>
  <ol>
    <li><strong>Relevancia</strong> — odpovedal LLM na otázku (nie generický refusal)? Spomenul slovenské brandy, nie len Amazon/Best Buy?</li>
    <li><strong>Brand extraction</strong> — zachytil analyzer všetky reálne zmienky? Žiadne false positives? Aliases (Alza vs alza.sk) fungujú?</li>
    <li><strong>Sentiment</strong> — dáva sentiment zmysel (positive/neutral/negative + score)? Nie je príliš confident pri neutral mentions?</li>
    <li><strong>Citations</strong> — sú citation domains zachytené? Heureka.sk dominantná?</li>
  </ol>
  Problémy zapíš ako rule: "fix needed: X" a iterujeme.
</div>

${sections.join('\n')}

</body>
</html>`;

const outDir = path.join(process.cwd(), 'packages/app/storage/pilot');
await fs.mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, `${runId}.html`);
await fs.writeFile(outFile, html, 'utf8');

console.log(`✓ Wrote ${outFile}`);
console.log(`  prompts:  ${promptMap.size}`);
console.log(`  calls:    ${totalCalls} (${successful} ok, ${refused} refused)`);
console.log(`  mentions: ${mentionRows.length}`);
console.log(`  cost:     $${totalCost.toFixed(4)}`);
console.log(`  avg q:    ${avgQuality.toFixed(2)}/10`);
console.log('');
console.log(`Open: file://${outFile}`);

process.exit(0);
