// Renders Per-Brand Audit (quarterly, €1 990 one-off) from AuditData.
// Faithful to `~/Downloads/mentivue/reports/Audit.html`.

import type { FC } from 'hono/jsx';
import type { AuditData } from './data.ts';
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

const HEATMAP_ROW_LABELS: Array<[string, string]> = [
  ['smartphones', 'Mobily'],
  ['laptops', 'Notebooky'],
  ['tv_audio', 'TV & audio'],
  ['white_goods', 'Spotrebiče'],
  ['gaming', 'Hry'],
  ['accessories_smart_home', 'Smart home'],
];
const HEATMAP_COL_LABELS: Array<[string, string]> = [
  ['discovery', 'Discovery'],
  ['comparison', 'Porovnanie'],
  ['validation', 'Recenzie'],
  ['commercial_intent', 'Cena'],
  ['product_specific', 'Produkt'],
  ['trust_service', 'Servis'],
];

const auditCss = `
.confidential { font-family: var(--font-mono); font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--signal); }
.cover-confidential { position: absolute; bottom: 22mm; right: 22mm; font-family: var(--font-mono); font-style: italic; font-size: 8pt; letter-spacing: 0.14em; color: var(--ink-soft); max-width: 50mm; text-align: right; line-height: 1.5; }
.hero-metric { text-align: center; margin: 18pt 0 24pt; padding: 18pt 0; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
.hero-metric .lbl { font-family: var(--font-mono); font-size: 9pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 4pt; }
.hero-metric .big { font-family: var(--font-display); font-style: italic; font-size: 140pt; font-weight: 400; letter-spacing: -0.04em; line-height: 0.85; color: var(--signal); font-variant-numeric: tabular-nums; }
.hero-metric .sub { display: flex; justify-content: center; gap: 28pt; margin-top: 14pt; font-family: var(--font-mono); font-size: 10pt; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-soft); }
.submetrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid var(--ink); margin-top: 14pt; }
.submetrics > div { padding: 14pt 18pt; border-right: 1px solid var(--bone-deep); }
.submetrics > div:last-child { border-right: none; }
.submetrics .lbl { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6pt; }
.submetrics .val { font-family: var(--font-display); font-size: 28pt; font-weight: 400; letter-spacing: -0.022em; color: var(--ink); line-height: 1; }
.submetrics .d { font-family: var(--font-mono); font-size: 9pt; margin-top: 4pt; }
.submetrics .d.up { color: var(--positive); } .submetrics .d.dn { color: var(--negative); }
.priority-card { border: 1px solid var(--ink); background: var(--paper-pure); padding: 18pt 20pt; display: grid; grid-template-columns: 100pt 1fr auto; gap: 20pt; align-items: start; margin-bottom: 12pt; }
.priority-card .when { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--signal); padding-top: 4pt; }
.priority-card .when b { display: block; color: var(--ink); font-size: 11pt; font-family: var(--font-display); font-style: italic; font-weight: 400; margin-top: 2pt; letter-spacing: -0.01em; }
.priority-card h3 { font-family: var(--font-display); font-weight: 500; font-size: 17pt; letter-spacing: -0.015em; margin: 0 0 6pt; line-height: 1.2; }
.priority-card p { margin: 0; font-size: 10pt; line-height: 1.5; color: var(--ink-soft); }
.priority-card .meta { font-family: var(--font-mono); font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-soft); padding-top: 4pt; }
.priority-card .meta b { display: block; font-family: var(--font-display); font-style: italic; font-size: 12pt; color: var(--signal); font-weight: 500; margin-top: 2pt; letter-spacing: -0.01em; }
.heatmap { display: grid; grid-template-columns: 60pt repeat(6, 1fr); gap: 2pt; margin-top: 14pt; }
.heatmap .hcol { font-family: var(--font-mono); font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-soft); text-align: center; padding-bottom: 4pt; }
.heatmap .hrow { font-family: var(--font-display); font-size: 11pt; color: var(--ink); display: flex; align-items: center; }
.heatmap .cell { padding: 8pt 6pt; text-align: center; font-family: var(--font-mono); font-size: 9pt; color: var(--ink); }
.cite-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 9pt; margin-top: 12pt; }
.cite-table th { text-align: left; font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); padding: 8pt; border-bottom: 1px solid var(--ink); background: var(--bone); font-weight: 500; }
.cite-table td { padding: 7pt 8pt; border-bottom: 1px solid rgba(14,17,22,0.08); }
.cite-table td.entity { font-family: var(--font-body); color: var(--ink); }
`;

function cellColor(v: number | null): string {
  if (v === null) return '#EBE5D7';
  if (v >= 0.6) return '#2D6A4F';
  if (v >= 0.3) return '#79A88E';
  if (v >= 0.0) return '#D9D5C7';
  if (v >= -0.3) return '#E8AC9E';
  if (v >= -0.6) return '#D26B57';
  return '#C73E1D';
}

