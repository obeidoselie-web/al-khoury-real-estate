import 'server-only';

import { and, asc, eq, inArray } from 'drizzle-orm';

import { getDb } from '@/db';
import { advisorProfiles, listingPhotos, listings, users } from '@/db/schema';
import type { Locale } from '@/i18n/config';

import type { Listing, Region } from '../types';
import { advisorForRegion, type Advisor } from './advisors';
import type { ListingsSource } from './listings';
import { profileToAdvisor, rowToListing } from './mappers';

/** The live catalogue: published listings from the database, with their photos in order. */
export const databaseListingsSource: ListingsSource = {
  async list(locale: Locale): Promise<Listing[]> {
    const db = await getDb();
    const rows = await db.select().from(listings).where(eq(listings.status, 'published'));
    if (rows.length === 0) return [];
    const photos = await db
      .select()
      .from(listingPhotos)
      .where(inArray(listingPhotos.listingId, rows.map((row) => row.id)))
      .orderBy(asc(listingPhotos.position));
    const byListing = Map.groupBy(photos, (photo) => photo.listingId);
    return rows
      .map((row) => rowToListing(row, byListing.get(row.id) ?? [], locale))
      .filter((listing) => listing.images.length > 0);
  },

  async getById(id: string, locale: Locale): Promise<Listing | null> {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.status, 'published')));
    if (!row) return null;
    const photos = await db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, id))
      .orderBy(asc(listingPhotos.position));
    return photos.length > 0 ? rowToListing(row, photos, locale) : null;
  },
};

/** Visible advisor profiles, in the order set in Team. */
export async function getPublicAdvisors(): Promise<Advisor[]> {
  const db = await getDb();
  const rows = await db
    .select({ user: users, profile: advisorProfiles })
    .from(advisorProfiles)
    .innerJoin(users, eq(users.id, advisorProfiles.userId))
    .where(and(eq(advisorProfiles.visible, true), eq(users.active, true)))
    .orderBy(asc(advisorProfiles.sortOrder), asc(users.name));
  return rows.map(({ user, profile }) => profileToAdvisor(user, profile));
}

/** The listing's own advisor if they have a visible profile, else whoever covers its region. */
export async function getAdvisorForListing(listing: Pick<Listing, 'advisorId' | 'region'>): Promise<Advisor | null> {
  const advisors = await getPublicAdvisors();
  if (advisors.length === 0) return null;
  return advisors.find((advisor) => advisor.id === listing.advisorId) ?? advisorForRegion(listing.region as Region, advisors);
}
