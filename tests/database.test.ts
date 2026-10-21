// @vitest-environment node
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';

import { getDb } from '@/db';
import { seedDatabase } from '@/db/seed';
import { leads, listingPhotos, listings, users } from '@/db/schema';
import { deliverLead } from '@/lib/contact-delivery';
import { advisorForRegion } from '@/lib/data/advisors';
import { databaseListingsSource, getAdvisorForListing, getPublicAdvisors } from '@/lib/data/db-source';
import { PLACEHOLDER_LISTINGS, localizeListing } from '@/lib/data/placeholder-listings';
import { isValidKey, LocalDiskStorage, storeListingPhoto, UploadError } from '@/lib/storage';

import { useTestDatabase } from './db';

/*
 * Runs the real schema, migrations, seed and queries against a throwaway SQLite file
 * (no mocks): the same code path the site and admin use.
 */

useTestDatabase();

beforeAll(async () => {
  await seedDatabase(await getDb(), { adminEmail: 'Owner@Example.com', adminPassword: 'a test password 123' });
});

describe('seed', () => {
  it('creates the admin (email normalised) and passwordless placeholder advisors, and is re-runnable', async () => {
    const db = await getDb();
    const all = await db.select().from(users);
    const admin = all.find((u) => u.role === 'admin');
    expect(admin?.email).toBe('owner@example.com');
    expect(admin?.passwordHash).toMatch(/^scrypt\$/);
    expect(all.filter((u) => u.role === 'advisor' && u.passwordHash === null)).toHaveLength(3);

    const again = await seedDatabase(db, { adminEmail: 'owner@example.com' });
    expect(again).toEqual({ adminCreated: false, advisorsCreated: 0, listingsCreated: 0 });
  });
});

describe('database listings source', () => {
  it('serves the seeded catalogue exactly as the placeholder data, in both languages', async () => {
    for (const locale of ['en', 'ar'] as const) {
      const fromDb = await databaseListingsSource.list(locale);
      expect(fromDb).toHaveLength(PLACEHOLDER_LISTINGS.length);
      for (const record of PLACEHOLDER_LISTINGS) {
        const { advisorId, ...listing } = fromDb.find((l) => l.id === record.id)!;
        expect(listing).toEqual({ ...localizeListing(record, locale), featured: record.featured ?? false, verified: record.verified ?? false });
        expect(advisorId).toBe(advisorForRegion(record.region).id);
      }
    }
  });

  it('hides drafts and listings without photos', async () => {
    const db = await getDb();
    const id = PLACEHOLDER_LISTINGS[0].id;
    await db.update(listings).set({ status: 'draft' }).where(eq(listings.id, id));
    expect(await databaseListingsSource.getById(id, 'en')).toBeNull();
    expect((await databaseListingsSource.list('en')).some((l) => l.id === id)).toBe(false);
    await db.update(listings).set({ status: 'published' }).where(eq(listings.id, id));

    const photos = await db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id));
    await db.delete(listingPhotos).where(eq(listingPhotos.listingId, id));
    expect(await databaseListingsSource.getById(id, 'en')).toBeNull();
    await db.insert(listingPhotos).values(photos);
    expect(await databaseListingsSource.getById(id, 'en')).not.toBeNull();
  });

  it('shows the listing’s own advisor, falling back to the regional one', async () => {
    expect((await getPublicAdvisors()).map((a) => a.id)).toEqual(['nadine', 'karim', 'maya']);
    expect((await getAdvisorForListing({ advisorId: 'karim', region: 'beirut' }))?.id).toBe('karim');
    expect((await getAdvisorForListing({ advisorId: 'gone', region: 'koura' }))?.id).toBe('maya');
  });
});

describe('leads from the website', () => {
  it('saves a viewing request and routes it to the listing’s advisor', async () => {
    const listing = PLACEHOLDER_LISTINGS.find((l) => l.region === 'koura')!;
    await deliverLead({ kind: 'viewing', locale: 'ar', propertyId: listing.id, name: 'Rami', phone: '03 111 222', date: '2026-11-02', time: 'morning', notes: 'After 10 please' });
    const db = await getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.name, 'Rami'));
    expect(lead).toMatchObject({ kind: 'viewing', status: 'new', locale: 'ar', listingId: listing.id, assigneeId: 'maya', message: 'After 10 please' });
    expect(lead.details).toEqual({ date: '2026-11-02', time: 'morning' });
  });

  it('routes a valuation by region, and keeps an unknown property id out of the foreign key', async () => {
    await deliverLead({ kind: 'valuation', locale: 'en', name: 'Lea', phone: '+96170000000', email: 'lea@example.com', intent: 'sell', type: 'house', region: 'metn', sizeSqm: 240, message: '' });
    await deliverLead({ kind: 'enquiry', locale: 'en', propertyId: 'no-such-listing', name: 'Sam', email: 'sam@example.com', phone: '', message: 'Hello' });
    const db = await getDb();
    const [lea] = await db.select().from(leads).where(eq(leads.name, 'Lea'));
    expect(lea.assigneeId).toBe('karim');
    expect(lea.details).toMatchObject({ intent: 'sell', type: 'house', region: 'metn', sizeSqm: 240 });
    const [sam] = await db.select().from(leads).where(eq(leads.name, 'Sam'));
    expect(sam).toMatchObject({ listingId: null, assigneeId: null, phone: null });
  });
});

describe('photo storage', () => {
  it('re-encodes uploads to WebP, strips metadata and caps the size', async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#c9a45c' } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: 'secret' } } })
      .toBuffer();
    const stored = await storeListingPhoto('villa-test', new File([new Uint8Array(big)], 'house.jpg', { type: 'image/jpeg' }));
    expect(isValidKey(stored.key)).toBe(true);
    expect(stored.url).toBe(`/media/${stored.key}`);
    expect([stored.width, stored.height]).toEqual([2400, 1600]);

    const file = await new LocalDiskStorage().get(stored.key);
    const meta = await sharp(file!.data).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
  });

  it('rejects files that are not images, and keys that try to escape the folder', async () => {
    const fake = new File([new TextEncoder().encode('<?php echo 1; ?>')], 'photo.jpg', { type: 'image/jpeg' });
    await expect(storeListingPhoto('villa-test', fake)).rejects.toBeInstanceOf(UploadError);
    expect(isValidKey('listings/../../etc/passwd')).toBe(false);
    expect(isValidKey('listings/x/../../a.webp')).toBe(false);
    expect(await new LocalDiskStorage().get('../secret')).toBeNull();
  });
});
