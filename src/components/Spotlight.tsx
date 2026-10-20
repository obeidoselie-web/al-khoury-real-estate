import Image from 'next/image';
import Link from 'next/link';

import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { formatPlace, formatPrice } from '@/lib/format';
import type { Listing } from '@/lib/types';

import { Highlights } from './Highlights';
import { PinIcon } from './icons';
import styles from './Spotlight.module.css';

/** One featured property, editorial-size: a large photo with the essentials beside it. */
export function Spotlight({ listing, locale, t }: { listing: Listing; locale: Locale; t: Dictionary }) {
  const href = localizedPath(locale, `/listings/${listing.id}`);
  const [cover, ...rest] = listing.images;

  return (
    <article className={styles.spotlight} aria-labelledby="spotlight-title">
      <div className={styles.media}>
        <div className={styles.coverFrame}>
          <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 950px) 60vw, 100vw" className={styles.cover} />
        </div>
        {rest.slice(0, 2).map((image) => (
          <div key={image.src} className={styles.thumb}>
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 950px) 14vw, 30vw" className={styles.cover} />
          </div>
        ))}
      </div>
      <div className={styles.body}>
        <p className="kicker">{t.home.spotlightEyebrow}</p>
        <h2 id="spotlight-title" className={styles.title}>
          {listing.title}
        </h2>
        <p className={styles.place}>
          <PinIcon size={18} />
          {formatPlace(listing.location, locale)}
        </p>
        <p className={styles.summary}>{listing.summary}</p>
        <Highlights listing={listing} locale={locale} t={t} label={t.property.highlights} />
        <div className={styles.footer}>
          <p className={styles.price}>
            <span className={styles.deal}>{t.deals[listing.deal].badge}</span>
            {formatPrice(listing.price, listing.deal, locale, t)}
          </p>
          <Link href={href} className="button">
            {t.home.viewProperty}
          </Link>
        </div>
      </div>
    </article>
  );
}
