'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { PRICE_STEPS, parseAmount } from '@/lib/filters';
import { formatPrice } from '@/lib/format';
import type { DealType } from '@/lib/types';

import styles from './PriceRange.module.css';

const compact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
const full = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Slider position for an amount: the last stop at or below it. */
export function stepIndex(steps: number[], amount: number | undefined, fallback: number): number {
  if (amount === undefined) return fallback;
  let index = 0;
  for (let i = 0; i < steps.length; i++) if (steps[i] <= amount) index = i;
  return index;
}

/** Listings per slider interval; anything at or above the last stop counts in the last bar. */
export function priceHistogram(steps: number[], prices: number[]): number[] {
  const bins = new Array(steps.length - 1).fill(0);
  for (const price of prices) bins[Math.min(stepIndex(steps, price, 0), bins.length - 1)] += 1;
  return bins;
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

interface PriceRangeProps {
  deal: DealType;
  min?: number;
  max?: number;
  /** Prices of the properties matching the other filters (for the histogram and typical price). */
  prices: number[];
  onChange: (range: { min?: number; max?: number }) => void;
  locale: Locale;
  t: Pick<Dictionary, 'listings' | 'format'>;
}

/**
 * Budget: a price histogram, a two-handle slider on a stepped scale (fine steps for modest prices,
 * wide ones at the top), and Min / Max fields that accept "750k" or "1.2m". The slider is two
 * native range inputs, so keyboard and screen-reader support come from the browser.
 */
export function PriceRange({ deal, min, max, prices, onChange, locale, t }: PriceRangeProps) {
  const l = t.listings;
  const id = useId();
  const steps = PRICE_STEPS[deal];
  const last = steps.length - 1;
  const lo = stepIndex(steps, min, 0);
  const hi = max === undefined ? last : Math.max(lo + 1, stepIndex(steps, max, last));
  const bins = priceHistogram(steps, prices);
  const tallest = Math.max(1, ...bins);
  const typical = median(prices);

  const money = (amount: number, short = true) => {
    const text = short ? compact.format(amount) : `$${full.format(amount)}`;
    return locale === 'ar' ? `⁦${text}⁩` : text;
  };
  const perPeriod = (text: string) => (deal === 'rent' ? interpolate(t.format.perMonth, { amount: text }) : text);
  const stopLabel = (index: number, bound: 'min' | 'max') => {
    if (bound === 'min' && index === 0) return l.noMin;
    if (bound === 'max' && index === last) return interpolate(l.budgetPlus, { amount: money(steps[last]) });
    return perPeriod(money(steps[index]));
  };

  const setFromSlider = (nextLo: number, nextHi: number) =>
    onChange({ min: nextLo === 0 ? undefined : steps[nextLo], max: nextHi === last ? undefined : steps[nextHi] });

  const fillStyle = { '--from': lo / last, '--to': hi / last } as CSSProperties;

  return (
    <div className={styles.range}>
      <div className={styles.chart} aria-hidden="true">
        {bins.map((count, index) => (
          <span
            key={index}
            className={styles.bar}
            data-in={index >= lo && index < hi ? '' : undefined}
            style={{ height: `${count === 0 ? 0 : Math.max(8, (count / tallest) * 100)}%` }}
          />
        ))}
      </div>

      <div className={styles.slider} style={fillStyle}>
        <span className={styles.track} aria-hidden="true" />
        <span className={styles.fill} aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={lo}
          aria-label={l.priceMinThumb}
          aria-valuetext={stopLabel(lo, 'min')}
          onChange={(e) => setFromSlider(Math.min(Number(e.target.value), hi - 1), hi)}
          className={styles.thumb}
        />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={hi}
          aria-label={l.priceMaxThumb}
          aria-valuetext={stopLabel(hi, 'max')}
          onChange={(e) => setFromSlider(lo, Math.max(Number(e.target.value), lo + 1))}
          className={styles.thumb}
        />
      </div>

      <div className={styles.fields}>
        <AmountField
          id={`${id}-min`}
          label={l.priceMin}
          placeholder={l.noMin}
          value={min}
          display={(n) => money(n, false)}
          onCommit={(value) => onChange(order(value, max))}
        />
        <span className={styles.dash} aria-hidden="true">
          –
        </span>
        <AmountField
          id={`${id}-max`}
          label={l.priceMax}
          placeholder={l.noMax}
          value={max}
          display={(n) => money(n, false)}
          onCommit={(value) => onChange(order(min, value))}
        />
      </div>

      <p className={styles.note}>
        {typical !== undefined && <span className={styles.typical}>{interpolate(l.typicalPrice, { amount: perPeriod(formatPrice(typical, 'sale', locale, t)) })}</span>}
        <span>{l.budgetExcludesOnRequest}</span>
      </p>
    </div>
  );
}

/** Keeps min ≤ max whichever field was typed into. */
function order(min?: number, max?: number) {
  return min !== undefined && max !== undefined && min > max ? { min: max, max: min } : { min, max };
}

function AmountField({
  id,
  label,
  placeholder,
  value,
  display,
  onCommit,
}: {
  id: string;
  label: string;
  placeholder: string;
  value?: number;
  display: (n: number) => string;
  onCommit: (value: number | undefined) => void;
}) {
  const [text, setText] = useState(value === undefined ? '' : display(value));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectAll = useRef(false);

  // Select the plain number right after focusing, before the next keystroke can land.
  useLayoutEffect(() => {
    if (selectAll.current) {
      selectAll.current = false;
      inputRef.current?.select();
    }
  }, [text]);

  // Follow the slider while the field isn't being edited.
  useEffect(() => {
    if (!focused) setText(value === undefined ? '' : display(value));
  }, [value, focused, display]);

  const commit = () => {
    const trimmed = text.trim();
    const parsed = trimmed ? parseAmount(trimmed) : undefined;
    if (trimmed && parsed === undefined) {
      setText(value === undefined ? '' : display(value)); // not a number: put the old value back
      return;
    }
    onCommit(parsed);
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        inputMode="decimal"
        dir="ltr"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => {
          setFocused(true);
          // Edit the plain number: "$750,000" → "750000", selected so typing replaces it.
          if (value !== undefined) {
            selectAll.current = true;
            setText(String(value));
          }
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}
