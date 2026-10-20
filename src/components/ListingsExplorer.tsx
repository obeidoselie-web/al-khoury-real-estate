'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { localizedPath } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import { plural } from '@/i18n/plural';
import {
  DEFAULT_FILTERS,
  countOptions,
  describeResults,
  filterListings,
  filtersToQueryString,
  isDefaultFilters,
  type DealFilter,
  type ListingFilters,
  type RegionFilter,
  type TypeFilter,
} from '@/lib/filters';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS, type ListingSummary } from '@/lib/types';

import { CategoryTabs } from './CategoryTabs';
import { ChoiceGroup, type ChoiceOption } from './ChoiceGroup';
import { ChevronDownIcon, PinIcon } from './icons';
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
  const { locale, t } = useI18n();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);

  const results = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const counts = useMemo(() => countOptions(listings, filters), [listings, filters]);
  const summary = describeResults(results.length, filters, locale, t);

  function update(next: ListingFilters) {
    setFilters(next);
    const query = filtersToQueryString(next);
    window.history.replaceState(window.history.state, '', query ? `?${query}` : window.location.pathname);
  }

  const option = <T extends string>(value: T, label: string, count: number): ChoiceOption<T> => ({
    value,
    label,
    count,
    countLabel: plural(locale, count, t.listings.optionCount),
  });

  const dealOptions: ChoiceOption<DealFilter>[] = [
    option('all', t.listings.all, counts.byDeal.all),
    ...DEAL_TYPES.map((deal) => option(deal, t.deals[deal].filter, counts.byDeal[deal])),
  ];

  const typeOptions: ChoiceOption<TypeFilter>[] = [
    option('all', t.listings.allTypes, counts.byType.all),
    ...PROPERTY_TYPES.map((type) => option(type, t.types[type].short, counts.byType[type])),
  ];

  return (
    <div className={styles.explorer}>
      <search className={styles.filters} aria-label={t.listings.filtersLabel}>
        <CategoryTabs
          name="type"
          legend={t.listings.typeLegend}
          options={typeOptions}
          value={filters.type}
          onChange={(type) => update({ ...filters, type })}
        />
        <div className={styles.refine}>
          <label className={styles.regionPicker}>
            <PinIcon size={18} />
            <span className="sr-only">{t.listings.regionLabel}</span>
            <select
              value={filters.region ?? 'all'}
              onChange={(event) => update({ ...filters, region: event.target.value as RegionFilter })}
              className={styles.regionSelect}
            >
              <option value="all">{t.listings.anywhere}</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {t.regions[region]}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={16} />
          </label>
          <ChoiceGroup
            name="deal"
            legend={t.listings.dealLegend}
            legendHidden
            showCounts={false}
            options={dealOptions}
            value={filters.deal}
            onChange={(deal) => update({ ...filters, deal })}
          />
        </div>
      </search>

      <div className={styles.resultsBar}>
        {/* Announced politely to screen readers whenever the filter result changes. */}
        <p className={styles.count} role="status" aria-live="polite" aria-atomic="true">
          {summary}
        </p>
        {!isDefaultFilters(filters) && results.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => update(DEFAULT_FILTERS)}>
            {t.listings.clear}
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ListingGrid
          listings={results}
          locale={locale}
          t={t}
          priorityCount={3}
          label={t.listings.matching}
          headingLevel="h2"
        />
      ) : (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{t.listings.emptyTitle}</h2>
          <p className={styles.emptyText}>{t.listings.emptyText}</p>
          <div className={styles.emptyActions}>
            <button type="button" className="button button-inverse" onClick={() => update(DEFAULT_FILTERS)}>
              {t.listings.showAll}
            </button>
            <Link className="text-link" href={`${localizedPath(locale, '/about')}#contact`}>
              {t.listings.askAdvisor}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
