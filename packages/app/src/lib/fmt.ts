// Slovak-localized formatters used across views.

const SK_LOCALE = 'sk-SK';

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(SK_LOCALE, { maximumFractionDigits: 0 }).format(n);
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(digits).replace('.', ',')} %`;
}

export function fmtDecimal(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(digits).replace('.', ',');
}

export function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(SK_LOCALE, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(SK_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(SK_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function fmtRelative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'pred chvíľou';
  if (min < 60) return `pred ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr} h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `pred ${days} dň.`;
  return fmtDate(date);
}

export function tierLabel(tier: string | null): string {
  if (!tier) return '—';
  if (tier === 'watch') return 'Watch';
  if (tier === 'pro') return 'Pro';
  if (tier === 'enterprise') return 'Enterprise';
  return tier;
}
