import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { formatNumber, interpolate } from '@/i18n/plural';

import type { DealType } from './types';

/**
 * Prices are shown as "$1,250,000" in both languages — the form Lebanese listings use.
 * (Intl's Arabic USD format renders as "US$", which reads poorly in RTL.)
 */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Left-to-right isolate (U+2066 … U+2069) keeps "$1,250,000" intact inside right-to-left text. */
function isolateLtr(value: string, locale: Locale): string {
  return locale === 'ar' ? `⁦${value}⁩` : value;
}

type FormatStrings = Pick<Dictionary, 'format'>;

export function formatPrice(price: number, deal: DealType, locale: Locale, t: FormatStrings): string {
  const amount = isolateLtr(usd.format(price), locale);
  return deal === 'rent' ? interpolate(t.format.perMonth, { amount }) : amount;
}

/** Spoken-friendly variant for accessible names ("per month" rather than a slash). */
export function formatPriceSpoken(price: number, deal: DealType, locale: Locale, t: FormatStrings): string {
  const amount = isolateLtr(usd.format(price), locale);
  return deal === 'rent' ? interpolate(t.format.perMonthSpoken, { amount }) : amount;
}

/** "Achrafieh, Beirut" / "الأشرفية، بيروت" — Arabic uses its own comma. */
export function formatPlace(location: { area: string; city: string }, locale: Locale): string {
  return `${location.area}${locale === 'ar' ? '، ' : ', '}${location.city}`;
}

export function formatArea(sqm: number, locale: Locale, t: FormatStrings): string {
  return interpolate(t.format.area, { value: formatNumber(sqm, locale) });
}
