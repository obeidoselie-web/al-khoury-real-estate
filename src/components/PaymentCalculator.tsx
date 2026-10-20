'use client';

import { useId, useState } from 'react';

import { useI18n } from '@/i18n/I18nProvider';
import { formatNumber, plural } from '@/i18n/plural';
import { estimateMortgage } from '@/lib/mortgage';

import styles from './PaymentCalculator.module.css';

const TERMS = [10, 15, 20, 25, 30];
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Mortgage estimate for a sale listing. Everything recalculates as you move the controls. */
export function PaymentCalculator({ price }: { price: number }) {
  const { locale, t } = useI18n();
  const c = t.property.calculator;
  const id = useId();
  const [down, setDown] = useState(30);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(7.5);

  const { loan, monthly, totalInterest } = estimateMortgage(price, down, years, rate);
  const money = (value: number) => (locale === 'ar' ? `⁦${usd.format(value)}⁩` : usd.format(value));

  return (
    <section className={styles.calculator} aria-labelledby={`${id}-title`}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {c.title}
        </h2>
        <p className={styles.lead}>{c.lead}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <div className={styles.fieldHead}>
              <label htmlFor={`${id}-down`}>{c.downPayment}</label>
              <output htmlFor={`${id}-down`} className={styles.value}>
                {formatNumber(down, locale)}% · {money((price * down) / 100)}
              </output>
            </div>
            <input
              id={`${id}-down`}
              type="range"
              min={10}
              max={70}
              step={5}
              value={down}
              onChange={(event) => setDown(Number(event.target.value))}
              className={styles.range}
              style={{ '--fill': `${((down - 10) / 60) * 100}%` } as React.CSSProperties}
            />
          </div>

          <fieldset className={styles.field}>
            <legend className={styles.legend}>{c.term}</legend>
            <div className={styles.terms}>
              {TERMS.map((term) => (
                <label key={term} className={styles.term}>
                  <input type="radio" name={`${id}-term`} value={term} checked={years === term} onChange={() => setYears(term)} />
                  <span>{plural(locale, term, c.years)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor={`${id}-rate`}>{c.rate}</label>
            <input
              id={`${id}-rate`}
              type="number"
              inputMode="decimal"
              min={0}
              max={25}
              step={0.25}
              value={rate}
              dir="ltr"
              onChange={(event) => setRate(Math.min(Math.max(Number(event.target.value) || 0, 0), 25))}
              className={styles.number}
            />
          </div>
        </div>

        <div className={styles.result} aria-live="polite">
          <p className={styles.resultLabel}>{c.monthly}</p>
          <p className={styles.monthly}>{money(monthly)}</p>
          <dl className={styles.breakdown}>
            <div>
              <dt>{c.loan}</dt>
              <dd>{money(loan)}</dd>
            </div>
            <div>
              <dt>{c.totalInterest}</dt>
              <dd>{money(totalInterest)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className={styles.disclaimer}>{c.disclaimer}</p>
    </section>
  );
}
