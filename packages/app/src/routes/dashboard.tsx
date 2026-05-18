import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { brands, db } from '@mentivue/shared/db';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { C, Delta, MonoLabel, Num, timeOfDayGreeting } from '../components/primitives.tsx';
import { WelcomeStrip } from '../components/Chrome.tsx';
import {
  anomalyTags,
  anomalyTitle,
  AnomalyCard,
  CitationList,
  DonutMini,
  heatmapColKeys,
  heatmapRowKeys,
  LLMCard,
  MetricCard,
  Section,
  SoVBars,
  SoVTrendChart,
  Sparkline,
  TopicHeatmap,
  UpcomingCard,
} from '../components/Widgets.tsx';
import {
  klientAnomalies,
  klientIndexSparkline,
  klientIndexSummary,
  lastUpdateAt,
  llmProviderBreakdown,
  sovTrendMultiBrand,
  topBrandsSov,
  topCitations,
  topicHeatmap,
  upcomingItems,
} from '../lib/dashboard-queries.ts';

const dash = new Hono();

function quarterLabel(d = new Date()): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function firstName(klient: { name: string | null; email: string }): string {
  if (klient.name) return klient.name.split(/\s+/)[0] ?? klient.name;
  return klient.email.split('@')[0] ?? klient.email;
}

