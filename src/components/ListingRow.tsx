import Link from 'next/link';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { ListingSummary } from '@/lib/types';

import { ArrowEndIcon } from './icons';
import { ListingCard } from './ListingCard';
import styles from './ListingRow.module.css';
import { RowScroller } from './RowScroller';

interface ListingRowProps {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  listings: ListingSummary[];
  locale: Locale;
  t: Dictionary;
  priority?: boolean;
}

/** A titled horizontal row of listing cards; the title links to the full filtered list. */
export function ListingRow({ id, title, subtitle, href, listings, locale, t, priority = false }: ListingRowProps) {
  if (listings.length === 0) return null;
  const headingId = `${id}-title`;

  return (
    <section className={styles.row} aria-labelledby={headingId}>
      <RowScroller
        regionLabel={title}
        previousLabel={`${t.home.rowPrevious}: ${title}`}
        nextLabel={`${t.home.rowNext}: ${title}`}
        heading={
          <div className={styles.titleBlock}>
            <h2 id={headingId} className={styles.title}>
              <Link href={href} className={styles.titleLink}>
                {title}
                <ArrowEndIcon size={18} className="icon-directional" />
                <span className="sr-only">
                  {' '}
                  — {t.home.rowShowAll}
                </span>
              </Link>
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        }
      >
        <ul className={styles.list}>
          {listings.map((listing, index) => (
            <li key={listing.id} className={styles.item}>
              <ListingCard listing={listing} locale={locale} t={t} priority={priority && index < 3} headingLevel="h3" />
            </li>
          ))}
        </ul>
      </RowScroller>
    </section>
  );
}
