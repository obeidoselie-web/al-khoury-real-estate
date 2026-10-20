import Image from 'next/image';
import Link from 'next/link';

import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { cardFacts } from '@/lib/facts';
import { formatPlace, formatPrice, formatPriceSpoken } from '@/lib/format';
import type { ListingSummary } from '@/lib/types';

import styles from './ListingCard.module.css';

export type CardStrings = Pick<Dictionary, 'card' | 'format' | 'types' | 'deals'>;

interface ListingCardProps {
  listing: ListingSummary;
  locale: Locale;
  t: CardStrings;
  /** Eager-load the image for cards likely to be above the fold. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}

export function ListingCard({ listing, locale, t, priority = false, headingLevel: Heading = 'h3' }: ListingCardProps) {
  const facts = cardFacts(listing, locale, t);
  const deal = t.deals[listing.deal];

  return (
    <article className={styles.card} data-motion-lift>
      <div className={styles.media}>
        <Image
          src={listing.image.src}
          alt=""
          fill
          sizes="(min-width: 1100px) 360px, (min-width: 700px) 45vw, 92vw"
          className={styles.image}
          priority={priority}
        />
        <span className={`badge ${styles.badge}`}>{deal.badge}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.meta}>
          {t.types[listing.type].label} · {formatPlace(listing.location, locale)}
        </p>
        <Heading className={styles.title}>
          {/* The stretched link makes the whole card clickable while keeping one tab stop. */}
          <Link href={localizedPath(locale, `/listings/${listing.id}`)} className={styles.link}>
            {listing.title}
          </Link>
        </Heading>
        <p className={styles.price}>
          <span aria-hidden="true">{formatPrice(listing.price, listing.deal, locale, t)}</span>
          <span className="sr-only">
            {deal.badge}, {formatPriceSpoken(listing.price, listing.deal, locale, t)}
          </span>
        </p>
        <ul className={styles.facts} aria-label={t.card.keyFacts}>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
