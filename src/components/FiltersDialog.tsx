'use client';

import { useId, useRef, useState } from 'react';

import { useI18n } from '@/i18n/I18nProvider';
import { formatNumber, interpolate, plural } from '@/i18n/plural';
import {
  BEDROOM_STEPS,
  SIZE_STEPS,
  activeRefinements,
  filterListings,
  type ListingFilters,
} from '@/lib/filters';
import { formatArea } from '@/lib/format';
import { DEAL_TYPES, type ListingSummary } from '@/lib/types';

import styles from './FiltersDialog.module.css';
import { CloseIcon, SlidersIcon } from './icons';
import { PriceRange } from './PriceRange';

interface FiltersDialogProps {
  listings: ListingSummary[];
  filters: ListingFilters;
  onApply: (next: ListingFilters) => void;
}

type Pill<T> = { value: T; label: string };

function PillGroup<T extends number | undefined>({
  name,
  legend,
  options,
  value,
  onChange,
  disabled,
  hint,
}: {
  name: string;
  legend: string;
  options: Pill<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const hintId = useId();
  return (
    <fieldset className={styles.group} disabled={disabled} aria-describedby={hint ? hintId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.pills}>
        {options.map((option) => (
          <label key={String(option.value)} className={styles.pill}>
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The "Filters" button and panel for budget, bedrooms and size. Changes are a draft until
 * "Show N properties" applies them; the button shows how many results the draft would give.
 */
export function FiltersDialog({ listings, filters, onApply }: FiltersDialogProps) {
  const { locale, t } = useI18n();
  const l = t.listings;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [draft, setDraft] = useState<ListingFilters>(filters);

  const active = activeRefinements(filters);
  const draftCount = filterListings(listings, draft).length;

  function open() {
    setDraft(filters);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function close() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    triggerRef.current?.focus();
  }

  function apply() {
    onApply(draft);
    close();
  }

  // Prices behind the histogram: everything matching the other choices, for the chosen deal.
  const prices =
    draft.deal === 'all'
      ? []
      : filterListings(listings, { ...draft, minPrice: undefined, maxPrice: undefined })
          .filter((listing) => !listing.priceOnRequest)
          .map((listing) => listing.price);
  const beds: Pill<number | undefined>[] = [
    { value: undefined, label: l.any },
    ...BEDROOM_STEPS.map((n) => ({ value: n, label: interpolate(l.atLeast, { value: formatNumber(n, locale) }) })),
  ];
  const sizes: Pill<number | undefined>[] = [
    { value: undefined, label: l.any },
    ...SIZE_STEPS.map((n) => ({ value: n, label: interpolate(l.atLeast, { value: formatArea(n, locale, t) }) })),
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={open}
        aria-haspopup="dialog"
        aria-label={active ? `${l.filtersButton}, ${plural(locale, active, l.filtersActive)}` : l.filtersButton}
      >
        <SlidersIcon size={18} />
        <span>{l.filtersButton}</span>
        {active > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {formatNumber(active, locale)}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className={styles.panel}>
          <header className={styles.head}>
            <button type="button" className={styles.close} onClick={close} aria-label={t.settings.close}>
              <CloseIcon size={18} />
            </button>
            <h2 id={titleId} className={styles.title}>
              {l.filtersTitle}
            </h2>
            <span className={styles.headSpacer} aria-hidden="true" />
          </header>

          <div className={styles.body}>
            <fieldset className={styles.group}>
              <legend className={styles.legend}>{l.budget}</legend>
              {/* Sale prices and monthly rents need different scales, so the budget starts with the deal. */}
              <div className={styles.pills} role="radiogroup" aria-label={l.dealLegend}>
                {DEAL_TYPES.map((deal) => (
                  <label key={deal} className={styles.pill}>
                    <input
                      type="radio"
                      name="budget-deal"
                      checked={draft.deal === deal}
                      onChange={() => setDraft({ ...draft, deal, minPrice: undefined, maxPrice: undefined })}
                    />
                    <span>{t.deals[deal].filter}</span>
                  </label>
                ))}
              </div>
              {draft.deal === 'all' ? (
                <p className={styles.hint}>{l.budgetHint}</p>
              ) : (
                <PriceRange
                  key={draft.deal}
                  deal={draft.deal}
                  min={draft.minPrice}
                  max={draft.maxPrice}
                  prices={prices}
                  onChange={({ min, max }) => setDraft({ ...draft, minPrice: min, maxPrice: max })}
                  locale={locale}
                  t={t}
                />
              )}
            </fieldset>
            <PillGroup name="beds" legend={l.bedrooms} options={beds} value={draft.minBeds} onChange={(minBeds) => setDraft({ ...draft, minBeds })} />
            <PillGroup name="size" legend={l.size} options={sizes} value={draft.minSize} onChange={(minSize) => setDraft({ ...draft, minSize })} />
          </div>

          <footer className={styles.foot}>
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => setDraft({ ...draft, minPrice: undefined, maxPrice: undefined, minBeds: undefined, minSize: undefined })}
            >
              {l.clearAll}
            </button>
            <button type="button" className="button button-inverse" onClick={apply}>
              {plural(locale, draftCount, l.showResults)}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
