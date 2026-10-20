import { notFound } from 'next/navigation';

import { ListingRow } from '@/components/ListingRow';
import { SearchCapsule } from '@/components/SearchCapsule';
import { isLocale, localizedPath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getFeaturedListings, getListingSummaries } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { PROPERTY_TYPES } from '@/lib/types';

import styles from './page.module.css';

/**
 * Home: the search capsule is the hero (one obvious next step), followed by photo-led rows —
 * featured properties, then one row per property type, each linking to its filtered list.
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const [featured, listings] = await Promise.all([getFeaturedListings(locale, 8), getListingSummaries(locale)]);

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`container ${styles.heroInner}`}>
          <h1 id="hero-title" className={`${styles.heroTitle} animate-rise`}>
            {t.home.heroTitle}
          </h1>
          <p className={`${styles.heroLead} animate-rise`}>{t.home.heroLead}</p>
          <div className={`${styles.search} animate-rise`}>
            <SearchCapsule locale={locale} t={t} />
          </div>
        </div>
      </section>

      <div className={`container ${styles.rows}`}>
        <ListingRow
          id="featured"
          title={t.home.featuredTitle}
          href={localizedPath(locale, '/listings')}
          listings={featured}
          locale={locale}
          t={t}
          priority
        />
        {PROPERTY_TYPES.map((type) => (
          <ListingRow
            key={type}
            id={`row-${type}`}
            title={t.types[type].short}
            subtitle={t.types[type].blurb}
            href={listingsHref(locale, { type })}
            listings={listings.filter((listing) => listing.type === type)}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </>
  );
}
