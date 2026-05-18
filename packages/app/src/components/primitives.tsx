// Shared design primitives — translated from the React prototype to Hono JSX.
// Inline styles match prototype 1:1 (intentional — keeps tokens, sizing, and
// editorial details obvious for cross-reference with packages/site).

import type { FC, PropsWithChildren } from 'hono/jsx';

export const C = {
  ink: '#0E1116',
  inkSoft: '#1F2429',
  paper: '#F7F4ED',
  paperPure: '#FFFFFF',
  bone: '#EBE5D7',
  boneDeep: '#DDD5C2',
  depth: '#1B3A4B',
  signal: '#FF5B3A',
  signalSoft: '#FFE8E0',
  positive: '#2D6A4F',
  negative: '#C73E1D',
  fontDisplay: "'Fraunces', Georgia, serif",
  fontBody: "'Inter Tight', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, monospace",
};

// ────────── Logo ──────────
export const LogoMark: FC<{ size?: number; onPaper?: boolean }> = ({ size = 28, onPaper }) => {
  const stroke = onPaper ? C.paper : C.ink;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style="display:block;flex:none">
      <circle cx="24" cy="24" r="22" fill="none" stroke={stroke} stroke-width="2" />
      <path d="M 6 24 Q 24 6 42 24 Q 24 42 6 24 Z" fill="none" stroke={stroke} stroke-width="2" />
      <circle cx="24" cy="24" r="5" fill={C.signal} />
    </svg>
  );
};

export const LogoLockup: FC<{ size?: number; color?: string }> = ({ size = 26, color }) => {
  const c = color ?? C.ink;
  return (
    <div style="display:flex;align-items:center;gap:10px">
      <LogoMark size={size} onPaper={c === C.paper} />
      <span style={`font-family:${C.fontDisplay};font-size:${Math.round(size * 0.86)}px;font-weight:500;letter-spacing:-0.025em;color:${c};line-height:1`}>
        mentivue
      </span>
    </div>
  );
};

// ────────── Pulse dot ──────────
export const PulseDot: FC<{ size?: number; color?: string }> = ({ size = 8, color }) => {
  const c = color ?? C.signal;
  return (
    <span
      class="pulse-dot"
      style={`display:inline-block;width:${size}px;height:${size}px;background:${c};border-radius:50%;flex:none`}
    />
  );
};

// ────────── Mono label ──────────
export const MonoLabel: FC<PropsWithChildren<{ size?: number; tracking?: string; color?: string }>> = ({
  children,
  size = 11,
  tracking = '0.14em',
  color,
}) => {
  const c = color ?? C.inkSoft;
  return (
    <span style={`font-family:${C.fontMono};font-size:${size}px;font-weight:500;letter-spacing:${tracking};text-transform:uppercase;color:${c}`}>
      {children}
    </span>
  );
};

// ────────── Tabular mono number ──────────
export const Num: FC<PropsWithChildren<{ size?: number; weight?: number; color?: string }>> = ({
  children,
  size = 13,
  weight = 500,
  color,
}) => {
  const c = color ?? 'inherit';
  return (
    <span style={`font-family:${C.fontMono};font-variant-numeric:tabular-nums;color:${c};font-size:${size}px;font-weight:${weight}`}>
      {children}
    </span>
  );
};

// ────────── Buttons ──────────
type BtnVariant = 'ink' | 'signal' | 'ghost';
type BtnSize = 'sm' | 'md' | 'lg';
export const Button: FC<
  PropsWithChildren<{
    variant?: BtnVariant;
    size?: BtnSize;
    full?: boolean;
    type?: 'button' | 'submit';
    href?: string;
    style?: string;
  }>
> = ({ children, variant = 'ink', size = 'md', full, type = 'button', href, style }) => {
  const padding = size === 'lg' ? '18px 24px' : size === 'sm' ? '8px 14px' : '14px 22px';
  const fontSize = size === 'lg' ? 15 : size === 'sm' ? 12.5 : 14;
  let bg = C.ink, fg = C.paper, border = C.ink;
  if (variant === 'signal') { bg = C.signal; border = C.signal; }
  else if (variant === 'ghost') { bg = 'transparent'; fg = C.ink; border = C.ink; }
  const inline = `display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:${C.fontBody};font-size:${fontSize}px;font-weight:500;letter-spacing:0.005em;padding:${padding};border:1px solid ${border};background:${bg};color:${fg};text-decoration:none;cursor:pointer;white-space:nowrap;${full ? 'width:100%;' : ''}transition:opacity 0.18s ease;${style ?? ''}`;
  if (href) return <a href={href} style={inline}>{children}</a>;
  return <button type={type} style={inline}>{children}</button>;
};

// ────────── Delta pill (▲ +2.1) ──────────
export const Delta: FC<{
  value: string | number;
  suffix?: string;
  direction: 'up' | 'down' | 'flat';
  good?: 'up' | 'down';
}> = ({ value, suffix = '', direction, good = 'up' }) => {
  const isGood = direction === good || direction === 'flat';
  const color = direction === 'flat' ? C.inkSoft : isGood ? C.positive : C.negative;
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
  return (
    <span style={`display:inline-flex;align-items:center;gap:6px;font-family:${C.fontMono};font-size:11.5px;color:${color}`}>
      {arrow}
      <span>{value}{suffix}</span>
    </span>
  );
};

// Greeting based on the time of day, in Slovak vykanie.
export function timeOfDayGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 11) return 'Dobré ráno';
  if (h < 18) return 'Dobrý deň';
  return 'Dobrý večer';
}
