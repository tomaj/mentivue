const NBSP = ' ';

export function formatNumber(n: number): string {
  return n.toLocaleString('sk-SK').replace(/\s/g, NBSP);
}

export function formatCurrency(n: number, currency: 'EUR' | 'USD' = 'EUR'): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace('.', ',')}${NBSP}%`;
}

export function formatDelta(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  return `${sign}${abs}`;
}
