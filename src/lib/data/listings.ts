import 'server-only';

import type { Locale } from '@/i18n/config';

import { toSummary, type Listing, type ListingSummary } from '../types';
import { PLACEHOLDER_LISTINGS, localizeListing } from './placeholder-listings';

/**
 * THE data-access module for listings. Every page reads listings through the functions
 * exported here, never from a source directly.
 *
 * To move to an API or CMS, implement `ListingsSource` (see README → "Swapping the data source")
 * and assign it to `source` below. Pages and components stay unchanged.
 * Sources receive the requested locale and return listings with text already in that language.
 */
export interface ListingsSource {
  list(locale: Locale): Promise<Listing[]>;
  getById(id: string, locale: Locale): Promise<Listing | null>;
}

export class ListingsUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Listings are temporarily unavailable.', { cause });
    this.name = 'ListingsUnavailableError';
  }
}

const placeholderSource: ListingsSource = {
  async list(locale) {
    return PLACEHOLDER_LISTINGS.map((record) => localizeListing(record, locale));
  },
  async getById(id, locale) {
    const record = PLACEHOLDER_LISTINGS.find((listing) => listing.id === id);
    return record ? localizeListing(record, locale) : null;
  },
};

let source: ListingsSource = placeholderSource;

/** Test seam: lets tests (or a future composition root) inject a source. */
export function setListingsSource(next: ListingsSource): void {
  source = next;
}

export function resetListingsSource(): void {
  source = placeholderSource;
}

const ID_PATTERN = /^[a-z0-9-]{1,120}$/;

function simulateFailureIfRequested(): void {
  if (process.env.NODE_ENV !== 'production' && process.env.SIMULATE_LISTINGS_ERROR === '1') {
    throw new Error('Simulated listings failure (SIMULATE_LISTINGS_ERROR=1)');
  }
}

function newestFirst(a: Listing, b: Listing): number {
  return b.listedAt.localeCompare(a.listedAt);
}

export async function getListings(locale: Locale): Promise<Listing[]> {
  try {
    simulateFailureIfRequested();
    const listings = await source.list(locale);
    return [...listings].sort(newestFirst);
  } catch (error) {
    throw new ListingsUnavailableError(error);
  }
}

export async function getListingSummaries(locale: Locale): Promise<ListingSummary[]> {
  return (await getListings(locale)).map(toSummary);
}

export async function getFeaturedListings(locale: Locale, limit = 3): Promise<ListingSummary[]> {
  const listings = await getListings(locale);
  return listings
    .filter((listing) => listing.featured)
    .slice(0, limit)
    .map(toSummary);
}

/** Returns null for unknown or malformed ids so the route can render its not-found page. */
export async function getListingById(id: string, locale: Locale): Promise<Listing | null> {
  if (!ID_PATTERN.test(id)) return null;
  try {
    simulateFailureIfRequested();
    return await source.getById(id, locale);
  } catch (error) {
    throw new ListingsUnavailableError(error);
  }
}

/** Ids are language-independent; used for static generation of every locale. */
export async function getListingIds(): Promise<string[]> {
  return (await getListings('en')).map((listing) => listing.id);
}
