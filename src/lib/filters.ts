import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate, plural } from '@/i18n/plural';

import { DEAL_TYPES, PROPERTY_TYPES, REGIONS, type DealType, type Listing, type PropertyType, type Region } from './types';

export type TypeFilter = PropertyType | 'all';
export type DealFilter = DealType | 'all';
export type RegionFilter = Region | 'all';

export interface ListingFilters {
  type: TypeFilter;
  deal: DealFilter;
  /** Optional so callers that only filter by type/deal stay simple; missing means "anywhere". */
  region?: RegionFilter;
  /** Budget ceiling in USD (monthly for rentals). Only applied once Buy or Rent is chosen. */
  maxPrice?: number;
  /** Minimum bedrooms (0 = studios and up). Listings without bedrooms (land, most commercial) drop out. */
  minBeds?: number;
  /** Minimum built area / plot size in m². */
  minSize?: number;
  sort?: SortOrder;
}

export const SORT_ORDERS = ['newest', 'price-asc', 'price-desc', 'size-desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** Budget presets per deal: monthly rent vs sale price. */
export const BUDGETS: Record<DealType, number[]> = {
  rent: [1_000, 2_000, 5_000, 10_000],
  sale: [300_000, 500_000, 1_000_000, 2_000_000],
};
export const BEDROOM_STEPS = [1, 2, 3, 4];
export const SIZE_STEPS = [100, 200, 500, 1_000];

export const DEFAULT_FILTERS: ListingFilters = { type: 'all', deal: 'all', region: 'all' };

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

function isSortOrder(value: unknown): value is SortOrder {
  return typeof value === 'string' && (SORT_ORDERS as readonly string[]).includes(value);
}

/** A whole number ≥ 1 (or ≥ 0 when allowZero), capped to keep URLs sane; anything else is ignored. */
function positiveInt(value: string | undefined, allowZero = false): number | undefined {
  if (!value || !/^\d{1,9}$/.test(value)) return undefined;
  const n = Number(value);
  return n > 0 || (allowZero && n === 0) ? n : undefined;
}

function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value);
}

/** Reads filters from URL params. Unknown or malformed values fall back to "all". */
export function parseFilters(params: ParamSource): ListingFilters {
  const type = readParam(params, 'type')?.toLowerCase();
  const deal = readParam(params, 'deal')?.toLowerCase();
  const region = readParam(params, 'region')?.toLowerCase();
  const filters: ListingFilters = {
    type: isPropertyType(type) ? type : 'all',
    deal: isDealType(deal) ? deal : 'all',
    region: isRegion(region) ? region : 'all',
  };
  const maxPrice = positiveInt(readParam(params, 'maxPrice'));
  const minBeds = positiveInt(readParam(params, 'minBeds'), true);
  const minSize = positiveInt(readParam(params, 'minSize'));
  const sort = readParam(params, 'sort');
  if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  if (minBeds !== undefined && minBeds <= 10) filters.minBeds = minBeds;
  if (minSize !== undefined) filters.minSize = minSize;
  if (isSortOrder(sort) && sort !== 'newest') filters.sort = sort;
  return filters;
}

/** Serialises filters to a query string (without "?"), omitting defaults so URLs stay clean. */
export function filtersToQueryString(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.deal !== 'all') params.set('deal', filters.deal);
  if (filters.type !== 'all') params.set('type', filters.type);
  if (filters.region && filters.region !== 'all') params.set('region', filters.region);
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minBeds !== undefined) params.set('minBeds', String(filters.minBeds));
  if (filters.minSize) params.set('minSize', String(filters.minSize));
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  return params.toString();
}

export function listingsHref(locale: Locale, filters: Partial<ListingFilters> = {}): string {
  const query = filtersToQueryString({ ...DEFAULT_FILTERS, ...filters });
  const path = localizedPath(locale, '/listings');
  return query ? `${path}?${query}` : path;
}

type Filterable = Pick<Listing, 'type' | 'deal'> &
  Partial<Pick<Listing, 'region' | 'price' | 'priceOnRequest' | 'bedrooms' | 'areaSqm'>>;

const inRegion = (listing: Filterable, region: RegionFilter | undefined) =>
  !region || region === 'all' || listing.region === region;

