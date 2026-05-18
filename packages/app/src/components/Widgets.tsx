// Dashboard widgets — translated from prototype. Inline styles match 1:1.

import type { FC, PropsWithChildren } from 'hono/jsx';
import { C, MonoLabel, Num } from './primitives.tsx';
import type { LlmProviderRow, SovTrendCell, TopBrandRow } from '../lib/dashboard-queries.ts';

// ────────── Sparkline (line + optional area fill) ──────────
export const Sparkline: FC<{
  values: number[];
  color?: string;
  fill?: boolean;
  height?: number;
}> = ({ values, color, fill, height = 56 }) => {
  const c = color ?? C.signal;
  if (!values || values.length === 0) return <div style={`color:${C.inkSoft};font-size:12px`}>—</div>;
  const w = 240;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / Math.max(values.length - 1, 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = h - 8 - ((v - min) / range) * (h - 16);
      return `${x},${y}`;
    })
    .join(' ');
  const lastVal = values[values.length - 1]!;
  const lastY = h - 8 - ((lastVal - min) / range) * (h - 16);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style="display:block">
      {fill && <polygon points={`0,${h} ${pts} ${w},${h}`} fill={c} opacity="0.08" />}
      <polyline points={pts} fill="none" stroke={c} stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke" />
      <circle cx={w} cy={lastY} r="3" fill={c} />
    </svg>
  );
};

// ────────── SoV bar group (4 brand rows) ──────────
export const SoVBars: FC<{ rows: TopBrandRow[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return <div style={`color:${C.inkSoft};font-size:11px`}>žiadne dáta</div>;
  }
  const max = Math.max(...rows.map((r) => r.sov_pct), 0.1);
  return (
    <div style="display:flex;flex-direction:column;gap:6px;height:56px;justify-content:center">
      {rows.map((r) => (
        <div style="display:grid;grid-template-columns:54px 1fr 36px;align-items:center;gap:8px">
          <Num size={10} color={C.inkSoft}>{r.brand_name.slice(0, 8)}</Num>
          <div style={`height:4px;background:${C.bone};position:relative`}>
            <div
              style={`position:absolute;inset:0;width:${(r.sov_pct / max) * 100}%;background:${r.is_klient ? C.signal : C.ink}`}
            />
          </div>
          <Num size={10} color={r.is_klient ? C.signal : C.ink}>{r.sov_pct.toFixed(1)}</Num>
        </div>
      ))}
    </div>
  );
};

