import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { plural } from '@/i18n/plural';

import { formatArea } from './format';
import type { Listing } from './types';

type FactSource = Pick<Listing, 'type' | 'bedrooms' | 'bathrooms' | 'areaSqm'>;

/** Short, scannable facts for cards: "3 beds · 2 baths · 240 m²". */
export function cardFacts(listing: FactSource, locale: Locale, t: Pick<Dictionary, 'card' | 'format'>): string[] {
  const facts: string[] = [];
  if (listing.bedrooms !== undefined) {
    facts.push(listing.bedrooms === 0 ? t.card.studio : plural(locale, listing.bedrooms, t.card.beds));
  }
  if (listing.bathrooms !== undefined && listing.type !== 'land') {
    facts.push(plural(locale, listing.bathrooms, t.card.baths));
  }
  facts.push(formatArea(listing.areaSqm, locale, t));
  return facts;
}