dash.get('/app/dashboard', async (c) => {
  const klient = c.get('klient');

  if (!klient.brandId) {
    return c.html(
      <AppLayout
        klient={klient}
        active="dashboard"
        title="Dashboard"
        crumbs={['Dashboard']}
        brandName="—"
      >
        <div style="padding:48px 28px;color:#1F2429">
          <p>Pre váš účet ešte nie je priradená sledovaná značka. Kontaktujte <a href="mailto:tomas@mentivue.sk" style="color:#FF5B3A;border-bottom:1px solid #FF5B3A">tomas@mentivue.sk</a>.</p>
        </div>
      </AppLayout>,
    );
  }

  const brand = await db.query.brands.findFirst({ where: eq(brands.id, klient.brandId) });
  if (!brand) return c.text('Brand not found.', 500);

  // Parallel data load
  const [summary, sparkline, topBrands, llmRows, anomalies, citations, heatmapRows, lastUpdate, upcoming] =
    await Promise.all([
      klientIndexSummary(klient.brandId, 30),
      klientIndexSparkline(klient.brandId, 30),
      topBrandsSov(klient.brandId, 30, 4),
      llmProviderBreakdown(klient.brandId, 30),
      klientAnomalies(klient.brandId),
      topCitations(30, 10),
      topicHeatmap(klient.brandId, heatmapRowKeys, heatmapColKeys, 30),
      lastUpdateAt(),
      upcomingItems(klient.id),
    ]);

  // SoV trend needs top 3 competitor brand IDs
  const competitorIds = topBrands.filter((b) => !b.is_klient).slice(0, 3).map((b) => b.brand_id);
  const trendCells = await sovTrendMultiBrand(klient.brandId, competitorIds, 90, 'week');

  const heatmapCells = new Map<string, { sentiment: number | null; sample: number }>();
  for (const cell of heatmapRows) {
    if (cell.row_label && cell.col_label) {
      heatmapCells.set(`${cell.row_label}|${cell.col_label}`, {
        sentiment: cell.sentiment_avg,
        sample: cell.sample_size,
      });
    }
  }

  const index = summary.mentivue_index ?? 0;
  const indexPrev = summary.mentivue_index_prev ?? 0;
  const indexDelta = summary.mentivue_index !== null && summary.mentivue_index_prev !== null
    ? summary.mentivue_index - summary.mentivue_index_prev
    : null;
  const indexValues = sparkline.map((s) => s.mentivue_index);

  const sov = summary.current_sov_pct ?? 0;
  const sovDelta = summary.delta_pp;

  const avgPos = summary.avg_position;
  const sentiment = summary.avg_sentiment_score ?? 0;
  const sentimentDelta = (() => {
    if (summary.mentivue_index_prev === null || summary.mentivue_index === null) return null;
    // Roughly proxy sentiment delta from the index components; not perfect but indicative
    return null;
  })();

  const greeting = timeOfDayGreeting();
  const fname = firstName(klient);
  const anomalyCount = anomalies.length;

  return c.html(
    <AppLayout
      klient={klient}
      active="dashboard"
      title="Dashboard"
      crumbs={['Dashboard', brand.name, quarterLabel()]}
      brandName={brand.name}
      brandPeriod={`${quarterLabel()} · VLNA I`}
      anomalyCount={anomalyCount}
    >
      <div style="overflow-y:auto;flex:1">
        <WelcomeStrip
          greeting={greeting}
          firstName={fname}
          anomalyCount={anomalyCount}
          brandName={brand.name}
          lastUpdate={lastUpdate}
        />

        <main style="display:grid;grid-template-columns:minmax(0, 1fr) 304px;gap:24px;padding:24px 28px 40px">
          {/* CENTER COLUMN */}
          <div style="display:flex;flex-direction:column;gap:32px;min-width:0">
            {/* Metric cards row */}
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:0">
              <MetricCard
                label="Mentivue Index"
                value={summary.mentivue_index !== null ? summary.mentivue_index.toFixed(1) : '—'}
                valueEm
                viz={<Sparkline values={indexValues} color={C.signal} fill />}
                delta={
                  indexDelta === null ? (
                    <span style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:11.5px`}>—</span>
                  ) : (
                    <Delta
                      value={`${indexDelta >= 0 ? '+' : ''}${indexDelta.toFixed(1)}`}
                      direction={indexDelta > 0 ? 'up' : indexDelta < 0 ? 'down' : 'flat'}
                    />
                  )
                }
                deltaLabel="vs predošlých 30 dní"
                noRight
              />
              <MetricCard
                label="Share of Voice"
                value={sov.toFixed(1)}
                sub="%"
                viz={<SoVBars rows={topBrands} />}
                delta={
                  sovDelta === null ? (
                    <span style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:11.5px`}>—</span>
                  ) : (
                    <Delta
                      value={`${sovDelta >= 0 ? '+' : ''}${sovDelta.toFixed(1)} pp`}
                      direction={sovDelta > 0 ? 'up' : sovDelta < 0 ? 'down' : 'flat'}
                    />
                  )
                }
                deltaLabel="vs predošlých 30 dní"
                noRight
              />
              <MetricCard
                label="Avg Position"
                value={avgPos !== null ? avgPos.toFixed(1) : '—'}
                sub="/ 5"
                viz={
                  <div style="width:100%;display:flex;flex-direction:column;gap:8px;justify-content:center">
                    <div style="display:flex;gap:4px">
                      {[1, 2, 3, 4, 5].map((p) => {
                        const isInBucket = avgPos !== null && p <= Math.ceil(avgPos);
                        const dim = avgPos !== null && p === Math.ceil(avgPos);
                        return (
                          <div
                            style={`flex:1;height:10px;background:${isInBucket ? C.signal : C.bone};opacity:${dim ? 0.6 : 1}`}
                          />
                        );
                      })}
                    </div>
                    <Num size={10} color={C.inkSoft}>Z ~5 značiek v odpovedi</Num>
                  </div>
                }
                delta={
                  <span style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:11.5px`}>1 = prvé miesto</span>
                }
                deltaLabel="nižšie = lepšie"
                noRight
              />
              <MetricCard
                label="Sentiment"
                value={`${sentiment >= 0 ? '+' : ''}${sentiment.toFixed(2)}`}
                viz={
                  <div style="display:flex;align-items:center;gap:14px">
                    <DonutMini
                      pos={summary.positive_mentions}
                      neu={summary.neutral_mentions}
                      neg={summary.negative_mentions}
                      size={56}
                    />
                    <div style="display:flex;flex-direction:column;gap:4px">
                      <Num size={10} color={C.positive}>● {summary.positive_pct !== null ? `${summary.positive_pct.toFixed(0)} % positive` : '—'}</Num>
                      <Num size={10} color={C.inkSoft}>● {summary.total_mentions > 0 ? `${((summary.neutral_mentions / summary.total_mentions) * 100).toFixed(0)} % neutrálne` : '—'}</Num>
                      <Num size={10} color={C.negative}>● {summary.total_mentions > 0 ? `${((summary.negative_mentions / summary.total_mentions) * 100).toFixed(0)} % negative` : '—'}</Num>
                    </div>
                  </div>
                }
                delta={
                  <span style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:11.5px`}>{summary.total_mentions} zmienok</span>
                }
                deltaLabel="−1 ÷ +1"
              />
            </div>

            {/* LLM engine breakdown */}
            <Section title="AI enginy" subtitle="Posledných 30 dní · klik na engine pre detail">
              <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px">
                {llmRows.length === 0 ? (
                  <div style={`grid-column:1/-1;color:${C.inkSoft};font-size:13px;padding:16px`}>Žiadne provider dáta.</div>
                ) : (
                  llmRows.map((row) => <LLMCard row={row} />)
                )}
              </div>
            </Section>

            {/* SoV Trend Chart */}
            <Section
              title={<>90-denný <em style={`font-style:italic;color:${C.signal};font-weight:400`}>Share of Voice</em></>}
              subtitle="Vaša značka vs top 3 konkurenti · týždenný cadence"
            >
              <div style={`border:1px solid ${C.ink};background:${C.paperPure};padding:24px 24px 8px`}>
                <SoVTrendChart data={trendCells} klientSlug={brand.slug} />
              </div>
            </Section>

            {/* Topic heatmap + citations */}
            <div style="display:grid;grid-template-columns:minmax(0, 1.5fr) minmax(0, 1fr);gap:24px">
              <Section title="Topic coverage" subtitle="Kde dominujete a kde strácate">
                <div style={`border:1px solid ${C.ink};background:${C.paperPure};padding:20px`}>
                  <TopicHeatmap cells={heatmapCells} />
                </div>
              </Section>
              <Section title="Citation sources" subtitle="Top 10 domén citovaných v odpovediach">
                <div style={`border:1px solid ${C.ink};background:${C.paperPure};padding:4px 22px 16px`}>
                  <CitationList rows={citations} />
                </div>
              </Section>
            </div>

            {/* Anomalies */}
            <Section
              title="Anomálie tento týždeň"
              subtitle={
                anomalyCount > 0 ? (
                  <span style={`color:${C.signal};font-family:${C.fontMono};font-size:12px;letter-spacing:0.14em;text-transform:uppercase`}>
                    {anomalyCount} {anomalyCount === 1 ? 'vyžaduje vašu pozornosť' : 'vyžadujú vašu pozornosť'}
                  </span>
                ) : (
                  <span style={`color:${C.inkSoft};font-family:${C.fontMono};font-size:12px`}>Stabilný týždeň</span>
                )
              }
            >
              <div id="anomalies" style="display:flex;flex-direction:column;gap:12px">
                {anomalies.length === 0 ? (
                  <div style={`border:1px solid ${C.bone};padding:24px;color:${C.inkSoft};font-size:13px;background:${C.paperPure}`}>
                    Žiadne signifikantné odchýlky vs predošlý týždeň.
                  </div>
                ) : (
                  anomalies.slice(0, 5).map((a) => (
                    <AnomalyCard
                      severity={a.severity}
                      title={anomalyTitle(a)}
                      context={a.context}
                      tags={anomalyTags(a)}
                      detectedAt={a.detected_at}
                    />
                  ))
                )}
              </div>
            </Section>
          </div>

          {/* RIGHT RAIL */}
          <aside style={`background:${C.paperPure};border:1px solid ${C.ink};align-self:flex-start;position:sticky;top:24px;display:flex;flex-direction:column`}>
            <div style="padding:20px 20px 14px">
              <MonoLabel size={10} tracking="0.18em">Pripravujeme pre vás</MonoLabel>
            </div>
            {upcoming.length === 0 ? (
              <div style={`padding:24px 20px;color:${C.inkSoft};font-size:13px;border-top:1px solid ${C.bone}`}>
                Žiadne nadchádzajúce reporty.
              </div>
            ) : (
              upcoming.map((u) => (
                <UpcomingCard kind={u.kind} title={u.title} date={u.date} action={u.action} />
              ))
            )}
            <div style={`padding:18px 20px;border-top:1px solid ${C.bone};background:${C.bone}`}>
              <MonoLabel size={9} tracking="0.22em">Index · {quarterLabel()} · live</MonoLabel>
              <div style="margin-top:10px;display:flex;align-items:baseline;gap:8px">
                <span style={`font-family:${C.fontDisplay};font-size:32px;font-weight:400;color:${C.ink};letter-spacing:-0.025em`}>
                  {topBrands.findIndex((b) => b.is_klient) >= 0
                    ? `#${topBrands.findIndex((b) => b.is_klient) + 1}`
                    : '—'}
                </span>
                <Num size={11} color={C.inkSoft}>z {topBrands.length} značiek</Num>
              </div>
              <Num size={10} color={C.inkSoft}>Aktualizácia · PO 09:00 SEČ</Num>
            </div>
          </aside>
        </main>
      </div>
    </AppLayout>,
  );
});

export default dash;
