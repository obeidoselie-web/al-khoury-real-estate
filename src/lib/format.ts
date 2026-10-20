import type { DealType } from './types';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatPrice(price: number, deal: DealType): string {
  const amount = usd.format(price);
  return deal === 'rent' ? `${amount} / month` : amount;
}

/** Spoken-friendly variant for accessible names ("per month" rather than a slash). */
export function formatPriceSpoken(price: number, deal: DealType): string {
  const amount = usd.format(price);
  return deal === 'rent' ? `${amount} per month` : amount;
}

export function formatArea(sqm: number): string {
  return `${integer.format(sqm)} m²`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
