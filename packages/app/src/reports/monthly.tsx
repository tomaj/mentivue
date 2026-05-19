// Renders Monthly Action Report HTML from MonthlyData. Faithful to the
// `~/Downloads/mentivue/reports/Monthly.html` prototype: cover, exec summary,
// drivers, anomalies, competitors, 30-day action plan, colophon.

import type { FC } from 'hono/jsx';
import type { MonthlyData } from './data.ts';
import {
  Eyebrow,
  fmtDate,
  fmtIndex,
  fmtPct,
  fmtSentiment,
  fmtSigned,
  LogoSvg,
  Page,
  ReportDoc,
  RunFoot,
  RunHead,
} from './shell.tsx';

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

const monthlyCss = `
.confidential { font-family: var(--font-mono); font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--signal); }
.delta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--ink); margin-top: 14pt; }
.delta-grid > div { padding: 14pt 16pt; border-right: 1px solid var(--bone-deep); display: flex; flex-direction: column; gap: 6pt; }
.delta-grid > div:last-child { border-right: none; }
.delta-grid .lbl { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); }
.delta-grid .val { font-family: var(--font-display); font-size: 22pt; font-weight: 400; letter-spacing: -0.022em; color: var(--ink); line-height: 1; }
.delta-grid .from { font-family: var(--font-mono); font-size: 9pt; color: var(--ink-soft); }
.delta-grid .d { font-family: var(--font-mono); font-size: 11pt; font-weight: 500; }
.delta-grid .d.up { color: var(--positive); }
.delta-grid .d.dn { color: var(--negative); }
.delta-grid .d.flat { color: var(--ink-soft); }
.delta-grid svg { width: 100%; height: 24pt; display: block; margin-top: 4pt; }
.anom-large { border: 1px solid var(--ink); background: var(--paper-pure); padding: 18pt 20pt; margin-bottom: 14pt; display: flex; flex-direction: column; gap: 10pt; border-left: 3pt solid var(--signal); }
.anom-large.red { border-left-color: var(--negative); }
.anom-large .top { display: flex; gap: 12pt; align-items: center; font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-soft); }
.anom-large .top .sev { width: 8pt; height: 8pt; border-radius: 50%; background: var(--signal); }
.anom-large.red .top .sev { background: var(--negative); }
.anom-large h3 { font-family: var(--font-display); font-weight: 500; font-size: 19pt; letter-spacing: -0.015em; margin: 0; line-height: 1.2; max-width: 32ch; }
.anom-large p { margin: 0; font-size: 10.5pt; line-height: 1.55; color: var(--ink-soft); }
.anom-large .cta { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--signal); }
.competitor-card { border: 1px solid var(--ink); background: var(--paper-pure); padding: 14pt 16pt; margin-bottom: 10pt; }
.competitor-card .top { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6pt; border-bottom: 1px solid var(--bone-deep); margin-bottom: 8pt; }
.competitor-card .top .name { font-family: var(--font-display); font-size: 16pt; font-weight: 500; letter-spacing: -0.013em; }
.competitor-card .top .when { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; color: var(--ink-soft); }
.competitor-card .row { display: grid; grid-template-columns: 80pt 1fr; gap: 12pt; padding: 4pt 0; font-size: 10pt; }
.competitor-card .row .k { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.14em; color: var(--ink-soft); text-transform: uppercase; padding-top: 2pt; }
.competitor-card .row .v { color: var(--ink); line-height: 1.45; }
.competitor-card .row .v.coral { color: var(--signal); font-weight: 500; }
.tracking-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 9pt; margin-top: 12pt; }
.tracking-table th { text-align: left; font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); padding: 8pt; border-bottom: 1px solid var(--ink); background: var(--bone); font-weight: 500; }
.tracking-table td { padding: 7pt 8pt; border-bottom: 1px solid rgba(14,17,22,0.08); }
.action-week { margin-bottom: 14pt; }
.action-week h4 { font-family: var(--font-display); font-size: 13pt; font-weight: 500; letter-spacing: -0.012em; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1px solid var(--ink); display: flex; justify-content: space-between; align-items: baseline; }
.action-week h4 .wk { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; color: var(--signal); }
.action-week .day-row { display: grid; grid-template-columns: 80pt 1fr; gap: 12pt; padding: 5pt 0; border-bottom: 1px solid rgba(14,17,22,0.06); align-items: baseline; }
.action-week .day-row .day { font-family: var(--font-mono); font-size: 8.5pt; letter-spacing: 0.1em; color: var(--ink-soft); text-transform: uppercase; }
.action-week .day-row .what { font-size: 10pt; color: var(--ink); line-height: 1.4; }
`;

