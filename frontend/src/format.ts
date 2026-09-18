export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') {
    return '';
  }
  const amount = Number(digits.slice(0, 10));
  if (!Number.isFinite(amount)) {
    return '';
  }
  return formatUsd(amount);
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function formatSqft(value: number): string {
  return `${new Intl.NumberFormat('en-US').format(value)} sq ft`;
}

export function formatBaths(value: number): string {
  const amount = Number.isInteger(value) ? String(value) : String(value);
  return `${amount} ${value === 1 ? 'bath' : 'baths'}`;
}

export function formatBeds(value: number): string {
  return `${value} ${value === 1 ? 'bed' : 'beds'}`;
}
