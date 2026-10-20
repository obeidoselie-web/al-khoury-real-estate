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
  sortListings,
  type DealFilter,
  type ListingFilters,
  type RegionFilter,
  type SortOrder,
  type TypeFilter,
} from '@/lib/filters';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS, type ListingSummary } from '@/lib/types';

import { CategoryTabs } from './CategoryTabs';
import { FiltersDialog } from './FiltersDialog';
import { ChoiceGroup, type ChoiceOption } from './ChoiceGroup';
import { ChevronDownIcon, PinIcon, SortIcon } from './icons';
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

  const results = useMemo(() => sortListings(filterListings(listings, filters), filters.sort), [listings, filters]);
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
          <FiltersDialog listings={listings} filters={filters} onApply={update} />
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
            // Budget presets differ between buying and renting, so a budget never carries across.
            onChange={(deal) => update({ ...filters, deal, maxPrice: undefined })}
          />
        </div>
      </search>

      <div className={styles.resultsBar}>
        {/* Announced politely to screen readers whenever the filter result changes. */}
        <p className={styles.count} role="status" aria-live="polite" aria-atomic="true">
          {summary}
        </p>
        <div className={styles.resultsTools}>
          {!isDefaultFilters(filters) && results.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => update({ ...DEFAULT_FILTERS, sort: filters.sort })}>
              {t.listings.clear}
            </button>
          )}
          <label className={styles.sort}>
            <SortIcon size={16} />
            <span className="sr-only">{t.listings.sortLabel}</span>
            <select
              value={filters.sort ?? 'newest'}
              onChange={(event) => update({ ...filters, sort: event.target.value as SortOrder })}
              className={styles.sortSelect}
            >
              <option value="newest">{t.listings.sortNewest}</option>
              <option value="price-asc">{t.listings.sortPriceAsc}</option>
              <option value="price-desc">{t.listings.sortPriceDesc}</option>
              <option value="size-desc">{t.listings.sortSize}</option>
            </select>
            <ChevronDownIcon size={14} />
          </label>
        </div>
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
