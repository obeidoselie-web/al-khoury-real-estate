import { describe, expect, it } from 'vitest';

import { getDictionary } from '@/i18n/dictionaries';
import {
  DEFAULT_FILTERS,
  countOptions,
  describeResults,
  filterListings,
  filtersToQueryString,
  isDefaultFilters,
  listingsHref,
  parseFilters,
} from '@/lib/filters';

import { sampleListings } from './fixtures';

const en = getDictionary('en');
const ar = getDictionary('ar');

describe('parseFilters', () => {
  it('defaults to all/all when params are absent', () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it('reads valid values from a record or URLSearchParams, case-insensitively', () => {
    expect(parseFilters({ type: 'Apartment', deal: 'RENT' })).toEqual({ type: 'apartment', deal: 'rent', region: 'all' });
    expect(parseFilters(new URLSearchParams('type=land&deal=sale&region=Koura'))).toEqual({
      type: 'land',
      deal: 'sale',
      region: 'koura',
    });
  });

  it('ignores unknown or malicious values', () => {
    expect(parseFilters({ type: 'castle', deal: '<script>' })).toEqual(DEFAULT_FILTERS);
  });

  it('uses the first value when a param is repeated', () => {
    expect(parseFilters({ type: ['house', 'land'] })).toEqual({ type: 'house', deal: 'all', region: 'all' });
    expect(parseFilters({ region: 'atlantis' }).region).toBe('all');
  });
});

describe('filtersToQueryString / listingsHref', () => {
  it('omits defaults to keep URLs clean', () => {
    expect(filtersToQueryString(DEFAULT_FILTERS)).toBe('');
    expect(listingsHref('en')).toBe('/en/listings');
  });

  it('round-trips through parseFilters', () => {
    const filters = { type: 'commercial', deal: 'rent', region: 'beirut' } as const;
    expect(parseFilters(new URLSearchParams(filtersToQueryString(filters)))).toEqual(filters);
    expect(listingsHref('ar', { type: 'land' })).toBe('/ar/listings?type=land');
  });
});

describe('filterListings', () => {
  const listings = sampleListings();

  it('returns everything for the default filters', () => {
    expect(filterListings(listings, DEFAULT_FILTERS)).toHaveLength(listings.length);
  });

  it('filters by deal only', () => {
    const rent = filterListings(listings, { type: 'all', deal: 'rent' });
    expect(rent).toHaveLength(4);
    expect(rent.every((listing) => listing.deal === 'rent')).toBe(true);
  });

  it('filters by type only', () => {
    expect(filterListings(listings, { type: 'apartment', deal: 'all' })).toHaveLength(3);
  });

  it('filters by region, alone or combined', () => {
    expect(filterListings(listings, { type: 'all', deal: 'all', region: 'metn' })).toHaveLength(2);
    expect(filterListings(listings, { type: 'house', deal: 'rent', region: 'metn' })).toHaveLength(1);
    expect(filterListings(listings, { type: 'house', deal: 'all', region: 'beirut' })).toEqual([]);
  });

  it('combines type and deal', () => {
    const result = filterListings(listings, { type: 'apartment', deal: 'rent' });
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.type === 'apartment' && l.deal === 'rent')).toBe(true);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterListings(listings, { type: 'land', deal: 'rent' })).toEqual([]);
  });

  it('does not mutate the input', () => {
    const copy = [...listings];
    filterListings(listings, { type: 'house', deal: 'sale' });
    expect(listings).toEqual(copy);
  });
});

describe('countOptions', () => {
  it('counts each option against the other active filter', () => {
    const { byType, byDeal } = countOptions(sampleListings(), { type: 'apartment', deal: 'rent' });
    // Type counts are scoped to rentals.
    expect(byType).toMatchObject({ all: 4, house: 1, apartment: 2, commercial: 1, land: 0 });
    // Deal counts are scoped to apartments.
    expect(byDeal).toMatchObject({ all: 3, sale: 1, rent: 2 });
  });
});

describe('describeResults', () => {
  it('builds natural English sentences', () => {
    expect(describeResults(7, DEFAULT_FILTERS, 'en', en)).toBe('7 properties');
    expect(describeResults(1, DEFAULT_FILTERS, 'en', en)).toBe('1 property');
    expect(describeResults(2, { type: 'apartment', deal: 'rent' }, 'en', en)).toBe('2 apartments for rent');
    expect(describeResults(1, { type: 'commercial', deal: 'sale' }, 'en', en)).toBe('1 commercial property for sale');
    expect(describeResults(0, { type: 'land', deal: 'rent' }, 'en', en)).toBe('No land plots for rent right now');
    expect(describeResults(3, { type: 'apartment', deal: 'sale', region: 'beirut' }, 'en', en)).toBe(
      '3 apartments for sale in Beirut',
    );
  });

  it('uses every Arabic plural category', () => {
    const all = DEFAULT_FILTERS;
    expect(describeResults(1, all, 'ar', ar)).toBe('عقار واحد');
    expect(describeResults(2, all, 'ar', ar)).toBe('عقاران');
    expect(describeResults(3, all, 'ar', ar)).toBe('3 عقارات');
    expect(describeResults(11, all, 'ar', ar)).toBe('11 عقارًا');
    expect(describeResults(100, all, 'ar', ar)).toBe('100 عقار');
    expect(describeResults(2, { type: 'apartment', deal: 'rent' }, 'ar', ar)).toBe('شقتان للإيجار');
    expect(describeResults(0, { type: 'house', deal: 'sale' }, 'ar', ar)).toBe('لا توجد منازل للبيع حاليًا');
    expect(describeResults(2, { type: 'all', deal: 'rent', region: 'metn' }, 'ar', ar)).toBe('عقاران للإيجار في المتن');
  });
});

describe('isDefaultFilters', () => {
  it('detects the unfiltered state', () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true);
    expect(isDefaultFilters({ type: 'house', deal: 'all' })).toBe(false);
  });
});
