// Renders Industry Report (quarterly, free-with-email public report) from
// IndustryData. Compact but faithful to `~/Downloads/mentivue/reports/Report.html`.

import type { FC } from 'hono/jsx';
import type { IndustryData } from './data.ts';
import { Eyebrow, fmtDate, fmtPct, LogoSvg, Page, ReportDoc, RunFoot, RunHead } from './shell.tsx';

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

const industryCss = `
.industry-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--ink); margin: 18pt 0 22pt; }
.industry-stat-grid > div { padding: 16pt 18pt; border-right: 1px solid var(--bone-deep); }
.industry-stat-grid > div:last-child { border-right: none; }
.industry-stat-grid .lbl { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); }
.industry-stat-grid .val { font-family: var(--font-display); font-size: 28pt; font-weight: 400; letter-spacing: -0.025em; margin-top: 6pt; color: var(--ink); line-height: 1; font-variant-numeric: tabular-nums; }
.rank-table { width: 100%; border-collapse: collapse; margin-top: 14pt; }
.rank-table th { text-align: left; font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); padding: 10pt 10pt; border-bottom: 1px solid var(--ink); background: var(--bone); font-weight: 500; }
.rank-table th.num { text-align: right; }
.rank-table td { padding: 10pt; border-bottom: 1px solid rgba(14,17,22,0.08); font-size: 11pt; }
.rank-table td.num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.rank-table td.rank { font-family: var(--font-display); font-style: italic; font-size: 22pt; color: var(--signal); padding: 6pt 10pt; width: 50pt; }
.rank-table td.brand { font-family: var(--font-display); font-size: 16pt; letter-spacing: -0.014em; font-weight: 500; }
.engine-share { display: grid; grid-template-columns: 80pt 1fr 60pt; gap: 12pt; padding: 10pt 0; align-items: center; border-bottom: 1px solid rgba(14,17,22,0.08); }
.engine-share .name { font-family: var(--font-display); font-size: 14pt; font-weight: 500; }
.engine-share .bar { height: 8pt; background: var(--bone); position: relative; }
.engine-share .bar > div { position: absolute; inset: 0; background: var(--signal); }
.engine-share .pct { font-family: var(--font-mono); font-size: 11pt; text-align: right; }
.method-card { border: 1px solid var(--ink); padding: 14pt 18pt; background: var(--paper-pure); margin-top: 12pt; }
.method-card .k { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 4pt; }
.method-card .v { font-family: var(--font-display); font-size: 14pt; line-height: 1.35; color: var(--ink); }
`;

// ─── Cover ───
const Cover: FC<{ d: IndustryData }> = ({ d }) => (
  <Page classes="cover">
    <div class="cover-top">
      <LogoSvg size={48} />
      <span>Mentivue · Industry Report · Public</span>
    </div>
    <div class="cover-headline">
      <h1 style="font-size: 56pt;">
        Mentivue
        <br />
        Industry
        <br />
        Report
      </h1>
      <div class="sub">
        {d.verticalName}
        <br />
        {d.period.label}
      </div>
    </div>
    <div class="cover-foot">
      <div class="meta">
        <span>Vertikál</span>
        <span class="v">{d.verticalName}</span>
        <span>Obdobie</span>
        <span class="v">
          {fmtDate(d.period.start)} – {fmtDate(d.period.end)}
        </span>
        <span>Generované</span>
        <span class="v">{fmtDate(d.generatedAt)}</span>
        <span>Edícia</span>
        <span class="v">{d.refCode}</span>
      </div>
      <div class="ref">{d.refCode}</div>
    </div>
    <div class="cover-mark">
      <LogoSvg size={48} />
    </div>
  </Page>
);

