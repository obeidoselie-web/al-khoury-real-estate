'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import type { ListingView } from '@/lib/site';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS, type ListingSummary } from '@/lib/types';

import { CategoryTabs } from './CategoryTabs';
import { Dropdown } from './Dropdown';
import { FiltersDialog } from './FiltersDialog';
import { ChoiceGroup, type ChoiceOption } from './ChoiceGroup';
import { AllIcon, ListIcon, PinIcon, SortIcon } from './icons';
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
  const { locale, t, contact } = useI18n();
  const display = contact.listings;
  const [view, setView] = useListingView(display.defaultView, display.allowViewSwitch);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const stuck = useStuck();

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
      <search ref={stuck.ref} className={styles.filters} data-stuck={stuck.value || undefined} aria-label={t.listings.filtersLabel}>
        <CategoryTabs
          name="type"
          legend={t.listings.typeLegend}
          options={typeOptions}
          value={filters.type}
          onChange={(type) => update({ ...filters, type })}
        />
        <div className={styles.refine}>
          <FiltersDialog listings={listings} filters={filters} onApply={update} />
          <Dropdown<RegionFilter>
            label={t.listings.regionLabel}
            icon={<PinIcon size={18} />}
            value={filters.region ?? 'all'}
            onChange={(region) => update({ ...filters, region })}
            triggerClassName={styles.regionPicker}
            countLabel={(count) => plural(locale, count, t.listings.optionCount)}
            options={[
              { value: 'all', label: t.listings.anywhere, count: counts.byRegion.all },
              ...REGIONS.map((region) => ({ value: region, label: t.regions[region], count: counts.byRegion[region] })),
            ]}
          />
          <ChoiceGroup
            name="deal"
            legend={t.listings.dealLegend}
            legendHidden
            showCounts={false}
            options={dealOptions}
            value={filters.deal}
            // Budget presets differ between buying and renting, so a budget never carries across.
            onChange={(deal) => update({ ...filters, deal, minPrice: undefined, maxPrice: undefined })}
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
          {display.allowViewSwitch && (
            <div className={styles.views} role="group" aria-label={t.listings.viewLabel}>
              {(
                [
                  ['grid', t.listings.viewGrid, AllIcon],
                  ['list', t.listings.viewList, ListIcon],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  className={styles.viewButton}
                  aria-pressed={view === value}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(value)}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          )}
          <Dropdown<SortOrder>
            label={t.listings.sortLabel}
            icon={<SortIcon size={16} />}
            value={filters.sort ?? 'newest'}
            onChange={(sort) => update({ ...filters, sort })}
            triggerClassName={styles.sort}
            align="end"
            options={[
              { value: 'newest', label: t.listings.sortNewest },
              { value: 'price-asc', label: t.listings.sortPriceAsc },
              { value: 'price-desc', label: t.listings.sortPriceDesc },
              { value: 'size-desc', label: t.listings.sortSize },
            ]}
          />
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
          view={view}
          display={display}
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

/**
 * True once the filter bar is pinned under the header, so it can switch to its compact form and
 * leave more of the screen for results. Checked on scroll (cheap: one rect read per frame).
 */
function useStuck() {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const pinnedAt = parseFloat(getComputedStyle(el).top) || 0;
      // Only pinned once the page has actually scrolled; at the top the bar sits in its normal place.
      setValue(window.scrollY > 0 && el.getBoundingClientRect().top <= pinnedAt + 0.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return { ref, value };
}

const VIEW_KEY = 'ak-listing-view';

/**
 * Grid or list. Starts with the site default (so server and first client render match), then
 * restores the visitor's own choice on this device, if switching is allowed.
 */
function useListingView(fallback: ListingView, allowSwitch: boolean): [ListingView, (view: ListingView) => void] {
  const [view, setViewState] = useState<ListingView>(fallback);
  useEffect(() => {
    if (!allowSwitch) return;
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === 'grid' || saved === 'list') setViewState(saved);
    } catch {
      // Storage blocked (private mode): keep the default.
    }
  }, [allowSwitch]);
  const setView = (next: ListingView) => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not remembered, but the switch still works for this visit.
    }
  };
  return [allowSwitch ? view : fallback, setView];
}