// ─── Tiny inline sparkline (no axes, just polyline) ───
const InlineSpark: FC<{ values: number[]; stroke?: string }> = ({ values, stroke = '#FF5B3A' }) => {
  if (values.length === 0) return <svg viewBox="0 0 100 24" preserveAspectRatio="none" />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = 100 / Math.max(values.length - 1, 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(24 - ((v - min) / range) * 20 - 2).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} stroke-width="1.5" points={pts} />
    </svg>
  );
};

// ─── Page 1 · Cover ───
const Cover: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page classes="cover">
    <div class="cover-top">
      <LogoSvg size={48} />
      <span>
        Mentivue · Monthly Action Report · <span class="confidential">Confidential</span>
      </span>
    </div>
    <div class="cover-headline">
      <h1 style="font-size: 56pt;">
        {d.period.label.split(' ')[0]}
        <br />
        Action
        <br />
        Report
      </h1>
      <div class="sub" style="font-size: 32pt;">
        {d.brand.name}
        <br />
        {d.period.label}
      </div>
    </div>
    <div class="cover-foot">
      <div class="meta">
        <span>Pre</span>
        <span class="v">
          {d.klient.name ?? d.klient.email} · {d.brand.name}
        </span>
        <span>Obdobie</span>
        <span class="v">{d.period.label}</span>
        <span>Generované</span>
        <span class="v">{fmtDate(d.generatedAt)}</span>
      </div>
      <div class="ref">
        {d.refCode}
        <br />
        {d.brand.slug.toUpperCase()}
      </div>
    </div>
    <div class="cover-mark">
      <LogoSvg size={48} />
    </div>
  </Page>
);

