import type { MetadataRoute } from 'next';

import { LOCALES, localizedPath } from '@/i18n/config';
import { siteUrl } from '@/lib/company';
import { getListings } from '@/lib/data/listings';

/**
 * /sitemap.xml: every public page in both languages, with hreflang alternates, plus every published
 * listing. Rebuilt together with the pages whenever a listing changes in the admin.
 * (The saved-properties page is personal to each device and left out.)
 */
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/listings', priority: 0.9, changeFrequency: 'daily' },
  { path: '/sell', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const languages = (path: string) => ({
    languages: Object.fromEntries(LOCALES.map((l) => [l, `${origin}${localizedPath(l, path)}`])),
  });

  const pages = STATIC_PAGES.flatMap(({ path, priority, changeFrequency }) =>
    LOCALES.map((locale) => ({
      url: `${origin}${localizedPath(locale, path)}`,
      changeFrequency,
      priority,
      alternates: languages(path),
    })),
  );

  // A database outage should not take the whole sitemap down; static pages are still listed.
  const listings = await getListings('en').catch(() => []);
  const listingPages = listings.flatMap((listing) =>
    LOCALES.map((locale) => ({
      url: `${origin}${localizedPath(locale, `/listings/${listing.id}`)}`,
      lastModified: new Date(`${listing.listedAt}T00:00:00Z`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: languages(`/listings/${listing.id}`),
    })),
  );

  return [...pages, ...listingPages];
}