// ─── Cover ───
const Cover: FC<{ d: AuditData }> = ({ d }) => (
  <Page classes="cover">
    <div class="cover-top">
      <LogoSvg size={48} />
      <span>
        Mentivue · Per-Brand Audit · <span class="confidential">Confidential</span>
      </span>
    </div>
    <div class="cover-headline">
      <h1 style="font-size: 64pt;">
        AI Search
        <br />
        Audit
      </h1>
      <div class="sub">
        {d.brand.name}
        <br />
        {d.period.label}
      </div>
    </div>
    <div class="cover-foot">
      <div class="meta">
        <span>Pripravené pre</span>
        <span class="v">
          {d.brand.name} · {d.klient.name ?? d.klient.email}, CMO
        </span>
        <span>Obdobie analýzy</span>
        <span class="v">
          {fmtDate(d.period.start)} – {fmtDate(d.period.end)}
        </span>
        <span>Generované</span>
        <span class="v">{fmtDate(d.generatedAt)}</span>
        <span>Referencia</span>
        <span class="v">{d.refCode}</span>
      </div>
      <div class="ref">
        {d.refCode}
        <br />
        {d.brand.slug.toUpperCase()}
      </div>
    </div>
    <div class="cover-confidential">
      Confidential — pre interné použitie {d.brand.name}. Externé zdielanie zakázané.
    </div>
    <div class="cover-mark">
      <LogoSvg size={48} />
    </div>
  </Page>
);

// ─── Exec summary ───
const ExecSummary: FC<{ d: AuditData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · Per-Brand Audit · ${d.brand.name}`}
      right="Exec summary"
      confidential
    />
    <Eyebrow>Executive summary</Eyebrow>
    <h1 class="opener">
      {d.brand.name} <em>v jednom čísle.</em>
    </h1>

    <div class="hero-metric">
      <div class="lbl">Mentivue Index</div>
      <div class="big">{fmtIndex(d.index.current)}</div>
      <div class="sub">
        <span>SoV {fmtPct(d.sov.current)}</span>
        <span>
          Position{' '}
          {d.position.current !== null ? d.position.current.toFixed(1).replace('.', ',') : '—'}
        </span>
        <span>
          Sentiment {d.sentiment.current !== null ? fmtSentiment(d.sentiment.current) : '—'}
        </span>
      </div>
    </div>

    <div class="submetrics">
      <div>
        <div class="lbl">Share of Voice</div>
        <div class="val">{fmtPct(d.sov.current)}</div>
        <div class={`d ${d.sov.delta > 0 ? 'up' : 'dn'}`}>
          {fmtSigned(d.sov.delta, ' pp')} vs Q-1
        </div>
      </div>
      <div>
        <div class="lbl">Avg position</div>
        <div class="val">
          {d.position.current !== null ? d.position.current.toFixed(1).replace('.', ',') : '—'}
        </div>
        <div class="d">z ~5 značiek</div>
      </div>
      <div>
        <div class="lbl">Sentiment</div>
        <div class="val">
          {d.sentiment.current !== null ? fmtSentiment(d.sentiment.current) : '—'}
        </div>
        <div class="d">−1 ÷ +1</div>
      </div>
    </div>

    <p style="margin-top: 20pt;">
      {d.brand.name} drží{' '}
      <strong>
        {d.topCompetitors.findIndex((c) => c.is_klient) >= 0
          ? '—'
          : `#${d.topCompetitors[0] ? 1 : 0}`}
      </strong>{' '}
      v Mentivue paneli za {d.period.label}. {d.totalMentions} priamych zmienok naprieč{' '}
      {d.llmRows.length} AI engiami. Pozície sa pohybujú v očakávanom rozmedzí, sentiment je
      stabilný v pozitívnom pásme.
    </p>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="01 / 12" />
  </Page>
);