/** Budget, bedrooms and size — the refinements in the Filters panel. */
function matchesRefinements(listing: Filterable, filters: ListingFilters): boolean {
  if (filters.maxPrice && filters.deal !== 'all') {
    // A budget filter can't vouch for an unpublished price, so those listings drop out.
    if (listing.priceOnRequest || (listing.price !== undefined && listing.price > filters.maxPrice)) return false;
  }
  if (filters.minBeds !== undefined && (listing.bedrooms === undefined || listing.bedrooms < filters.minBeds)) return false;
  if (filters.minSize && (listing.areaSqm === undefined || listing.areaSqm < filters.minSize)) return false;
  return true;
}

export function matchesFilters(listing: Filterable, filters: ListingFilters): boolean {
  return (
    (filters.type === 'all' || listing.type === filters.type) &&
    (filters.deal === 'all' || listing.deal === filters.deal) &&
    inRegion(listing, filters.region) &&
    matchesRefinements(listing, filters)
  );
}

/** How many Filters-panel refinements are active (for the button badge). */
export function activeRefinements(filters: ListingFilters): number {
  return (filters.maxPrice && filters.deal !== 'all' ? 1 : 0) + (filters.minBeds !== undefined ? 1 : 0) + (filters.minSize ? 1 : 0);
}

/** Returns a sorted copy. "newest" keeps the data layer's order (it already returns newest first). */
export function sortListings<T extends Pick<Listing, 'price' | 'priceOnRequest' | 'areaSqm'>>(
  listings: readonly T[],
  sort: SortOrder = 'newest',
): T[] {
  const copy = [...listings];
  // Listings without a published price or size sort after the rest.
  const byPrice = (dir: 1 | -1) => (a: T, b: T) =>
    Number(Boolean(a.priceOnRequest)) - Number(Boolean(b.priceOnRequest)) || dir * (a.price - b.price);
  if (sort === 'price-asc') copy.sort(byPrice(1));
  else if (sort === 'price-desc') copy.sort(byPrice(-1));
  else if (sort === 'size-desc') copy.sort((a, b) => (b.areaSqm ?? -1) - (a.areaSqm ?? -1));
  return copy;
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
  const byRegion = { all: 0 } as Record<RegionFilter, number>;
  for (const t of PROPERTY_TYPES) byType[t] = 0;
  for (const d of DEAL_TYPES) byDeal[d] = 0;
  for (const r of REGIONS) byRegion[r] = 0;

  // Bedrooms and size narrow the counts too; budget doesn't, because it depends on the deal chosen.
  const { maxPrice: _maxPrice, ...withoutBudget } = filters;
  for (const listing of listings) {
    if (!matchesRefinements(listing, withoutBudget)) continue;
    // Region counts: what each area would show with the current type and deal.
    if ((filters.type === 'all' || listing.type === filters.type) && (filters.deal === 'all' || listing.deal === filters.deal)) {
      byRegion.all += 1;
      if (listing.region) byRegion[listing.region] += 1;
    }
    if (!inRegion(listing, filters.region)) continue;
    if (filters.deal === 'all' || listing.deal === filters.deal) {
      byType.all += 1;
      byType[listing.type] += 1;
    }
    if (filters.type === 'all' || listing.type === filters.type) {
      byDeal.all += 1;
      byDeal[listing.deal] += 1;
    }
  }
  return { byType, byDeal, byRegion };
}

/**
 * Human sentence for the results count, e.g. "3 apartments for rent" / "3 شقق للإيجار".
 * Used visually and announced to screen readers. Uses CLDR plural rules for the locale.
 */
export function describeResults(
  count: number,
  filters: ListingFilters,
  locale: Locale,
  t: Pick<Dictionary, 'types' | 'deals' | 'listings' | 'regions'>,
): string {
  const where =
    filters.region && filters.region !== 'all' ? ` ${interpolate(t.listings.inRegion, { region: t.regions[filters.region] })}` : '';
  const deal = (filters.deal === 'all' ? '' : ` ${t.deals[filters.deal].phrase}`) + where;

  if (count === 0) {
    const noun = filters.type === 'all' ? t.listings.noneProperties : t.types[filters.type].none;
    return interpolate(t.listings.noneOf, { noun, deal });
  }

  const forms = filters.type === 'all' ? t.listings.anyProperty : t.types[filters.type].count;
  return `${plural(locale, count, forms)}${deal}`;
}

export function isDefaultFilters(filters: ListingFilters): boolean {
  return (
    filters.type === 'all' &&
    filters.deal === 'all' &&
    (!filters.region || filters.region === 'all') &&
    activeRefinements({ ...filters, deal: filters.maxPrice ? 'sale' : filters.deal }) === 0
  );
}
