import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ListingRow } from '@/components/ListingRow';
import { SearchCapsule } from '@/components/SearchCapsule';
import { Spotlight } from '@/components/Spotlight';
import { isLocale, localizedPath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { formatNumber, interpolate } from '@/i18n/plural';
import { COMPANY } from '@/lib/company';
import { getFeaturedListings, getListingById, getListingSummaries } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { PROPERTY_TYPES } from '@/lib/types';

import styles from './page.module.css';

/**
 * Home: a photographic hero with the search capsule (one obvious next step), a spotlight listing,
 * photo rows per property type, the firm in numbers, and a black-and-gold brand band.
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const h = t.home;

  const [featured, listings] = await Promise.all([getFeaturedListings(locale, 8), getListingSummaries(locale)]);
  const spotlight = featured[0] ? await getListingById(featured[0].id, locale) : null;
  const yearsActive = new Date().getFullYear() - COMPANY.founded;

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`container ${styles.heroFrame}`}>
          <div className={styles.heroMedia}>
            <Image
              src="/images/photos/hero-villa-dusk.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1520px) 1440px, 100vw"
              className={styles.heroImage}
            />
            <div className={styles.heroShade} />
            <div className={styles.heroContent}>
              <p className={`kicker ${styles.heroKicker} animate-rise`}>{h.heroEyebrow}</p>
              <h1 id="hero-title" className={`${styles.heroTitle} animate-rise`}>
                {h.heroTitle}
              </h1>
              <p className={`${styles.heroLead} animate-rise`}>{h.heroLead}</p>
            </div>
          </div>
          <div className={`${styles.search} animate-rise`}>
            <SearchCapsule locale={locale} t={t} />
          </div>
        </div>
      </section>

      {spotlight && (
        <div className={`container ${styles.block}`}>
          <Spotlight listing={spotlight} locale={locale} t={t} />
        </div>
      )}

      <div className={`container ${styles.rows}`}>
        <ListingRow
          id="featured"
          title={h.featuredTitle}
          href={localizedPath(locale, '/listings')}
          listings={featured.slice(1)}
          locale={locale}
          t={t}
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

      <section className={`container ${styles.block}`} aria-label={h.trustLabel}>
        <dl className={styles.trust}>
          <div>
            <dt>{t.about.stats.years}</dt>
            <dd>{formatNumber(yearsActive, locale)}+</dd>
          </div>
          <div>
            <dt>{t.about.stats.placed}</dt>
            <dd>{formatNumber(2400, locale)}+</dd>
          </div>
          <div>
            <dt>{t.about.stats.regions}</dt>
            <dd>{formatNumber(6, locale)}</dd>
          </div>
          <div>
            <dt>{h.trustAdvisorText}</dt>
            <dd>{h.trustAdvisor}</dd>
          </div>
        </dl>
      </section>

      <section className={`container ${styles.block}`} aria-labelledby="brand-title">
        <div className={styles.brandBand}>
          <div className={styles.brandText}>
            <p className="kicker">{interpolate(h.brandEyebrow, { year: COMPANY.founded })}</p>
            <h2 id="brand-title" className={styles.brandTitle}>
              {h.brandTitle}
            </h2>
            <p className={styles.brandLead}>{interpolate(h.brandText, { years: yearsActive })}</p>
            <div className={styles.brandActions}>
              <Link href={`${localizedPath(locale, '/about')}#contact`} className="button button-large">
                {h.brandCta}
              </Link>
              <Link href={localizedPath(locale, '/sell')} className={`button button-large ${styles.ghostLight}`}>
                {t.nav.listProperty}
              </Link>
            </div>
          </div>
          <Image
            src="/images/brand/al-khoury-brand.webp"
            alt={h.brandImageAlt}
            width={1000}
            height={1000}
            sizes="(min-width: 950px) 24rem, 70vw"
            className={styles.brandImage}
          />
        </div>
      </section>
    </>
  );
}
