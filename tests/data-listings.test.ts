import { afterEach, describe, expect, it } from 'vitest';

import { LOCALES } from '@/i18n/config';
import {
  ListingsUnavailableError,
  getFeaturedListings,
  getListingById,
  getListingIds,
  getListingSummaries,
  getListings,
  resetListingsSource,
  setListingsSource,
} from '@/lib/data/listings';
import { PLACEHOLDER_LISTINGS, localizeListing } from '@/lib/data/placeholder-listings';
import { DEAL_TYPES, PROPERTY_TYPES } from '@/lib/types';

afterEach(() => {
  resetListingsSource();
  delete process.env.SIMULATE_LISTINGS_ERROR;
});

const ARABIC = /[؀-ۿ]/;

describe('placeholder data', () => {
  it('covers every property type for both sale and rent somewhere in the set', () => {
    for (const type of PROPERTY_TYPES) expect(PLACEHOLDER_LISTINGS.some((l) => l.type === type)).toBe(true);
    for (const deal of DEAL_TYPES) expect(PLACEHOLDER_LISTINGS.some((l) => l.deal === deal)).toBe(true);
  });

  it('has unique, URL-safe ids', () => {
    const ids = PLACEHOLDER_LISTINGS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('is fully translated: every text field exists in every locale, and Arabic text is Arabic', () => {
    for (const record of PLACEHOLDER_LISTINGS) {
      for (const locale of LOCALES) {
        const listing = localizeListing(record, locale);
        expect(listing.title, `${record.id} title (${locale})`).toBeTruthy();
        expect(listing.summary).toBeTruthy();
        expect(listing.location.area && listing.location.city).toBeTruthy();
        expect(listing.description.length).toBe(record.description.en.length);
        expect(listing.features.length).toBe(record.features.en.length);
        expect(listing.images.length).toBeGreaterThan(0);
        expect(listing.images.every((img) => img.alt.includes(listing.title))).toBe(true);
      }
      const arabic = localizeListing(record, 'ar');
      expect(arabic.title).toMatch(ARABIC);
      expect(arabic.summary).toMatch(ARABIC);
      expect(arabic.description.every((p) => ARABIC.test(p))).toBe(true);
    }
  });
});

describe('data-access module', () => {
  it('returns listings newest first', async () => {
    const dates = (await getListings('en')).map((l) => l.listedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('returns the same listings, in the same order, for every locale', async () => {
    const en = (await getListings('en')).map((l) => l.id);
    const ar = (await getListings('ar')).map((l) => l.id);
    expect(ar).toEqual(en);
    expect(await getListingIds()).toEqual(en);
  });

  it('returns lightweight summaries for cards', async () => {
    const [first] = await getListingSummaries('en');
    expect(first).toHaveProperty('image.src');
    expect(first).not.toHaveProperty('description');
  });

  it('returns only featured listings, respecting the limit', async () => {
    expect(await getFeaturedListings('en', 2)).toHaveLength(2);
  });

  it('finds a listing by id in the requested language and returns null for unknown or malformed ids', async () => {
    const id = 'villa-broummana-pine-view';
    expect((await getListingById(id, 'en'))?.title).toBe('Pine-view villa in Broummana');
    expect((await getListingById(id, 'ar'))?.title).toMatch(ARABIC);
    expect(await getListingById('does-not-exist', 'en')).toBeNull();
    expect(await getListingById('../../etc/passwd', 'en')).toBeNull();
  });

  it('wraps source failures in ListingsUnavailableError so routes can show the error UI', async () => {
    setListingsSource({
      list: () => Promise.reject(new Error('CMS timeout')),
      getById: () => Promise.reject(new Error('CMS timeout')),
    });
    await expect(getListings('en')).rejects.toBeInstanceOf(ListingsUnavailableError);
    await expect(getListingById('villa-broummana-pine-view', 'en')).rejects.toBeInstanceOf(ListingsUnavailableError);
  });

  it('can simulate a failure in development via SIMULATE_LISTINGS_ERROR', async () => {
    process.env.SIMULATE_LISTINGS_ERROR = '1';
    await expect(getListings('en')).rejects.toBeInstanceOf(ListingsUnavailableError);
  });

  it('passes the locale to any source that implements the interface', async () => {
    const base = localizeListing(PLACEHOLDER_LISTINGS[0], 'en');
    const seen: string[] = [];
    setListingsSource({
      list: async (locale) => {
        seen.push(locale);
        return [{ ...base, id: 'from-api' }];
      },
      getById: async (id, locale) => (id === 'from-api' ? { ...base, id, title: `title-${locale}` } : null),
    });
    expect((await getListings('ar')).map((l) => l.id)).toEqual(['from-api']);
    expect(seen).toEqual(['ar']);
    expect((await getListingById('from-api', 'ar'))?.title).toBe('title-ar');
  });
});