// ─── Page 2 · TOC ───
const TocPage: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · ${d.period.label} · ${d.brand.name}`} right="Obsah" />
    <Eyebrow>Obsah · 5 sekcií · ~10 min čítania</Eyebrow>
    <h1 class="opener">
      Tento mesiac <em>v skratke.</em>
    </h1>
    <div class="toc-grid" style="margin-top:12pt;">
      <div class="toc-col">
        <div class="toc-row">
          <span class="n">01</span>
          <span class="t">
            Čo sa zmenilo<span class="sub">Key metrics vs predošlé obdobie</span>
          </span>
          <span class="p">03</span>
        </div>
        <div class="toc-row">
          <span class="n">02</span>
          <span class="t">
            Anomálie<span class="sub">{d.anomalies.length} udalostí mesiaca</span>
          </span>
          <span class="p">04</span>
        </div>
        <div class="toc-row">
          <span class="n">03</span>
          <span class="t">
            Konkurencia<span class="sub">Top {d.topCompetitors.length} značky</span>
          </span>
          <span class="p">05</span>
        </div>
      </div>
      <div class="toc-col">
        <div class="toc-row">
          <span class="n">04</span>
          <span class="t">
            AI enginy<span class="sub">Provider breakdown</span>
          </span>
          <span class="p">06</span>
        </div>
        <div class="toc-row">
          <span class="n">05</span>
          <span class="t">
            30-day action plan<span class="sub">Týždeň po týždni</span>
          </span>
          <span class="p">07</span>
        </div>
      </div>
    </div>
    <RunFoot ref={d.refCode} brand={d.brand.name} page="02 / 09" />
  </Page>
);

// ─── Page 3 · What changed ───
const WhatChanged: FC<{ d: MonthlyData }> = ({ d }) => {
  const dir = (delta: number | null): 'up' | 'dn' | 'flat' =>
    delta === null ? 'flat' : delta > 0.05 ? 'up' : delta < -0.05 ? 'dn' : 'flat';
  const indexDir = dir(d.index.delta);
  const sovDir = dir(d.sov.delta);
  return (
    <Page>
      <RunHead
        left={`Mentivue · ${d.period.label} · ${d.brand.name}`}
        right="01 · Čo sa zmenilo"
        confidential
      />
      <Eyebrow>01 / Čo sa zmenilo</Eyebrow>
      <h1 class="opener">
        Mesiac <em>v číslach.</em>
      </h1>
      <p class="opener-sub">
        Mentivue Index {fmtSigned(d.index.delta)} bodu ({fmtIndex(d.index.previous)} →{' '}
        {fmtIndex(d.index.current)}). SoV {fmtSigned(d.sov.delta, ' pp')} ({fmtPct(d.sov.previous)}{' '}
        → {fmtPct(d.sov.current)}).
      </p>

      <div class="delta-grid">
        <div>
          <span class="lbl">Mentivue Index</span>
          <span class="val">{fmtIndex(d.index.current)}</span>
          <span class="from">
            {fmtIndex(d.index.previous)} → {fmtIndex(d.index.current)}
          </span>
          <span class={`d ${indexDir}`}>
            {fmtSigned(d.index.delta)} {indexDir === 'up' ? '↑' : indexDir === 'dn' ? '↓' : '—'}
          </span>
          <InlineSpark values={d.sparkline} />
        </div>
        <div>
          <span class="lbl">Share of Voice</span>
          <span class="val">{fmtPct(d.sov.current)}</span>
          <span class="from">
            {fmtPct(d.sov.previous)} → {fmtPct(d.sov.current)}
          </span>
          <span class={`d ${sovDir}`}>
            {fmtSigned(d.sov.delta, ' pp')} {sovDir === 'up' ? '↑' : sovDir === 'dn' ? '↓' : '—'}
          </span>
          <InlineSpark values={d.sparkline} stroke="#0E1116" />
        </div>
        <div>
          <span class="lbl">Position</span>
          <span class="val">
            {d.position.current !== null ? d.position.current.toFixed(1).replace('.', ',') : '—'}
          </span>
          <span class="from">Z ~5 značiek v odpovedi</span>
          <span class="d flat">
            {d.position.current !== null && d.position.current < 2 ? '↑ vedúca pozícia' : '—'}
          </span>
          <InlineSpark values={d.sparkline} stroke="#0E1116" />
        </div>
        <div>
          <span class="lbl">Sentiment</span>
          <span class="val">
            {d.sentiment.current !== null ? fmtSentiment(d.sentiment.current) : '—'}
          </span>
          <span class="from">−1 ÷ +1</span>
          <span class="d flat">
            {d.sentiment.current !== null && d.sentiment.current > 0.5 ? '↑ silne pozitívny' : '—'}
          </span>
          <InlineSpark values={d.sparkline} />
        </div>
      </div>

      <p style="margin-top: 18pt;">{d.driverNarrative}</p>
      <p>{d.outlook}</p>
      <p class="source">
        Zdroj: Mentivue Research · {fmtDate(d.period.start)} – {fmtDate(d.period.end)} · 4 enginy
      </p>
      <RunFoot ref={d.refCode} brand={d.brand.name} page="03 / 09" />
    </Page>
  );
};

// ─── Page 4 · Anomalies ───
const AnomaliesPage: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · ${d.period.label} · ${d.brand.name}`}
      right="02 · Anomálie"
      confidential
    />
    <Eyebrow>02 / Anomálie</Eyebrow>
    <h1 class="opener">
      {d.anomalies.length === 0 ? (
        <>
          Stabilný <em>mesiac.</em>
        </>
      ) : (
        <>
          {d.anomalies.length}{' '}
          {d.anomalies.length === 1 ? 'udalosť' : d.anomalies.length < 5 ? 'udalosti' : 'udalostí'}{' '}
          <em>mesiaca.</em>
        </>
      )}
    </h1>

    {d.anomalies.length === 0 ? (
      <p style="margin-top: 18pt;">
        V posledných 7 dňoch sme nezaznamenali signifikantné odchýlky vs predošlý týždeň. Index, SoV
        aj sentiment sa pohybovali v očakávanom rozsahu naprieč všetkými 4 enginmi.
      </p>
    ) : (
      d.anomalies.slice(0, 3).map((a) => (
        <div class={`anom-large ${a.severity === 'red' ? 'red' : ''}`}>
          <div class="top">
            <span class="sev" />
            <span>
              {a.severity === 'red' ? 'Kritické' : a.severity === 'green' ? 'Pozitívne' : 'Pozor'} ·{' '}
              {PROVIDER_LABELS[a.provider] ?? a.provider}
            </span>
            {a.subcategory && (
              <>
                <span>·</span>
                <span>{a.subcategory}</span>
              </>
            )}
          </div>
          <h3>
            {a.kind === 'sov_drop' &&
              `${PROVIDER_LABELS[a.provider] ?? a.provider} SoV klesol o ${Math.abs(a.delta).toFixed(1)} pp v kategórii ${a.subcategory ?? '—'}.`}
            {a.kind === 'sov_jump' &&
              `${PROVIDER_LABELS[a.provider] ?? a.provider} SoV stúpol o ${a.delta.toFixed(1)} pp v kategórii ${a.subcategory ?? '—'}.`}
            {a.kind === 'sentiment_drop' &&
              `${PROVIDER_LABELS[a.provider] ?? a.provider} sentiment klesol o ${Math.abs(a.delta).toFixed(2)} v kategórii ${a.subcategory ?? '—'}.`}
            {a.kind === 'sentiment_jump' &&
              `${PROVIDER_LABELS[a.provider] ?? a.provider} sentiment stúpol o ${a.delta.toFixed(2)} v kategórii ${a.subcategory ?? '—'}.`}
          </h3>
          <p>{a.context}</p>
          <span class="cta">→ Sledujte v dashboarde / Pulse</span>
        </div>
      ))
    )}

    <RunFoot ref={d.refCode} brand={d.brand.name} page="04 / 09" />
  </Page>
);

