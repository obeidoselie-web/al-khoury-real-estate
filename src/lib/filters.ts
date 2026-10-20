import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate, plural } from '@/i18n/plural';

import { DEAL_TYPES, PROPERTY_TYPES, type DealType, type Listing, type PropertyType } from './types';

export type TypeFilter = PropertyType | 'all';
export type DealFilter = DealType | 'all';

export interface ListingFilters {
  type: TypeFilter;
  deal: DealFilter;
}

export const DEFAULT_FILTERS: ListingFilters = { type: 'all', deal: 'all' };

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(params: ParamSource, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isPropertyType(value: unknown): value is PropertyType {
  return typeof value === 'string' && (PROPERTY_TYPES as readonly string[]).includes(value);
}

function isDealType(value: unknown): value is DealType {
  return typeof value === 'string' && (DEAL_TYPES as readonly string[]).includes(value);
}

/** Reads filters from URL params. Unknown or malformed values fall back to "all". */
export function parseFilters(params: ParamSource): ListingFilters {
  const type = readParam(params, 'type')?.toLowerCase();
  const deal = readParam(params, 'deal')?.toLowerCase();
  return {
    type: isPropertyType(type) ? type : 'all',
    deal: isDealType(deal) ? deal : 'all',
  };
}

/** Serialises filters to a query string (without "?"), omitting defaults so URLs stay clean. */
export function filtersToQueryString(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.deal !== 'all') params.set('deal', filters.deal);
  if (filters.type !== 'all') params.set('type', filters.type);
  return params.toString();
}

export function listingsHref(locale: Locale, filters: Partial<ListingFilters> = {}): string {
  const query = filtersToQueryString({ ...DEFAULT_FILTERS, ...filters });
  const path = localizedPath(locale, '/listings');
  return query ? `${path}?${query}` : path;
}

type Filterable = Pick<Listing, 'type' | 'deal'>;

export function matchesFilters(listing: Filterable, filters: ListingFilters): boolean {
  return (
    (filters.type === 'all' || listing.type === filters.type) &&
    (filters.deal === 'all' || listing.deal === filters.deal)
  );
}

export function filterListings<T extends Filterable>(listings: readonly T[], filters: ListingFilters): T[] {
  return listings.filter((listing) => matchesFilters(listing, filters));
}

/**
 * How many results each option would produce, given the *other* active filter.
 * Shown on filter chips so people can see dead ends before tapping them.
 */
export function countOptions(listings: readonly Filterable[], filters: ListingFilters) {
  const byType = { all: 0 } as Record<TypeFilter, number>;
  const byDeal = { all: 0 } as Record<DealFilter, number>;
  for (const t of PROPERTY_TYPES) byType[t] = 0;
  for (const d of DEAL_TYPES) byDeal[d] = 0;

  for (const listing of listings) {
    if (filters.deal === 'all' || listing.deal === filters.deal) {
      byType.all += 1;
      byType[listing.type] += 1;
    }
    if (filters.type === 'all' || listing.type === filters.type) {
      byDeal.all += 1;
      byDeal[listing.deal] += 1;
    }
  }
  return { byType, byDeal };
}

/**
 * Human sentence for the results count, e.g. "3 apartments for rent" / "3 شقق للإيجار".
 * Used visually and announced to screen readers. Uses CLDR plural rules for the locale.
 */
export function describeResults(
  count: number,
  filters: ListingFilters,
  locale: Locale,
  t: Pick<Dictionary, 'types' | 'deals' | 'listings'>,
): string {
  const deal = filters.deal === 'all' ? '' : ` ${t.deals[filters.deal].phrase}`;

  if (count === 0) {
    const noun = filters.type === 'all' ? t.listings.noneProperties : t.types[filters.type].none;
    return interpolate(t.listings.noneOf, { noun, deal });
  }

  const forms = filters.type === 'all' ? t.listings.anyProperty : t.types[filters.type].count;
  return `${plural(locale, count, forms)}${deal}`;
}

export function isDefaultFilters(filters: ListingFilters): boolean {
  return filters.type === 'all' && filters.deal === 'all';
}
