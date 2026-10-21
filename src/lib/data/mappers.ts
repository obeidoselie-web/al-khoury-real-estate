import type { AdvisorProfileRow, ListingPhotoRow, ListingRow, UserRow, listingPhotos, listings } from '@/db/schema';
import type { Locale } from '@/i18n/config';

import type { DealType, Listing, PropertyType, Region } from '../types';
import type { Advisor } from './advisors';
import type { ListingRecord } from './placeholder-listings';
import { photo } from './placeholder-listings';

/*
 * Conversions between database rows and the shapes the public site renders. Pure functions, so
 * the mapping is unit-tested without a database.
 */

const pick = <T>(locale: Locale, en: T, ar: T): T => (locale === 'ar' ? ar : en);

export function rowToListing(row: ListingRow, photos: ListingPhotoRow[], locale: Locale): Listing {
  const ordered = [...photos].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    title: pick(locale, row.titleEn, row.titleAr),
    type: row.type as PropertyType,
    deal: row.deal as DealType,
    region: row.region as Region,
    price: row.price,
    location: { area: pick(locale, row.areaEn, row.areaAr), city: pick(locale, row.cityEn, row.cityAr) },
    ...(row.bedrooms !== null && { bedrooms: row.bedrooms }),
    ...(row.bathrooms !== null && { bathrooms: row.bathrooms }),
    areaSqm: row.areaSqm,
    ...(row.plotSqm !== null && { plotSqm: row.plotSqm }),
    ...(row.yearBuilt !== null && { yearBuilt: row.yearBuilt }),
    summary: pick(locale, row.summaryEn, row.summaryAr),
    description: pick(locale, row.descriptionEn, row.descriptionAr),
    features: pick(locale, row.featuresEn, row.featuresAr),
    images: ordered.map((p) => ({
      src: p.src,
      // Arabic alt text falls back to English rather than leaving an image unnamed.
      alt: pick(locale, p.altEn, p.altAr || p.altEn),
      width: p.width,
      height: p.height,
    })),
    featured: row.featured,
    verified: row.verified,
    listedAt: row.listedAt,
    advisorId: row.advisorId ?? undefined,
  };
}

/** Placeholder record → listing row and photo rows (used by the seed). */
export function recordToRows(
  record: ListingRecord,
  advisorId: string | null,
): { listing: typeof listings.$inferInsert; photos: (typeof listingPhotos.$inferInsert)[] } {
  return {
    listing: {
      id: record.id,
      status: 'published',
      type: record.type,
      deal: record.deal,
      region: record.region,
      price: record.price,
      bedrooms: record.bedrooms ?? null,
      bathrooms: record.bathrooms ?? null,
      areaSqm: record.areaSqm,
      plotSqm: record.plotSqm ?? null,
      yearBuilt: record.yearBuilt ?? null,
      featured: record.featured ?? false,
      verified: record.verified ?? false,
      listedAt: record.listedAt,
      advisorId,
      titleEn: record.title.en,
      titleAr: record.title.ar,
      areaEn: record.location.area.en,
      areaAr: record.location.area.ar,
      cityEn: record.location.city.en,
      cityAr: record.location.city.ar,
      summaryEn: record.summary.en,
      summaryAr: record.summary.ar,
      descriptionEn: record.description.en,
      descriptionAr: record.description.ar,
      featuresEn: record.features.en,
      featuresAr: record.features.ar,
    },
    photos: record.photos.map((name, position) => {
      const en = photo(name, 'en');
      return {
        id: `${record.id}--${position}`,
        listingId: record.id,
        src: en.src,
        storageKey: null,
        altEn: en.alt,
        altAr: photo(name, 'ar').alt,
        width: en.width,
        height: en.height,
        position,
      };
    }),
  };
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function profileToAdvisor(user: Pick<UserRow, 'id' | 'name'>, profile: AdvisorProfileRow): Advisor {
  return {
    id: user.id,
    name: { en: user.name, ar: profile.nameAr },
    role: { en: profile.titleEn, ar: profile.titleAr },
    languages: { en: profile.languagesEn, ar: profile.languagesAr },
    phone: { display: profile.phoneDisplay, href: `tel:+${profile.phoneDigits}` },
    whatsapp: profile.phoneDigits,
    regions: profile.regions as Region[],
  };
}