// ─── Page 5 · Competitors ───
const CompetitorsPage: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · ${d.period.label} · ${d.brand.name}`}
      right="03 · Konkurencia"
      confidential
    />
    <Eyebrow>03 / Konkurencia</Eyebrow>
    <h1 class="opener">
      Top {d.topCompetitors.length} <em>tento mesiac.</em>
    </h1>

    {d.topCompetitors.length === 0 ? (
      <p style="margin-top: 18pt;">
        V tomto období sme nezachytili signifikantné konkurenčné pohyby.
      </p>
    ) : (
      d.topCompetitors.map((c) => (
        <div class="competitor-card">
          <div class="top">
            <span class="name">{c.brand_name}</span>
            <span class="when">{fmtPct(c.sov_pct)} SoV</span>
          </div>
          <div class="row">
            <span class="k">Pozícia</span>
            <span class="v">{`#${d.topCompetitors.findIndex((x) => x.brand_slug === c.brand_slug) + 2} v paneli (vs vaše #1)`}</span>
          </div>
          <div class="row">
            <span class="k">Mentions</span>
            <span class="v">
              {c.responses_with_mention} odpovedí v {d.period.label}
            </span>
          </div>
          <div class="row">
            <span class="k">Vaša response</span>
            <span class="v coral">Sledujte ich citácie. Detaily v dashboarde → Konkurencia.</span>
          </div>
        </div>
      ))
    )}
    <RunFoot ref={d.refCode} brand={d.brand.name} page="05 / 09" />
  </Page>
);

