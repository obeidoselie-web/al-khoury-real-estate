import { and, count, eq, isNull } from 'drizzle-orm';

import { hashPassword } from '@/lib/auth/password';
import { ADVISORS, advisorForRegion } from '@/lib/data/advisors';
import { placeholderPin, recordToRows } from '@/lib/data/mappers';
import { PLACEHOLDER_LISTINGS } from '@/lib/data/placeholder-listings';

import type { Db } from './index';
import { advisorProfiles, listingPhotos, listings, users } from './schema';

/*
 * Loads the placeholder catalogue and advisors into an empty database and creates the first admin.
 * Safe to re-run: existing listings, advisors and the admin are left alone.
 * The placeholder advisors get accounts without a password, so they cannot sign in until an admin
 * sets one (or deletes them) in Team.
 */

export interface SeedOptions {
  adminEmail: string;
  adminName?: string;
  /** Required when the admin account does not exist yet. */
  adminPassword?: string;
}

export interface SeedReport {
  adminCreated: boolean;
  advisorsCreated: number;
  listingsCreated: number;
  /** Placeholder listings that had no map pin and were given their neighbourhood. */
  pinsAdded: number;
}

export async function seedDatabase(db: Db, options: SeedOptions): Promise<SeedReport> {
  const report: SeedReport = { adminCreated: false, advisorsCreated: 0, listingsCreated: 0, pinsAdded: 0 };
  const email = options.adminEmail.trim().toLowerCase();

  const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!existingAdmin) {
    if (!options.adminPassword) throw new Error('adminPassword is required to create the first admin');
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name: options.adminName ?? 'Administrator',
      role: 'admin',
      passwordHash: await hashPassword(options.adminPassword),
    });
    report.adminCreated = true;
  }

  // Advisor ids from the placeholder file become user ids, so listing assignments stay readable.
  for (const [index, advisor] of ADVISORS.entries()) {
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.id, advisor.id));
    if (exists) continue;
    await db.insert(users).values({
      id: advisor.id,
      email: `${advisor.id}@alkhoury.example`,
      name: advisor.name.en,
      role: 'advisor',
      passwordHash: null,
    });
    await db.insert(advisorProfiles).values({
      userId: advisor.id,
      nameAr: advisor.name.ar,
      titleEn: advisor.role.en,
      titleAr: advisor.role.ar,
      languagesEn: advisor.languages.en,
      languagesAr: advisor.languages.ar,
      phoneDisplay: advisor.phone.display,
      phoneDigits: advisor.whatsapp,
      regions: advisor.regions,
      sortOrder: index,
    });
    report.advisorsCreated++;
  }

  const [{ n }] = await db.select({ n: count() }).from(listings);
  if (n === 0) {
    for (const record of PLACEHOLDER_LISTINGS) {
      const rows = recordToRows(record, advisorForRegion(record.region).id);
      await db.insert(listings).values(rows.listing);
      await db.insert(listingPhotos).values(rows.photos);
      report.listingsCreated++;
    }
  }

  // Databases seeded before maps existed: give placeholder listings without a pin their neighbourhood.
  for (const record of PLACEHOLDER_LISTINGS) {
    const pin = placeholderPin(record);
    if (pin.lat === null) continue;
    const updated = await db
      .update(listings)
      .set(pin)
      .where(and(eq(listings.id, record.id), isNull(listings.lat), eq(listings.mapMode, 'off')))
      .returning({ id: listings.id });
    report.pinsAdded += updated.length;
  }

  return report;
}