// ────────── DonutMini for sentiment ──────────
export const DonutMini: FC<{ pos: number; neu: number; neg: number; size?: number }> = ({
  pos,
  neu,
  neg,
  size = 56,
}) => {
  const r = size / 2 - 6;
  const cx = size / 2, cy = size / 2;
  const total = pos + neu + neg || 1;
  const circ = 2 * Math.PI * r;
  const segPos = (pos / total) * circ;
  const segNeu = (neu / total) * circ;
  const segNeg = (neg / total) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bone} stroke-width="6" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.positive}
        stroke-width="6"
        stroke-dasharray={`${segPos} ${circ - segPos}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.inkSoft}
        stroke-width="6"
        stroke-dasharray={`${segNeu} ${circ - segNeu}`}
        stroke-dashoffset={-segPos}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.negative}
        stroke-width="6"
        stroke-dasharray={`${segNeg} ${circ - segNeg}`}
        stroke-dashoffset={-(segPos + segNeu)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
};

// ────────── MetricCard ──────────
export const MetricCard: FC<
  PropsWithChildren<{
    label: string;
    value: string;
    valueEm?: boolean;
    sub?: string;
    viz?: unknown;
    delta?: unknown;
    deltaLabel?: string;
    noRight?: boolean;
    noLeft?: boolean;
  }>
> = ({ label, value, valueEm, sub, viz, delta, deltaLabel, noRight, noLeft }) => {
  const borders = `border-top:1px solid ${C.ink};border-bottom:1px solid ${C.ink};${noLeft ? '' : `border-left:1px solid ${C.ink};`}${noRight ? '' : `border-right:1px solid ${C.ink};`}`;
  return (
    <div style={`${borders}background:${C.paperPure};padding:20px 22px 18px;display:flex;flex-direction:column;gap:14px;min-height:200px;position:relative`}>
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <MonoLabel size={10} tracking="0.18em">{label}</MonoLabel>
        <Num size={10} color="rgba(14,17,22,0.4)">30D</Num>
      </div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style={`font-family:${C.fontDisplay};font-size:44px;font-weight:400;line-height:1;letter-spacing:-0.03em;color:${valueEm ? C.signal : C.ink};font-style:${valueEm ? 'italic' : 'normal'};font-variant-numeric:tabular-nums`}>{value}</span>
        {sub && <span style={`font-family:${C.fontMono};font-size:12px;color:${C.inkSoft};letter-spacing:0.06em`}>{sub}</span>}
      </div>
      <div style="flex:1;display:flex;align-items:flex-end;min-height:56px">{viz}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid rgba(14,17,22,0.1)">
        {delta}
        <Num size={9} color={C.inkSoft}>{deltaLabel ?? 'vs minulý mesiac'}</Num>
      </div>
    </div>
  );
};

// ────────── LLM card ──────────
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

export const LLMCard: FC<{ row: LlmProviderRow }> = ({ row }) => {
  const name = PROVIDER_LABELS[row.provider] ?? row.provider;
  // Heat intensity proportional to klient SoV
  const intensity = Math.min(1, (row.sov_pct ?? 0) / 60);
  const bg = `rgba(255,91,58,${0.04 + intensity * 0.10})`;
  const sentiment = row.avg_sentiment_score ?? 0;
  const position = row.avg_position ?? 0;
  return (
    <div style={`border:1px solid ${C.ink};background:${C.paperPure};padding:18px 20px;display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden`}>
      <div aria-hidden="true" style={`position:absolute;inset:0;background:${bg};pointer-events:none`} />
      <div style="position:relative;display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span style={`font-family:${C.fontDisplay};font-size:18px;font-weight:500;letter-spacing:-0.015em;color:${C.ink}`}>{name}</span>
            <div style="margin-top:2px">
              <Num size={9} color={C.inkSoft}>{row.sov_pct.toFixed(0)} % SoV</Num>
            </div>
          </div>
          <span style={`width:22px;height:22px;border:1px solid ${C.ink};display:inline-flex;align-items:center;justify-content:center`}>
            <span style={`width:6px;height:6px;background:${C.ink};border-radius:50%`} />
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <MetricRow label="SOV" value={`${row.sov_pct.toFixed(1)} %`} bar={Math.min(row.sov_pct / 100, 1)} primary />
          <MetricRow label="POSITION" value={position > 0 ? position.toFixed(1) : '—'} />
          <MetricRow label="SENTIMENT" value={`${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)}`} bar={(sentiment + 1) / 2} pos />
        </div>
      </div>
    </div>
  );
};

const MetricRow: FC<{ label: string; value: string; bar?: number; primary?: boolean; pos?: boolean }> = ({
  label,
  value,
  bar,
  primary,
  pos,
}) => {
  const color = primary ? C.signal : pos ? C.positive : C.ink;
  return (
    <div style="display:grid;grid-template-columns:64px 1fr 56px;align-items:center;gap:8px">
      <Num size={10} color={C.inkSoft}>{label}</Num>
      {bar !== undefined ? (
        <div style={`height:3px;background:${C.bone};position:relative`}>
          <div style={`position:absolute;inset:0;width:${Math.max(0, Math.min(1, bar)) * 100}%;background:${color}`} />
        </div>
      ) : (
        <div />
      )}
      <Num size={11} color={color}>{value}</Num>
    </div>
  );
};

// ────────── SoV Trend Chart (multi-brand line, 90d) ──────────
export const SoVTrendChart: FC<{ data: SovTrendCell[]; klientSlug: string }> = ({ data, klientSlug }) => {
  const W = 920, H = 320;
  const PAD = { t: 32, r: 32, b: 36, l: 44 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  // Group by brand
  const brands = new Map<string, { name: string; points: { day: string; sov: number }[] }>();
  const allDays = new Set<string>();
  for (const cell of data) {
    if (!brands.has(cell.brand_slug)) brands.set(cell.brand_slug, { name: cell.brand_name, points: [] });
    brands.get(cell.brand_slug)!.points.push({ day: cell.day, sov: cell.sov_pct });
    allDays.add(cell.day);
  }
  const dayList = Array.from(allDays).sort();

  if (dayList.length < 2) {
    return <div style={`padding:24px;color:${C.inkSoft};font-size:13px`}>Nedostatok dát pre trend.</div>;
  }

  const xFor = (i: number) => PAD.l + (i / (dayList.length - 1)) * innerW;
  const yFor = (pct: number) => PAD.t + (1 - pct / 100) * innerH;

  const toPath = (points: { day: string; sov: number }[]): string => {
    return points
      .map((p) => ({ idx: dayList.indexOf(p.day), sov: p.sov }))
      .filter((p) => p.idx >= 0)
      .sort((a, b) => a.idx - b.idx)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.idx).toFixed(1)} ${yFor(p.sov).toFixed(1)}`)
      .join(' ');
  };

  // Klient first, then sorted competitors
  const brandsList = Array.from(brands.entries());
  const klient = brandsList.find(([slug]) => slug === klientSlug);
  const competitors = brandsList.filter(([slug]) => slug !== klientSlug);

  // X labels (~7 evenly spaced)
  const labelCount = Math.min(7, dayList.length);
  const labelIdxs = Array.from({ length: labelCount }, (_, i) => Math.round((i / (labelCount - 1)) * (dayList.length - 1)));
  const fmtLabel = (day: string) => {
    const d = new Date(day);
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short' }).format(d);
  };

  const competitorColors = [C.ink, C.inkSoft, 'rgba(31,36,41,0.6)', 'rgba(31,36,41,0.45)'];
  const competitorWidths = [2.2, 1.8, 1.5, 1.3];
  const competitorDashes = ['', '', '4 4', '2 4'];

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style="display:block">
      {/* Gridlines */}
      {[0, 25, 50, 75, 100].map((p) => (
        <g>
          <line x1={PAD.l} x2={W - PAD.r} y1={yFor(p)} y2={yFor(p)} stroke={C.bone} stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" />
          <text x={PAD.l - 8} y={yFor(p) + 3} fill={C.inkSoft} font-family={C.fontMono} font-size="9" text-anchor="end" letter-spacing="0.06em">{p}%</text>
        </g>
      ))}
      {/* X tick labels */}
      {labelIdxs.map((idx) => (
        <text x={xFor(idx)} y={H - PAD.b + 18} fill={C.inkSoft} font-family={C.fontMono} font-size="9" text-anchor="middle" letter-spacing="0.04em">
          {fmtLabel(dayList[idx] ?? '')}
        </text>
      ))}

      {/* Competitor lines */}
      {competitors.map(([_, data], i) => (
        <path
          d={toPath(data.points)}
          fill="none"
          stroke={competitorColors[i % competitorColors.length] ?? C.inkSoft}
          stroke-width={competitorWidths[i % competitorWidths.length] ?? 1.5}
          stroke-dasharray={competitorDashes[i % competitorDashes.length] ?? ''}
          stroke-linecap="square"
          opacity={i >= 2 ? '0.7' : '1'}
        />
      ))}

      {/* Klient line (always on top) */}
      {klient && (
        <path
          d={toPath(klient[1].points)}
          fill="none"
          stroke={C.signal}
          stroke-width="2.4"
          stroke-linecap="square"
        />
      )}

      {/* End markers for top 3 */}
      {[klient, ...competitors.slice(0, 2)].filter((x) => x).map((entry) => {
        if (!entry) return null;
        const [slug, data] = entry;
        const last = data.points[data.points.length - 1];
        if (!last) return null;
        const lastIdx = dayList.indexOf(last.day);
        if (lastIdx < 0) return null;
        return (
          <circle
            cx={xFor(lastIdx)}
            cy={yFor(last.sov)}
            r="3.5"
            fill={slug === klientSlug ? C.signal : C.ink}
          />
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PAD.l}, ${H - 4})`}>
        {([klient, ...competitors] as const).filter((x) => x).slice(0, 5).map((entry, i) => {
          if (!entry) return null;
          const [slug, b] = entry;
          const isKlient = slug === klientSlug;
          const color = isKlient ? C.signal : (competitorColors[(i === 0 ? 0 : i - 1) % competitorColors.length] ?? C.ink);
          const width = isKlient ? 2.4 : (competitorWidths[(i === 0 ? 0 : i - 1) % competitorWidths.length] ?? 1.5);
          const dash = isKlient ? '' : (competitorDashes[(i === 0 ? 0 : i - 1) % competitorDashes.length] ?? '');
          return (
            <g transform={`translate(${i * 130}, 0)`}>
              <line x1="0" y1="-4" x2="16" y2="-4" stroke={color} stroke-width={width} stroke-dasharray={dash} />
              <text x="22" y="-1" fill={isKlient ? C.signal : C.ink} font-family={C.fontBody} font-size="11" font-weight={isKlient ? 600 : 500}>{b.name}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ────────── Topic Heatmap ──────────
const HEATMAP_ROWS: Array<{ key: string; label: string }> = [
  { key: 'smartphones', label: 'Mobily' },
  { key: 'laptops', label: 'Notebooky' },
  { key: 'tv_audio', label: 'TV & audio' },
  { key: 'white_goods', label: 'Spotrebiče' },
  { key: 'gaming', label: 'Hry' },
  { key: 'accessories_smart_home', label: 'Smart home' },
];

const HEATMAP_COLS: Array<{ key: string; label: string }> = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'comparison', label: 'Porovnanie' },
  { key: 'validation', label: 'Recenzie' },
  { key: 'commercial_intent', label: 'Cena' },
  { key: 'product_specific', label: 'Produkt' },
  { key: 'trust_service', label: 'Servis' },
];

export const heatmapRowKeys = HEATMAP_ROWS.map((r) => r.key);
export const heatmapColKeys = HEATMAP_COLS.map((c) => c.key);

const cellColor = (v: number | null): string => {
  if (v === null) return C.bone;
  if (v >= 0.6) return '#2D6A4F';
  if (v >= 0.3) return '#79A88E';
  if (v >= 0.0) return '#D9D5C7';
  if (v >= -0.3) return '#E8AC9E';
  if (v >= -0.6) return '#D26B57';
  return '#C73E1D';
};

export const TopicHeatmap: FC<{
  cells: Map<string, { sentiment: number | null; sample: number }>;
}> = ({ cells }) => {
  return (
    <div>
      <div style={`display:grid;grid-template-columns:100px repeat(${HEATMAP_COLS.length}, 1fr);gap:4px`}>
        <span />
        {HEATMAP_COLS.map((c) => (
          <MonoLabel size={9} tracking="0.12em">{c.label}</MonoLabel>
        ))}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px">
        {HEATMAP_ROWS.map((row) => (
          <div style={`display:grid;grid-template-columns:100px repeat(${HEATMAP_COLS.length}, 1fr);gap:4px;align-items:stretch`}>
            <div style="display:flex;align-items:center">
              <span style={`font-family:${C.fontDisplay};font-size:13px;color:${C.ink};letter-spacing:-0.01em`}>{row.label}</span>
            </div>
            {HEATMAP_COLS.map((col) => {
              const cell = cells.get(`${row.key}|${col.key}`);
              const v = cell?.sentiment ?? null;
              const bg = cellColor(v);
              const showWhite = v !== null && Math.abs(v) > 0.3;
              return (
                <div
                  style={`height:44px;background:${bg};display:flex;align-items:center;justify-content:center`}
                  title={cell ? `n=${cell.sample}` : 'no data'}
                >
                  <Num size={10} color={showWhite ? '#fff' : C.ink}>
                    {v === null ? '·' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}`}
                  </Num>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:14px">
        <MonoLabel size={9} tracking="0.16em">Škála</MonoLabel>
        <div style="display:flex;gap:0">
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <div style={`width:32px;height:10px;background:${cellColor(v)}`} />
          ))}
        </div>
        <Num size={9} color={C.inkSoft}>Gap → Lead</Num>
      </div>
    </div>
  );
};