// ─── Top priorities (3-4 priority cards) ───
const Priorities: FC<{ d: AuditData }> = ({ d }) => {
  // Derive top categories where brand wins/loses
  const sorted = [...d.categoryBreakdown].filter((c) => c.sample >= 5);
  const top = sorted
    .slice()
    .sort((a, b) => b.sov - a.sov)
    .slice(0, 1);
  const bottom = sorted
    .slice()
    .sort((a, b) => a.sov - b.sov)
    .slice(0, 1);
  const lowSent = sorted
    .slice()
    .filter((c) => (c.sentiment ?? 1) < 0.3)
    .slice(0, 1);
  return (
    <Page>
      <RunHead
        left={`Mentivue · Per-Brand Audit · ${d.brand.name}`}
        right="Priority akcie"
        confidential
      />
      <Eyebrow>Top 3 priority pre nasledujúci kvartál</Eyebrow>
      <h1 class="opener">
        Tri veci <em>na ktoré sa sústrediť.</em>
      </h1>

      {top[0] && (
        <div class="priority-card">
          <div class="when">
            Quick win<b>Týždeň 1–4</b>
          </div>
          <div>
            <h3>
              Zdvojnásobte úspech v kategórii <em>{top[0].category}</em>.
            </h3>
            <p>
              Aktuálne držíte {fmtPct(top[0].sov)} SoV. Vyšlite content tímu publikovať 2 ďalšie
              články v tier-A doménach. Cieľ: +5 pp SoV za 30 dní.
            </p>
          </div>
          <div class="meta">
            Potenciál<b>+5 pp SoV</b>
          </div>
        </div>
      )}

      {bottom[0] && (
        <div class="priority-card">
          <div class="when">
            Strategic<b>Týždeň 5–8</b>
          </div>
          <div>
            <h3>
              Rozhodnúť o investícii do kategórie <em>{bottom[0].category}</em>.
            </h3>
            <p>
              Iba {fmtPct(bottom[0].sov)} SoV — najslabšia výkonnosť spomedzi sledovaných kategórií.
              Buď investovať do dedikovanej landing + content stratégie, alebo akceptovať a
              redirektnúť rozpočet inde.
            </p>
          </div>
          <div class="meta">
            Rozhodnúť<b>Mes. 2</b>
          </div>
        </div>
      )}

      {lowSent[0] ? (
        <div class="priority-card">
          <div class="when">
            Reputation<b>Priebežne</b>
          </div>
          <div>
            <h3>
              Vylepšiť sentiment v kategórii <em>{lowSent[0].category}</em>.
            </h3>
            <p>
              Sentiment {lowSent[0].sentiment !== null ? fmtSentiment(lowSent[0].sentiment) : '—'} —
              pod priemerom panelu. Pravdepodobná príčina: nedostatok pozitívnych recenzií v
              citujúcich doménach. Plán: kontaktovať top 3 recenzentov.
            </p>
          </div>
          <div class="meta">
            Mes. 1–3<b>Recenzie</b>
          </div>
        </div>
      ) : (
        <div class="priority-card">
          <div class="when">
            Citation<b>Mes. 1–3</b>
          </div>
          <div>
            <h3>
              Diverzifikovať citujúce <em>domény.</em>
            </h3>
            <p>
              {d.citations.length} domén momentálne citujú vašu značku. Posilnite zastúpenie v
              tier-A médiách (Trend, Etrend, zive.sk). Cieľ: +3 nové domény za štvrťrok.
            </p>
          </div>
          <div class="meta">
            Cieľ<b>+3 domény</b>
          </div>
        </div>
      )}

      <RunFoot ref={d.refCode} brand={d.brand.name} page="02 / 12" />
    </Page>
  );
};

