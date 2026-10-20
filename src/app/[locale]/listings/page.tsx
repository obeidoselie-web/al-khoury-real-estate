import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingsExplorer } from '@/components/ListingsExplorer';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getListingSummaries } from '@/lib/data/listings';
import { filtersToQueryString, parseFilters } from '@/lib/filters';
import { alternates } from '@/lib/seo';

import styles from './listings.module.css';

export async function generateMetadata({ params }: PageProps<'/[locale]/listings'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.listingsTitle,
    description: t.meta.listingsDescription,
    alternates: alternates(locale, '/listings'),
  };
}

export default async function ListingsPage({ params, searchParams }: PageProps<'/[locale]/listings'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const [query, listings] = await Promise.all([searchParams, getListingSummaries(locale)]);
  const initialFilters = parseFilters(query);

  return (
    <div className="container">
      <header className={styles.header}>
        <h1 className={styles.title}>{t.listings.title}</h1>
        <p className={styles.lead}>{t.listings.lead}</p>
      </header>
      {/* Keyed so a navigation to a different filtered URL (e.g. from the home page) resets state. */}
      <ListingsExplorer key={filtersToQueryString(initialFilters)} listings={listings} initialFilters={initialFilters} />
    </div>
  );
}