// ────────── Citation list ──────────
export const CitationList: FC<{
  rows: Array<{ domain: string; mentions: number; weight: number; trend: 'up' | 'down' | 'flat' }>;
}> = ({ rows }) => {
  if (rows.length === 0) {
    return <div style={`padding:24px 0;color:${C.inkSoft};font-size:13px`}>Žiadne citácie v období.</div>;
  }
  return (
    <div style="display:flex;flex-direction:column">
      <div style={`display:grid;grid-template-columns:1fr 56px 80px 32px;padding:12px 0;border-bottom:1px solid ${C.ink}`}>
        <MonoLabel size={9} tracking="0.18em">Doména</MonoLabel>
        <span style="text-align:right"><MonoLabel size={9} tracking="0.18em">Mentions</MonoLabel></span>
        <span style="text-align:right"><MonoLabel size={9} tracking="0.18em">Weight</MonoLabel></span>
        <span style="text-align:right"><MonoLabel size={9} tracking="0.18em">30D</MonoLabel></span>
      </div>
      {rows.map((r) => (
        <div style="display:grid;grid-template-columns:1fr 56px 80px 32px;padding:13px 0;border-bottom:1px solid rgba(14,17,22,0.08);align-items:baseline">
          <span style={`font-family:${C.fontDisplay};font-size:15px;font-weight:400;letter-spacing:-0.012em;color:${C.ink}`}>{r.domain}</span>
          <span style="text-align:right"><Num size={12} color={C.ink}>{r.mentions}</Num></span>
          <span style={`display:inline-flex;justify-content:flex-end;gap:1px;font-family:${C.fontMono};font-size:12px;color:${C.ink};letter-spacing:0.04em`}>
            {Array.from({ length: 5 }, (_, i) => (i < r.weight ? '★' : '·')).join('')}
          </span>
          <span style="text-align:right">
            <Num size={12} color={r.trend === 'up' ? C.positive : r.trend === 'down' ? C.negative : C.inkSoft}>
              {r.trend === 'up' ? '↗' : r.trend === 'down' ? '↘' : '→'}
            </Num>
          </span>
        </div>
      ))}
    </div>
  );
};

