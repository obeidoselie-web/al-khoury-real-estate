import type { ListingSummary } from '@/lib/types';

import { ListingCard } from './ListingCard';
import styles from './ListingGrid.module.css';

interface ListingGridProps {
  listings: ListingSummary[];
  /** Number of leading cards whose images load eagerly (above the fold). */
  priorityCount?: number;
  label?: string;
  headingLevel?: 'h2' | 'h3';
}

export function ListingGrid({ listings, priorityCount = 0, label, headingLevel }: ListingGridProps) {
  return (
    <ul className={styles.grid} aria-label={label}>
      {listings.map((listing, index) => (
        <li key={listing.id} className={`${styles.item} animate-rise`} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
          <ListingCard listing={listing} priority={index < priorityCount} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
