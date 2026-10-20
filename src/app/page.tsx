import Image from 'next/image';
import Link from 'next/link';

import { ListingGrid } from '@/components/ListingGrid';
import { COMPANY } from '@/lib/company';
import { getFeaturedListings, getListings } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { TYPE_LABELS } from '@/lib/labels';
import { PROPERTY_TYPES } from '@/lib/types';

import styles from './page.module.css';

const TYPE_BLURBS = {
  house: 'Villas, townhouses and family homes.',
  apartment: 'From city studios to sea-view penthouses.',
  commercial: 'Offices, retail units and warehouses.',
  land: 'Building plots, groves and farmland.',
} as const;

export default async function HomePage() {
  const [featured, listings] = await Promise.all([getFeaturedListings(3), getListings()]);
  const countByType = Object.fromEntries(
    PROPERTY_TYPES.map((type) => [type, listings.filter((listing) => listing.type === type).length]),
  );

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow animate-rise">{COMPANY.name}</p>
          <h1 id="hero-title" className={`${styles.heroTitle} animate-rise`}>
            Find the place that fits.
          </h1>
          <p className={`${styles.heroLead} animate-rise`}>
            Houses, apartments, commercial spaces and land across Lebanon — to buy or to rent.
          </p>
          <div className={`${styles.heroActions} animate-rise`}>
            <Link href="/listings" className="button button-large">
              Browse {listings.length} properties
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
            Start with what you need.
          </h2>
          <ul className={styles.types}>
            {PROPERTY_TYPES.map((type) => (
              <li key={type}>
                <Link href={listingsHref({ type })} className={styles.typeCard}>
                  <span className={styles.typeName}>{TYPE_LABELS[type].short}</span>
                  <span className={styles.typeBlurb}>{TYPE_BLURBS[type]}</span>
                  <span className={styles.typeCount}>
                    {countByType[type]} {countByType[type] === 1 ? 'listing' : 'listings'}
                  </span>
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
                Featured properties.
              </h2>
              <Link href="/listings" className="text-link">
                See all properties
              </Link>
            </div>
            <ListingGrid listings={featured} headingLevel="h3" label="Featured properties" />
          </div>
        </section>
      )}
    </>
  );
}