// ────────── Anomaly card ──────────
const PROVIDER_LABELS_LOCAL: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

export const AnomalyCard: FC<{
  severity: 'red' | 'amber' | 'green';
  title: string;
  context: string;
  tags: string[];
  detectedAt: Date;
}> = ({ severity, title, context, tags, detectedAt }) => {
  const dotColor = severity === 'red' ? C.negative : severity === 'green' ? C.positive : '#D7A93E';
  const sevLabel = severity === 'red' ? 'KRITICKÉ' : severity === 'green' ? 'POZITÍVNE' : 'POZOR';
  const timeStr = new Intl.DateTimeFormat('sk-SK', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(detectedAt);
  return (
    <div style={`border:1px solid ${C.bone};background:${C.paperPure};padding:18px 20px 16px;display:flex;flex-direction:column;gap:12px;border-left:3px solid ${dotColor}`}>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:inline-flex;align-items:center;gap:10px">
          <span style={`width:8px;height:8px;border-radius:50%;background:${dotColor}`} />
          <MonoLabel size={9} tracking="0.18em" color={dotColor}>{sevLabel}</MonoLabel>
          <span style={`width:1px;height:11px;background:${C.bone}`} />
          <Num size={10} color={C.inkSoft}>{timeStr}</Num>
        </div>
        <a href="#" style={`font-size:12px;color:${C.signal};text-decoration:none;border-bottom:1px solid ${C.signal};padding-bottom:1px`}>Vyšetriť →</a>
      </div>
      <div style={`font-family:${C.fontDisplay};font-size:17px;font-weight:400;line-height:1.25;letter-spacing:-0.015em;color:${C.ink}`}>{title}</div>
      <p style={`margin:0;font-size:13px;color:${C.inkSoft};line-height:1.5;max-width:74ch`}>{context}</p>
      {tags.length > 0 && (
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">
          {tags.map((t) => (
            <span style={`font-family:${C.fontMono};font-size:9px;letter-spacing:0.12em;color:${C.inkSoft};padding:3px 8px;border:1px solid rgba(14,17,22,0.14)`}>{t.toUpperCase()}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export function anomalyTitle(a: {
  kind: string;
  provider: string;
  subcategory: string | null;
  delta: number;
  curr: number;
  prev: number;
}): string {
  const llm = PROVIDER_LABELS_LOCAL[a.provider] ?? a.provider;
  const cat = a.subcategory ?? 'celkovo';
  if (a.kind === 'sov_drop') return `${llm} SoV klesol o ${Math.abs(a.delta).toFixed(1)} pp v kategórii ${cat}.`;
  if (a.kind === 'sov_jump') return `${llm} SoV stúpol o ${a.delta.toFixed(1)} pp v kategórii ${cat}.`;
  if (a.kind === 'sentiment_drop') return `${llm} sentiment voči vám klesol o ${Math.abs(a.delta).toFixed(2)} v kategórii ${cat}.`;
  return `${llm} · ${cat} · zmena ${a.delta}`;
}

export function anomalyTags(a: { provider: string; subcategory: string | null; kind: string }): string[] {
  const tags: string[] = [PROVIDER_LABELS_LOCAL[a.provider] ?? a.provider];
  if (a.subcategory) tags.push(a.subcategory);
  if (a.kind.startsWith('sov')) tags.push('SoV');
  else if (a.kind.startsWith('sentiment')) tags.push('Sentiment');
  return tags;
}

// ────────── UpcomingCard ──────────
export const UpcomingCard: FC<{
  kind: 'coming' | 'wip' | 'reserve';
  title: string;
  date: string;
  action?: string;
}> = ({ kind, title, date, action }) => {
  let pill;
  if (kind === 'coming') {
    pill = <span style={`background:${C.signalSoft};color:${C.signal};font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;padding:4px 8px`}>BLÍŽI SA</span>;
  } else if (kind === 'wip') {
    pill = <span style={`background:${C.bone};color:${C.ink};font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;padding:4px 8px`}>V PRÍPRAVE</span>;
  } else {
    pill = <span style={`background:${C.ink};color:${C.paper};font-family:${C.fontMono};font-size:9px;letter-spacing:0.14em;padding:4px 8px`}>REZERVOVAŤ</span>;
  }
  return (
    <div style={`padding:18px 20px;border-top:1px solid ${C.bone};display:flex;flex-direction:column;gap:8px`}>
      <div>{pill}</div>
      <div style={`font-family:${C.fontDisplay};font-size:17px;font-weight:400;line-height:1.2;color:${C.ink};letter-spacing:-0.015em`}>{title}</div>
      <Num size={10} color={C.inkSoft}>{date.toUpperCase()}</Num>
      {action && (
        <a href="#" style={`font-size:12.5px;color:${C.signal};text-decoration:none;border-bottom:1px solid ${C.signal};padding-bottom:1px;align-self:flex-start;margin-top:4px`}>{action} →</a>
      )}
    </div>
  );
};

// ────────── Section heading ──────────
export const Section: FC<PropsWithChildren<{ title: unknown; subtitle?: unknown }>> = ({ title, subtitle, children }) => (
  <section style="display:flex;flex-direction:column;gap:14px">
    <header style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap">
      <h3 style={`margin:0;font-family:${C.fontDisplay};font-weight:400;font-size:22px;letter-spacing:-0.022em;color:${C.ink};line-height:1.2`}>{title}</h3>
      {subtitle && <div style={`font-size:12px;color:${C.inkSoft};font-family:${C.fontBody}`}>{subtitle}</div>}
    </header>
    {children}
  </section>
);
