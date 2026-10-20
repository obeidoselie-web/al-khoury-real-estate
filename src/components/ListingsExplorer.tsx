'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  DEFAULT_FILTERS,
  countOptions,
  describeResults,
  filterListings,
  filtersToQueryString,
  isDefaultFilters,
  type DealFilter,
  type ListingFilters,
  type TypeFilter,
} from '@/lib/filters';
import { DEAL_LABELS, TYPE_LABELS } from '@/lib/labels';
import { DEAL_TYPES, PROPERTY_TYPES, type ListingSummary } from '@/lib/types';

import { FilterGroup, type FilterOption } from './FilterGroup';
import { ListingGrid } from './ListingGrid';
import styles from './ListingsExplorer.module.css';

interface ListingsExplorerProps {
  listings: ListingSummary[];
  initialFilters: ListingFilters;
}

/**
 * Filters run in memory for instant feedback on a phone (no network round trip per tap).
 * The URL is kept in sync so filtered views can be shared, bookmarked and reloaded,
 * and the server renders the same filtered result on first load.
 */
export function ListingsExplorer({ listings, initialFilters }: ListingsExplorerProps) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);

  const results = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const counts = useMemo(() => countOptions(listings, filters), [listings, filters]);
  const summary = describeResults(results.length, filters);

  function update(next: ListingFilters) {
    setFilters(next);
    const query = filtersToQueryString(next);
    window.history.replaceState(window.history.state, '', query ? `?${query}` : window.location.pathname);
  }

  const dealOptions: FilterOption<DealFilter>[] = [
    { value: 'all', label: 'All', count: counts.byDeal.all },
    ...DEAL_TYPES.map((deal) => ({ value: deal, label: DEAL_LABELS[deal].filter, count: counts.byDeal[deal] })),
  ];

  const typeOptions: FilterOption<TypeFilter>[] = [
    { value: 'all', label: 'All types', count: counts.byType.all },
    ...PROPERTY_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type].short, count: counts.byType[type] })),
  ];

  return (
    <div className={styles.explorer}>
      <search className={styles.filters} aria-label="Filter properties">
        <FilterGroup
          name="deal"
          legend="Buy or rent"
          options={dealOptions}
          value={filters.deal}
          onChange={(deal) => update({ ...filters, deal })}
        />
        <FilterGroup
          name="type"
          legend="Property type"
          options={typeOptions}
          value={filters.type}
          onChange={(type) => update({ ...filters, type })}
        />
      </search>

      <div className={styles.resultsBar}>
        {/* Announced politely to screen readers whenever the filter result changes. */}
        <p className={styles.count} role="status" aria-live="polite" aria-atomic="true">
          {summary}
        </p>
        {!isDefaultFilters(filters) && results.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => update(DEFAULT_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ListingGrid listings={results} priorityCount={3} label="Matching properties" headingLevel="h2" />
      ) : (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Nothing matches these filters yet</h2>
          <p className={styles.emptyText}>
            New properties are listed every week. Try a different combination, or ask an advisor to look for you.
          </p>
          <div className={styles.emptyActions}>
            <button type="button" className="button" onClick={() => update(DEFAULT_FILTERS)}>
              Show all properties
            </button>
            <Link className="text-link" href="/about#contact">
              Ask an advisor
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