// ─── Page 6 · LLM engines ───
const LLMPage: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · ${d.period.label} · ${d.brand.name}`}
      right="04 · AI enginy"
      confidential
    />
    <Eyebrow>04 / AI enginy</Eyebrow>
    <h1 class="opener">
      Naprieč <em>4 engiami.</em>
    </h1>
    <p class="opener-sub">
      Vaša viditeľnosť sa naprieč Claude, ChatGPT, Perplexity a Gemini výrazne líši. Nejdú o
      ekvivalentné zdroje pozornosti.
    </p>

    <table class="tracking-table">
      <thead>
        <tr>
          <th>Engine</th>
          <th style="text-align:right">Volania</th>
          <th style="text-align:right">SoV</th>
          <th style="text-align:right">Position</th>
          <th style="text-align:right">Sentiment</th>
        </tr>
      </thead>
      <tbody>
        {d.llmRows.map((r) => (
          <tr>
            <td>{PROVIDER_LABELS[r.provider] ?? r.provider}</td>
            <td style="text-align:right">{r.total_calls}</td>
            <td style="text-align:right">{fmtPct(r.sov_pct)}</td>
            <td style="text-align:right">
              {r.avg_position !== null ? r.avg_position.toFixed(1).replace('.', ',') : '—'}
            </td>
            <td style="text-align:right">
              {r.avg_sentiment_score !== null ? fmtSentiment(r.avg_sentiment_score) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <p style="margin-top: 14pt;" class="source">
      Zdroj: Mentivue · 90d window · status=success, call_type=collection
    </p>

    <h2 class="body" style="margin-top: 22pt;">
      Top citujúce <em>domény.</em>
    </h2>
    <table class="tracking-table">
      <thead>
        <tr>
          <th>Doména</th>
          <th style="text-align:right">Mentions</th>
          <th style="text-align:right">Trend</th>
        </tr>
      </thead>
      <tbody>
        {d.citations.slice(0, 6).map((c) => (
          <tr>
            <td>{c.domain}</td>
            <td style="text-align:right">{c.mentions}</td>
            <td style="text-align:right">
              {c.trend === 'up' ? '↗' : c.trend === 'down' ? '↘' : '→'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="06 / 09" />
  </Page>
);

// ─── Page 7 · 30-day Action plan ───
const ActionPlanPage: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · ${d.period.label} · ${d.brand.name}`}
      right="05 · Action plan"
      confidential
    />
    <Eyebrow>05 / 30-day plan</Eyebrow>
    <h1 class="opener">
      Čo robiť <em>najbližších 30 dní.</em>
    </h1>
    <p class="opener-sub">Akcie podľa priority. Tracking-friendly formát pre váš tím.</p>

    <div class="action-week">
      <h4>
        Týždeň 1 — Anomálie a quick wins<span class="wk">Pondelok–nedeľa</span>
      </h4>
      {d.anomalies.length > 0 ? (
        <div class="day-row">
          <span class="day">Pondelok</span>
          <span class="what">
            Vyšetriť top anomáliu: <strong>{d.anomalies[0]?.subcategory ?? '—'}</strong> v{' '}
            {PROVIDER_LABELS[d.anomalies[0]?.provider ?? ''] ?? '—'}. Krok 1: pozrieť raw AI
            odpovede v dashboarde.
          </span>
        </div>
      ) : (
        <div class="day-row">
          <span class="day">Pondelok</span>
          <span class="what">
            Mesiac bez kritických anomálií — využite kapacitu na content publishing.
          </span>
        </div>
      )}
      <div class="day-row">
        <span class="day">Streda</span>
        <span class="what">
          Audit top {Math.min(d.citations.length, 3)} citujúcich domén:{' '}
          {d.citations
            .slice(0, 3)
            .map((c) => c.domain)
            .join(', ')}
          . Skontrolujte ako vás opisujú.
        </span>
      </div>
      <div class="day-row">
        <span class="day">Piatok</span>
        <span class="what">
          Sync s content tímom: zhrnutie mesačnej position a sentiment statistiky pre vašu značku.
        </span>
      </div>
    </div>

    <div class="action-week">
      <h4>
        Týždeň 2 — Citation building<span class="wk">8.–14. deň</span>
      </h4>
      <div class="day-row">
        <span class="day">Po–Str</span>
        <span class="what">
          Pitch 2 tier-A citujúcich domén (zive.sk, dsl.sk, etrend.sk) s témou „{d.brand.name} a
          sezónna ponuka". Cieľ: 1 publikované v týždni 3.
        </span>
      </div>
      <div class="day-row">
        <span class="day">Štvrtok</span>
        <span class="what">
          Optimalizovať existujúce landing pages pre AI scraping (FAQ block, schema markup, citáty z
          recenzií).
        </span>
      </div>
    </div>

    <div class="action-week">
      <h4>
        Týždeň 3 — Competitive response<span class="wk">15.–21. deň</span>
      </h4>
      <div class="day-row">
        <span class="day">Pondelok</span>
        <span class="what">
          Quarterly competitive scan: stiahnuť raw AI odpovede o vašich top{' '}
          {d.topCompetitors.length} konkurentoch a hľadať novinky.
        </span>
      </div>
      <div class="day-row">
        <span class="day">Piatok</span>
        <span class="what">
          Strategy call s Tomášom (advisor) — review mesačných výsledkov a plán na ďalší mesiac.
        </span>
      </div>
    </div>

    <div class="action-week">
      <h4>
        Týždeň 4 — Wrap + nasledujúci cyklus<span class="wk">22.–30. deň</span>
      </h4>
      <div class="day-row">
        <span class="day">Po–Pi</span>
        <span class="what">
          Pripraviť internú prezentáciu pre executive: 3 key insights + 2 priority akcie pre
          nasledujúci mesiac.
        </span>
      </div>
      <div class="day-row">
        <span class="day">Nedeľa</span>
        <span class="what">
          Mentivue automaticky vygeneruje Action Report za nasledujúci mesiac.
        </span>
      </div>
    </div>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="07 / 09" />
  </Page>
);

