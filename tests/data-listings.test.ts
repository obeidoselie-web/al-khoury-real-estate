import { afterEach, describe, expect, it } from 'vitest';

import {
  ListingsUnavailableError,
  getFeaturedListings,
  getListingById,
  getListingSummaries,
  getListings,
  resetListingsSource,
  setListingsSource,
} from '@/lib/data/listings';
import { PLACEHOLDER_LISTINGS } from '@/lib/data/placeholder-listings';
import { DEAL_TYPES, PROPERTY_TYPES } from '@/lib/types';

afterEach(() => {
  resetListingsSource();
  delete process.env.SIMULATE_LISTINGS_ERROR;
});

describe('placeholder data', () => {
  it('covers every property type for both sale and rent somewhere in the set', () => {
    for (const type of PROPERTY_TYPES) expect(PLACEHOLDER_LISTINGS.some((l) => l.type === type)).toBe(true);
    for (const deal of DEAL_TYPES) expect(PLACEHOLDER_LISTINGS.some((l) => l.deal === deal)).toBe(true);
  });

  it('has unique, URL-safe ids and at least one image each', () => {
    const ids = PLACEHOLDER_LISTINGS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const listing of PLACEHOLDER_LISTINGS) {
      expect(listing.id).toMatch(/^[a-z0-9-]+$/);
      expect(listing.images.length).toBeGreaterThan(0);
      expect(listing.images.every((img) => img.alt.length > 0)).toBe(true);
    }
  });
});

describe('data-access module', () => {
  it('returns listings newest first', async () => {
    const listings = await getListings();
    const dates = listings.map((l) => l.listedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('returns lightweight summaries for cards', async () => {
    const [first] = await getListingSummaries();
    expect(first).toHaveProperty('image.src');
    expect(first).not.toHaveProperty('description');
  });

  it('returns only featured listings, respecting the limit', async () => {
    const featured = await getFeaturedListings(2);
    expect(featured).toHaveLength(2);
  });

  it('finds a listing by id and returns null for unknown or malformed ids', async () => {
    const known = PLACEHOLDER_LISTINGS[0];
    expect((await getListingById(known.id))?.title).toBe(known.title);
    expect(await getListingById('does-not-exist')).toBeNull();
    expect(await getListingById('../../etc/passwd')).toBeNull();
  });

  it('wraps source failures in ListingsUnavailableError so routes can show the error UI', async () => {
    setListingsSource({
      list: () => Promise.reject(new Error('CMS timeout')),
      getById: () => Promise.reject(new Error('CMS timeout')),
    });
    await expect(getListings()).rejects.toBeInstanceOf(ListingsUnavailableError);
    await expect(getListingById('villa-broummana-pine-view')).rejects.toBeInstanceOf(ListingsUnavailableError);
  });

  it('can simulate a failure in development via SIMULATE_LISTINGS_ERROR', async () => {
    process.env.SIMULATE_LISTINGS_ERROR = '1';
    await expect(getListings()).rejects.toBeInstanceOf(ListingsUnavailableError);
  });

  it('accepts any source that implements the interface', async () => {
    const custom = { ...PLACEHOLDER_LISTINGS[0], id: 'from-api' };
    setListingsSource({ list: async () => [custom], getById: async (id) => (id === custom.id ? custom : null) });
    expect(await getListings()).toEqual([custom]);
    expect(await getListingById('from-api')).toEqual(custom);
  });
});