// ─── Methodology snapshot ───
const Methodology: FC<{ d: IndustryData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Industry Report · ${d.verticalName}`} right="Metodológia" />
    <Eyebrow>Snapshot · Metodológia</Eyebrow>
    <h1 class="opener">
      Ako sme to <em>merali.</em>
    </h1>

    <div class="industry-stat-grid">
      <div>
        <div class="lbl">Sledované značky</div>
        <div class="val">{d.trackedBrands}</div>
      </div>
      <div>
        <div class="lbl">Promptov</div>
        <div class="val">{d.totalPrompts}</div>
      </div>
      <div>
        <div class="lbl">AI volania</div>
        <div class="val">{d.totalCalls}</div>
      </div>
      <div>
        <div class="lbl">AI enginy</div>
        <div class="val">{d.llmShares.length}</div>
      </div>
    </div>

    <div class="method-card">
      <div class="k">Čo meriame</div>
      <div class="v">
        Share of Voice, priemerná pozícia, sentiment a citujúce domény pre každú značku naprieč
        štyrmi AI vyhľadávacími enginmi.
      </div>
    </div>
    <div class="method-card">
      <div class="k">Ako často</div>
      <div class="v">
        Dennodenné collection runs, agregácie naprieč rolling 30/90 dňami. Žiadne reklamné
        placementy — len naturálne AI odpovede.
      </div>
    </div>
    <div class="method-card">
      <div class="k">Mentivue Index</div>
      <div class="v">
        Vážený kompozit: 40 % SoV + 30 % sentiment + 20 % pozícia + 10 % podiel pozitívnych zmienok.
        Hodnota 0–100.
      </div>
    </div>

    <RunFoot ref={d.refCode} brand={d.verticalName} page="02 / 10" />
  </Page>
);

// ─── Ranking ───
const RankingPage: FC<{ d: IndustryData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Industry Report · ${d.verticalName}`} right="Ranking" />
    <Eyebrow>{d.period.label} · Mentivue Index</Eyebrow>
    <h1 class="opener">
      Top značky <em>{d.period.label}.</em>
    </h1>
    <p class="opener-sub">
      Ranking podľa Mentivue Indexu za obdobie {fmtDate(d.period.start)} – {fmtDate(d.period.end)}.
      Aktualizované denne.
    </p>

    <table class="rank-table">
      <thead>
        <tr>
          <th />
          <th>Značka</th>
          <th class="num">Mentivue Index</th>
          <th class="num">SoV</th>
        </tr>
      </thead>
      <tbody>
        {d.topBrands.slice(0, 10).map((b) => (
          <tr>
            <td class="rank">#{b.rank}</td>
            <td class="brand">{b.name}</td>
            <td class="num">{b.index.toFixed(1).replace('.', ',')}</td>
            <td class="num">{fmtPct(b.sov)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <p class="source" style="margin-top: 16pt;">
      Zdroj: Mentivue Research · denné collection × 4 enginy · status=success
    </p>

    <RunFoot ref={d.refCode} brand={d.verticalName} page="03 / 10" />
  </Page>
);

// ─── Engine shares ───
const EnginesPage: FC<{ d: IndustryData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Industry Report · ${d.verticalName}`} right="AI enginy" />
    <Eyebrow>AI enginy v dataset-e</Eyebrow>
    <h1 class="opener">
      Štyri enginy, <em>štyri obrazy slovenského e-commerce.</em>
    </h1>
    <p class="opener-sub">
      Distribúcia AI volaní podľa providera. Žiadny engine nedominuje absolútne — značky musia
      plánovať pre všetky štyri.
    </p>

    {d.llmShares.map((e) => (
      <div class="engine-share">
        <span class="name">{PROVIDER_LABELS[e.provider] ?? e.provider}</span>
        <span class="bar">
          <div style={`width: ${Math.min(e.share * 2, 100)}%`} />
        </span>
        <span class="pct">{e.share.toFixed(1).replace('.', ',')} %</span>
      </div>
    ))}

    <RunFoot ref={d.refCode} brand={d.verticalName} page="04 / 10" />
  </Page>
);

// ─── Citation insight ───
const CitationsPage: FC<{ d: IndustryData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Industry Report · ${d.verticalName}`} right="Citácie" />
    <Eyebrow>Top citujúce domény</Eyebrow>
    <h1 class="opener">
      Kto <em>kŕmi</em> AI <em>o slovenských značkách.</em>
    </h1>
    <p class="opener-sub">
      Top 10 domén, ktoré AI najčastejšie cituje pri odpovediach o slovenskom e-commerce.
    </p>

    <table class="rank-table">
      <thead>
        <tr>
          <th>Doména</th>
          <th class="num">Citácie</th>
          <th class="num">Weight</th>
          <th class="num">Trend</th>
        </tr>
      </thead>
      <tbody>
        {d.citations.map((c) => (
          <tr>
            <td class="brand" style="font-size: 13pt;">
              {c.domain}
            </td>
            <td class="num">{c.mentions}</td>
            <td class="num">
              {'★'.repeat(c.weight)}
              {'·'.repeat(5 - c.weight)}
            </td>
            <td class="num">{c.trend === 'up' ? '↗' : c.trend === 'down' ? '↘' : '→'}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <RunFoot ref={d.refCode} brand={d.verticalName} page="05 / 10" />
  </Page>
);

// ─── Colophon ───
const Colophon: FC<{ d: IndustryData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Industry Report · ${d.verticalName}`} right="Colophon" />
    <Eyebrow>Mentivue Industry Report</Eyebrow>
    <h2 class="body">
      O tomto <em>reporte.</em>
    </h2>
    <p>
      Mentivue Industry Report je kvartálny pohľad na to, ako štyri vedúce AI vyhľadávacie enginy
      (Claude, ChatGPT, Perplexity, Gemini) hovoria o slovenských e-commerce značkách. Tento report
      pokrýva {d.trackedBrands} sledovaných značiek, {d.totalPrompts} promptov a {d.totalCalls} AI
      volaní za obdobie {fmtDate(d.period.start)} – {fmtDate(d.period.end)}.
    </p>
    <p>
      Free preview obsahuje {d.topBrands.length > 10 ? 10 : d.topBrands.length} značiek z ranking-u.
      Plná edícia (40 strán) obsahuje per-kategória breakdowny, sentiment deep-dive, citation
      network analysis a strategické insights — k dispozícii na <strong>mentivue.sk/report</strong>.
    </p>
    <p class="copy-line">
      © Mentivue 2026 · Bratislava · {d.refCode} · {fmtDate(d.generatedAt)}
    </p>
    <RunFoot ref={d.refCode} brand={d.verticalName} page="06 / 10" />
  </Page>
);

export function renderIndustryReport(d: IndustryData): string {
  const doc = (
    <ReportDoc
      title={`Mentivue · Industry Report · ${d.verticalName} · ${d.period.label}`}
      extraCss={industryCss}
    >
      <Cover d={d} />
      <Methodology d={d} />
      <RankingPage d={d} />
      <EnginesPage d={d} />
      <CitationsPage d={d} />
      <Colophon d={d} />
    </ReportDoc>
  );
  return `<!doctype html>\n${doc.toString()}`;
}