// ─── Topic heatmap (category × subcategory sentiment) ───
const HeatmapPage: FC<{ d: AuditData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · Per-Brand Audit · ${d.brand.name}`}
      right="Topic coverage"
      confidential
    />
    <Eyebrow>Topic coverage matrix</Eyebrow>
    <h1 class="opener">
      Kde <em>dominujete</em>, kde <em>strácate.</em>
    </h1>
    <p class="opener-sub">
      Sentiment naprieč 6 sub-kategóriami × 6 typmi promptov. Sentiment –1 (červené) až +1 (zelené).
    </p>

    <div class="heatmap">
      <span />
      {HEATMAP_COL_LABELS.map(([_, label]) => (
        <span class="hcol">{label}</span>
      ))}
      {HEATMAP_ROW_LABELS.map(([rowKey, rowLabel]) => (
        <>
          <span class="hrow">{rowLabel}</span>
          {HEATMAP_COL_LABELS.map(([colKey]) => {
            const cell = d.heatmap.get(`${rowKey}|${colKey}`);
            const v = cell?.sentiment ?? null;
            const bg = cellColor(v);
            const white = v !== null && Math.abs(v) > 0.3;
            return (
              <span class="cell" style={`background: ${bg}; color: ${white ? '#fff' : '#0E1116'}`}>
                {v === null ? '·' : `${v >= 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}`}
              </span>
            );
          })}
        </>
      ))}
    </div>

    <p class="source" style="margin-top: 18pt;">
      Hodnoty: priemerný sentiment score zmienok vašej značky v daných promptoch · sample ≥5
    </p>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="03 / 12" />
  </Page>
);

// ─── Per-engine breakdown ───
const EnginePage: FC<{ d: AuditData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Per-Brand Audit · ${d.brand.name}`} right="AI enginy" confidential />
    <Eyebrow>Naprieč 4 enginmi</Eyebrow>
    <h1 class="opener">
      Štyri enginy, <em>štyri obrazy.</em>
    </h1>
    <p class="opener-sub">
      Vaša viditeľnosť sa medzi ChatGPT a Gemini líši rádovo. Plánujte ich ako separátne kanály.
    </p>

    <table class="cite-table">
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
            <td class="entity">{PROVIDER_LABELS[r.provider] ?? r.provider}</td>
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

    <h2 class="body" style="margin-top: 22pt;">
      Konkurenčný kontext — top {d.topCompetitors.length}
    </h2>
    <table class="cite-table">
      <thead>
        <tr>
          <th>Značka</th>
          <th style="text-align:right">Mentions</th>
          <th style="text-align:right">SoV</th>
        </tr>
      </thead>
      <tbody>
        {d.topCompetitors.map((c) => (
          <tr>
            <td class="entity">{c.brand_name}</td>
            <td style="text-align:right">{c.responses_with_mention}</td>
            <td style="text-align:right">{fmtPct(c.sov_pct)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="04 / 12" />
  </Page>
);

// ─── Citation deep dive ───
const CitationsPage: FC<{ d: AuditData }> = ({ d }) => (
  <Page>
    <RunHead
      left={`Mentivue · Per-Brand Audit · ${d.brand.name}`}
      right="Citation sources"
      confidential
    />
    <Eyebrow>Citation sources · top 10</Eyebrow>
    <h1 class="opener">
      Kde <em>AI číta o vás.</em>
    </h1>
    <p class="opener-sub">
      Top {d.citations.length} citujúcich domén za {d.period.label}. Diverzifikácia citácií =
      stabilita AI viditeľnosti.
    </p>

    <table class="cite-table">
      <thead>
        <tr>
          <th>Doména</th>
          <th style="text-align:right">Mentions</th>
          <th style="text-align:right">Weight</th>
          <th style="text-align:right">Trend</th>
        </tr>
      </thead>
      <tbody>
        {d.citations.map((c) => (
          <tr>
            <td class="entity">{c.domain}</td>
            <td style="text-align:right">{c.mentions}</td>
            <td style="text-align:right">
              {'★'.repeat(c.weight)}
              {'·'.repeat(5 - c.weight)}
            </td>
            <td style="text-align:right">
              {c.trend === 'up' ? '↗' : c.trend === 'down' ? '↘' : '→'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <RunFoot ref={d.refCode} brand={d.brand.name} page="05 / 12" />
  </Page>
);

// ─── Colophon ───
const Colophon: FC<{ d: AuditData }> = ({ d }) => (
  <Page>
    <RunHead left={`Mentivue · Per-Brand Audit · ${d.brand.name}`} right="Colophon" />
    <Eyebrow>O metodike</Eyebrow>
    <h2 class="body">
      Ako sme to <em>merali.</em>
    </h2>
    <p>
      Tento Audit je generovaný z Mentivue research panelu, ktorý meria viditeľnosť slovenských
      e-commerce značiek v štyroch AI vyhľadávacích enginoch. Za obdobie {fmtDate(d.period.start)} –{' '}
      {fmtDate(d.period.end)} sme zachytili <strong>{d.totalMentions}</strong> priamych zmienok o
      značke {d.brand.name} v <strong>{d.llmRows.reduce((s, r) => s + r.total_calls, 0)}</strong> AI
      volaniach.
    </p>
    <p>
      Mentivue Index je vážený kompozit: 40 % Share of Voice + 30 % sentiment + 20 % pozícia + 10 %
      podiel pozitívnych zmienok.
    </p>
    <p>
      Plná metodológia: <strong>mentivue.sk/methodology</strong>. Otázky:{' '}
      <strong>tomas@mentivue.sk</strong>.
    </p>
    <div class="note" style="margin-top: 18pt;">
      <span class="label">● Confidentiality</span>Tento dokument obsahuje predikcie a strategické
      odporúčania špecifické pre {d.brand.name}. Externá distribúcia je v rozpore s licenciou.
    </div>
    <p class="copy-line">
      © Mentivue 2026 · Bratislava · {d.refCode} · prepared exclusively for {d.brand.name}
    </p>
    <RunFoot ref={d.refCode} brand={d.brand.name} page="06 / 12" />
  </Page>
);

export function renderAuditReport(d: AuditData): string {
  const doc = (
    <ReportDoc
      title={`Mentivue · Per-Brand Audit · ${d.brand.name} · ${d.period.label}`}
      extraCss={auditCss}
    >
      <Cover d={d} />
      <ExecSummary d={d} />
      <Priorities d={d} />
      <HeatmapPage d={d} />
      <EnginePage d={d} />
      <CitationsPage d={d} />
      <Colophon d={d} />
    </ReportDoc>
  );
  return `<!doctype html>\n${doc.toString()}`;
}
