'use client';

import { useActionState, useEffect, useRef } from 'react';

import { requestValuation } from '@/app/[locale]/sell/actions';
import { useI18n } from '@/i18n/I18nProvider';
import { HONEYPOT_FIELD } from '@/lib/contact';
import { REGIONS, PROPERTY_TYPES } from '@/lib/types';
import type { ValuationField, ValuationState } from '@/lib/valuation';

import formStyles from './ContactForm.module.css';
import slotStyles from './ViewingForm.module.css';

const INITIAL: ValuationState = { status: 'idle' };
const ORDER: ValuationField[] = ['intent', 'type', 'region', 'size', 'name', 'phone', 'email'];

/** Owner lead form: sell or rent out, what and where, and how to reach them. Works without JS. */
export function ValuationForm({ action = requestValuation }: { action?: typeof requestValuation }) {
  const { locale, t } = useI18n();
  const s = t.sell;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === 'error' ? state.fieldErrors : {};
  const values = state.status === 'error' ? state.values : undefined;

  useEffect(() => {
    if (state.status === 'error') {
      const first = ORDER.find((field) => state.fieldErrors[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      else statusRef.current?.focus();
    } else if (state.status === 'success') {
      statusRef.current?.focus();
    }
  }, [state]);

  if (state.status === 'success') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className={formStyles.success}>
        <p className={formStyles.successTitle}>{s.sentTitle}</p>
        <p>{state.message}</p>
      </div>
    );
  }

  const invalid = (field: ValuationField) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `valuation-${field}-error` : undefined,
  });
  const error = (field: ValuationField) =>
    errors[field] ? (
      <p id={`valuation-${field}-error`} className={formStyles.error}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form ref={formRef} action={formAction} className={formStyles.form} noValidate>
      {state.status === 'error' && (
        <div ref={statusRef} tabIndex={-1} role="alert" className={formStyles.formError}>
          {state.message}
        </div>
      )}
      <input type="hidden" name="locale" value={locale} />
      <div className={formStyles.honeypot} aria-hidden="true">
        <label htmlFor={`valuation-${HONEYPOT_FIELD}`}>{t.contact.honeypot}</label>
        <input id={`valuation-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className={slotStyles.slots} aria-describedby={errors.intent ? 'valuation-intent-error' : undefined}>
        <legend className={formStyles.label}>{s.intent}</legend>
        <div className={slotStyles.slotOptions} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {(['sell', 'rent'] as const).map((intent) => (
            <label key={intent} className={slotStyles.slot}>
              <input type="radio" name="intent" value={intent} defaultChecked={values ? values.intent === intent : intent === 'sell'} />
              <span>{intent === 'sell' ? s.intentSell : s.intentRent}</span>
            </label>
          ))}
        </div>
        {error('intent')}
      </fieldset>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label htmlFor="valuation-type" className={formStyles.label}>
            {s.type}
          </label>
          <select id="valuation-type" name="type" required defaultValue={values?.type ?? ''} className={formStyles.input} {...invalid('type')}>
            <option value="" disabled>
              {s.choose}
            </option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.types[type].label}
              </option>
            ))}
          </select>
          {error('type')}
        </div>
        <div className={formStyles.field}>
          <label htmlFor="valuation-region" className={formStyles.label}>
            {s.region}
          </label>
          <select id="valuation-region" name="region" required defaultValue={values?.region ?? ''} className={formStyles.input} {...invalid('region')}>
            <option value="" disabled>
              {s.choose}
            </option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {t.regions[region]}
              </option>
            ))}
          </select>
          {error('region')}
        </div>
      </div>

      <div className={formStyles.field}>
        <label htmlFor="valuation-size" className={formStyles.label}>
          {s.size}
        </label>
        <input
          id="valuation-size"
          name="size"
          type="text"
          inputMode="numeric"
          dir="ltr"
          maxLength={9}
          defaultValue={values?.size}
          className={formStyles.input}
          {...invalid('size')}
        />
        {error('size')}
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label htmlFor="valuation-name" className={formStyles.label}>
            {s.name}
          </label>
          <input id="valuation-name" name="name" type="text" autoComplete="name" required maxLength={100} defaultValue={values?.name} className={formStyles.input} {...invalid('name')} />
          {error('name')}
        </div>
        <div className={formStyles.field}>
          <label htmlFor="valuation-phone" className={formStyles.label}>
            {s.phone}
          </label>
          <input
            id="valuation-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            required
            maxLength={30}
            defaultValue={values?.phone}
            className={formStyles.input}
            {...invalid('phone')}
          />
          {error('phone')}
        </div>
      </div>

      <div className={formStyles.field}>
        <label htmlFor="valuation-email" className={formStyles.label}>
          {s.email}
        </label>
        <input
          id="valuation-email"
          name="email"
          type="email"
          inputMode="email"
          dir="ltr"
          autoComplete="email"
          maxLength={254}
          defaultValue={values?.email}
          className={formStyles.input}
          {...invalid('email')}
        />
        {error('email')}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="valuation-message" className={formStyles.label}>
          {s.message}
        </label>
        <textarea id="valuation-message" name="message" rows={4} maxLength={2000} defaultValue={values?.message} className={formStyles.input} />
      </div>

      <div className={formStyles.footer}>
        <button type="submit" className="button" disabled={pending}>
          {pending ? s.sending : s.submit}
        </button>
        <p className={formStyles.privacy}>{t.contact.privacy}</p>
      </div>
    </form>
  );
}
