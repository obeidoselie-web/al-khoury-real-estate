import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SavedListings } from '@/components/SavedListings';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getListingSummaries } from '@/lib/data/listings';
import { alternates } from '@/lib/seo';

import styles from '../listings/listings.module.css';

export async function generateMetadata({ params }: PageProps<'/[locale]/saved'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.savedTitle,
    description: t.meta.savedDescription,
    alternates: alternates(locale, '/saved'),
    // Personal to each device: nothing for search engines to index.
    robots: { index: false, follow: true },
  };
}

export default async function SavedPage({ params }: PageProps<'/[locale]/saved'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const listings = await getListingSummaries(locale);

  return (
    <div className="container">
      <header className={styles.header}>
        <h1 className={styles.title}>{t.saved.title}</h1>
        <p className={styles.lead}>{t.saved.lead}</p>
      </header>
      <SavedListings listings={listings} />
    </div>
  );
}
