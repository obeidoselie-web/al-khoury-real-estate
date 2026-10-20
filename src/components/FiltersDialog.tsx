'use client';

import { useId, useRef, useState } from 'react';

import { useI18n } from '@/i18n/I18nProvider';
import { formatNumber, interpolate, plural } from '@/i18n/plural';
import {
  BEDROOM_STEPS,
  BUDGETS,
  SIZE_STEPS,
  activeRefinements,
  filterListings,
  type ListingFilters,
} from '@/lib/filters';
import { formatArea } from '@/lib/format';
import type { ListingSummary } from '@/lib/types';

import styles from './FiltersDialog.module.css';
import { CloseIcon, SlidersIcon } from './icons';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

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
  const money = (n: number) => (locale === 'ar' ? `⁦${usd.format(n)}⁩` : usd.format(n));

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

  const budgets: Pill<number | undefined>[] = [
    { value: undefined, label: l.budgetAny },
    ...(draft.deal === 'all' ? [] : BUDGETS[draft.deal]).map((amount) => ({
      value: amount,
      label:
        draft.deal === 'rent'
          ? interpolate(t.format.perMonth, { amount: interpolate(l.budgetUpTo, { amount: money(amount) }) })
          : interpolate(l.budgetUpTo, { amount: money(amount) }),
    })),
  ];
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
            <PillGroup
              name="budget"
              legend={l.budget}
              options={budgets}
              value={draft.deal === 'all' ? undefined : draft.maxPrice}
              onChange={(maxPrice) => setDraft({ ...draft, maxPrice })}
              disabled={draft.deal === 'all'}
              hint={draft.deal === 'all' ? l.budgetHint : undefined}
            />
            <PillGroup name="beds" legend={l.bedrooms} options={beds} value={draft.minBeds} onChange={(minBeds) => setDraft({ ...draft, minBeds })} />
            <PillGroup name="size" legend={l.size} options={sizes} value={draft.minSize} onChange={(minSize) => setDraft({ ...draft, minSize })} />
          </div>

          <footer className={styles.foot}>
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => setDraft({ ...draft, maxPrice: undefined, minBeds: undefined, minSize: undefined })}
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
