// Shared report chrome: page wrapper, run headers/footers, eyebrows, openers.
// Reports render to standalone HTML strings (no app dependencies), suitable for
// browser print-to-PDF or future Puppeteer pipeline.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FC, PropsWithChildren } from 'hono/jsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedReportCss: string | null = null;
function reportCss(): string {
  if (cachedReportCss === null) {
    cachedReportCss = readFileSync(resolve(__dirname, 'report.css'), 'utf-8');
  }
  return cachedReportCss;
}

// Inline brand logo SVG used in cover + run footer
export const LogoSvg: FC<{ size?: number }> = ({ size = 48 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <circle cx="24" cy="24" r="22" fill="none" stroke="#0E1116" stroke-width="2" />
    <path d="M 6 24 Q 24 6 42 24 Q 24 42 6 24 Z" fill="none" stroke="#0E1116" stroke-width="2" />
    <circle cx="24" cy="24" r="5" fill="#FF5B3A" />
  </svg>
);

const RunFootMark: FC = () => (
  <span class="mark">
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="none" stroke="#1F2429" stroke-width="3" />
      <circle cx="24" cy="24" r="5" fill="#FF5B3A" />
    </svg>
  </span>
);

// ─── Shared atomic blocks ───
export type RunHeadProps = { left: string; right: string; confidential?: boolean };
export const RunHead: FC<RunHeadProps> = ({ left, right, confidential }) => (
  <div class="runhead">
    <span>
      {left}
      {confidential && (
        <>
          {' · '}
          <span class="confidential">Confidential</span>
        </>
      )}
    </span>
    <span>{right}</span>
  </div>
);

export type RunFootProps = { ref: string; brand: string; page: string };
export const RunFoot: FC<RunFootProps> = ({ ref, brand, page }) => (
  <div class="runfoot">
    <span>
      {ref} · {brand}
    </span>
    <RunFootMark />
    <span>{page}</span>
  </div>
);

export const Eyebrow: FC<PropsWithChildren> = ({ children }) => (
  <div class="eyebrow">{children}</div>
);

export type PageProps = PropsWithChildren<{ classes?: string }>;
export const Page: FC<PageProps> = ({ classes, children }) => (
  <section class={`page ${classes ?? ''}`}>{children}</section>
);

// ─── Document shell ───
export type ReportDocProps = PropsWithChildren<{
  title: string;
  extraCss?: string; // per-report inline custom styles (the prototype's <style> blocks)
}>;

export const ReportDoc: FC<ReportDocProps> = ({ title, extraCss, children }) => (
  <html lang="sk">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>{title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: reportCss() }} />
      {extraCss && <style dangerouslySetInnerHTML={{ __html: extraCss }} />}
    </head>
    <body>
      <div class="report">{children}</div>
    </body>
  </html>
);

// ─── Helpers ───
export function fmtMonthYear(d: Date): string {
  return new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(d);
}
export function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')} %`;
}
export function fmtSigned(n: number, suffix = ''): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(1).replace('.', ',')}${suffix}`;
}
export function fmtIndex(n: number): string {
  return n.toFixed(1).replace('.', ',');
}
export function fmtSentiment(n: number): string {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2).replace('.', ',')}`;
}
