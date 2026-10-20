import Image from 'next/image';
import Link from 'next/link';

import { cardFacts } from '@/lib/facts';
import { formatPrice, formatPriceSpoken } from '@/lib/format';
import { DEAL_LABELS, TYPE_LABELS, capitalize } from '@/lib/labels';
import type { ListingSummary } from '@/lib/types';

import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: ListingSummary;
  /** Eager-load the image for cards likely to be above the fold. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}

export function ListingCard({ listing, priority = false, headingLevel: Heading = 'h3' }: ListingCardProps) {
  const facts = cardFacts(listing);

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Image
          src={listing.image.src}
          alt=""
          fill
          sizes="(min-width: 1100px) 360px, (min-width: 700px) 45vw, 92vw"
          className={styles.image}
          priority={priority}
        />
        <span className={`badge ${styles.badge}`}>{DEAL_LABELS[listing.deal].badge}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.meta}>
          {capitalize(TYPE_LABELS[listing.type].singular)} · {listing.location.area}, {listing.location.city}
        </p>
        <Heading className={styles.title}>
          {/* The stretched link makes the whole card clickable while keeping one tab stop. */}
          <Link href={`/listings/${listing.id}`} className={styles.link}>
            {listing.title}
          </Link>
        </Heading>
        <p className={styles.price}>
          <span aria-hidden="true">{formatPrice(listing.price, listing.deal)}</span>
          <span className="sr-only">
            {DEAL_LABELS[listing.deal].badge}, {formatPriceSpoken(listing.price, listing.deal)}
          </span>
        </p>
        <ul className={styles.facts} aria-label="Key facts">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
