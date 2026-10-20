import { formatArea, pluralize } from './format';
import type { Listing } from './types';

type FactSource = Pick<Listing, 'type' | 'bedrooms' | 'bathrooms' | 'areaSqm'>;

/** Short, scannable facts for cards: "3 beds · 2 baths · 240 m²". */
export function cardFacts(listing: FactSource): string[] {
  const facts: string[] = [];
  if (listing.bedrooms !== undefined) {
    facts.push(listing.bedrooms === 0 ? 'Studio' : pluralize(listing.bedrooms, 'bed'));
  }
  if (listing.bathrooms !== undefined && listing.type !== 'land') {
    facts.push(pluralize(listing.bathrooms, 'bath'));
  }
  facts.push(formatArea(listing.areaSqm));
  return facts;
}
