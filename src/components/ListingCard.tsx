import Image from 'next/image';
import Link from 'next/link';

import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { cardFacts } from '@/lib/facts';
import { formatPlace, listingPrice, listingPriceSpoken } from '@/lib/format';
import { DEFAULT_SITE, type ListingDisplaySettings, type ListingView } from '@/lib/site';
import type { ListingSummary } from '@/lib/types';

import { FavouriteButton } from './FavouriteButton';
import styles from './ListingCard.module.css';

export type CardStrings = Pick<Dictionary, 'card' | 'format' | 'types' | 'deals' | 'saved'>;

/** The card-related part of the listing display settings. */
export type CardOptions = Pick<
  ListingDisplaySettings,
  'photoShape' | 'showBadge' | 'showFavourite' | 'showType' | 'showLocation' | 'showFacts'
>;

export const DEFAULT_CARD_OPTIONS: CardOptions = DEFAULT_SITE.listings;

interface ListingCardProps {
  listing: ListingSummary;
  locale: Locale;
  t: CardStrings;
  /** Eager-load the image for cards likely to be above the fold. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
  /** "list": photo beside the text, for the Properties page list view. */
  view?: ListingView;
  options?: CardOptions;
}

const SHAPE_CLASS = { square: styles.square, landscape: styles.landscape, portrait: styles.portrait };

export function ListingCard({
  listing,
  locale,
  t,
  priority = false,
  headingLevel: Heading = 'h3',
  view = 'grid',
  options = DEFAULT_CARD_OPTIONS,
}: ListingCardProps) {
  const facts = cardFacts(listing, locale, t);
  const deal = t.deals[listing.deal];
  const meta = [options.showType && t.types[listing.type].label, options.showLocation && formatPlace(listing.location, locale)].filter(Boolean);

  return (
    <article className={`${styles.card} ${view === 'list' ? styles.listView : ''}`}>
      <div className={`${styles.media} ${SHAPE_CLASS[options.photoShape]}`}>
        <Image
          src={listing.image.src}
          alt=""
          fill
          sizes={
            view === 'list'
              ? '(min-width: 744px) 22rem, 92vw'
              : '(min-width: 1440px) 18vw, (min-width: 1128px) 23vw, (min-width: 744px) 31vw, 72vw'
          }
          className={styles.image}
          priority={priority}
        />
        {options.showBadge && <span className={`badge ${styles.badge}`}>{deal.badge}</span>}
        {/* A small client island; the rest of the card stays server-rendered HTML. */}
        {options.showFavourite && <FavouriteButton id={listing.id} title={listing.title} t={t} />}
      </div>
      <div className={styles.body}>
        <Heading className={styles.title}>
          {/* The stretched link makes the whole card clickable while keeping one tab stop. */}
          <Link href={localizedPath(locale, `/listings/${listing.id}`)} className={styles.link}>
            {listing.title}
          </Link>
        </Heading>
        {meta.length > 0 && <p className={styles.meta}>{meta.join(' · ')}</p>}
        {options.showFacts && facts.length > 0 && (
          <ul className={styles.facts} aria-label={t.card.keyFacts}>
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}
        <p className={styles.price}>
          <span aria-hidden="true">{listingPrice(listing, locale, t)}</span>
          <span className="sr-only">
            {deal.badge}, {listingPriceSpoken(listing, locale, t)}
          </span>
        </p>
      </div>
    </article>
  );
}
