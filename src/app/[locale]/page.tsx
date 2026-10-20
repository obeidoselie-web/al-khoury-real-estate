import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ListingGrid } from '@/components/ListingGrid';
import { isLocale, localizedPath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { plural } from '@/i18n/plural';
import { getFeaturedListings, getListings } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { PROPERTY_TYPES } from '@/lib/types';

import styles from './page.module.css';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const [featured, listings] = await Promise.all([getFeaturedListings(locale, 3), getListings(locale)]);
  const countByType = Object.fromEntries(
    PROPERTY_TYPES.map((type) => [type, listings.filter((listing) => listing.type === type).length]),
  );

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow animate-rise">{t.company.name}</p>
          <h1 id="hero-title" className={`${styles.heroTitle} animate-rise`}>
            {t.home.heroTitle}
          </h1>
          <p className={`${styles.heroLead} animate-rise`}>{t.home.heroLead}</p>
          <div className={`${styles.heroActions} animate-rise`}>
            <Link href={localizedPath(locale, '/listings')} className="button button-large">
              {plural(locale, listings.length, t.home.browseCta)}
            </Link>
          </div>
        </div>
        <div className={`container ${styles.heroMedia} animate-rise`}>
          <Image
            src="/images/hero.jpg"
            alt=""
            width={2400}
            height={1200}
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className={styles.heroImage}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="types-title">
        <div className="container">
          <h2 id="types-title" className="section-heading">
            {t.home.typesTitle}
          </h2>
          <ul className={styles.types}>
            {PROPERTY_TYPES.map((type) => (
              <li key={type}>
                <Link href={listingsHref(locale, { type })} className={styles.typeCard} data-motion-lift>
                  <span className={styles.typeName}>{t.types[type].short}</span>
                  <span className={styles.typeBlurb}>{t.types[type].blurb}</span>
                  <span className={styles.typeCount}>{plural(locale, countByType[type], t.home.listingCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured.length > 0 && (
        <section className={`section ${styles.featured}`} aria-labelledby="featured-title">
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 id="featured-title" className="section-heading">
                {t.home.featuredTitle}
              </h2>
              <Link href={localizedPath(locale, '/listings')} className="text-link">
                {t.home.seeAll}
              </Link>
            </div>
            <ListingGrid listings={featured} locale={locale} t={t} headingLevel="h3" label={t.home.featuredTitle} />
          </div>
        </section>
      )}
    </>
  );
}