// ─── Page 8 · Colophon ───
const Colophon: FC<{ d: MonthlyData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · ${d.period.label} · ${d.brand.name}`} right="Colophon" />
    <Eyebrow>O metodike a tomto reporte</Eyebrow>
    <h2 class="body">
      Ako sme to <em>merali.</em>
    </h2>
    <p>
      Tento Action Report je generovaný z Mentivue research panelu, ktorý nepretržite meria
      viditeľnosť slovenských e-commerce značiek v štyroch AI vyhľadávacích enginoch (Claude,
      ChatGPT, Perplexity, Gemini). Za obdobie {fmtDate(d.period.start)} – {fmtDate(d.period.end)}{' '}
      sme zachytili <strong>{d.totalMentions}</strong> zmienok o značke {d.brand.name} naprieč
      relevantnými promptmi.
    </p>
    <p>
      Mentivue Index je vážený kompozit: 40 % Share of Voice + 30 % sentiment + 20 % pozícia + 10 %
      podiel pozitívnych zmienok. Plná metodológia: <strong>mentivue.sk/methodology</strong>.
    </p>
    <p class="colophon-pull">
      Tento dokument je dôverný a pripravený <em>exclusively pre {d.brand.name}.</em>
    </p>
    <p class="copy-line">
      © Mentivue 2026 · Bratislava · {d.refCode} · prepared exclusively for {d.brand.name}
    </p>
    <RunFoot ref={d.refCode} brand={d.brand.name} page="08 / 09" />
  </Page>
);

// ─── Main render ───
export function renderMonthlyReport(d: MonthlyData): string {
  const doc = (
    <ReportDoc
      title={`Mentivue · Action Report · ${d.period.label} · ${d.brand.name}`}
      extraCss={monthlyCss}
    >
      <Cover d={d} />
      <TocPage d={d} />
      <WhatChanged d={d} />
      <AnomaliesPage d={d} />
      <CompetitorsPage d={d} />
      <LLMPage d={d} />
      <ActionPlanPage d={d} />
      <Colophon d={d} />
    </ReportDoc>
  );
  return `<!doctype html>\n${doc.toString()}`;
}
