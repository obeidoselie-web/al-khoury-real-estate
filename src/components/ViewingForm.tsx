'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';

import { requestViewing } from '@/app/[locale]/listings/[id]/actions';
import { useI18n } from '@/i18n/I18nProvider';
import { HONEYPOT_FIELD } from '@/lib/contact';
import { TIME_SLOTS, viewingDateRange, type ViewingField, type ViewingState } from '@/lib/viewing';

import formStyles from './ContactForm.module.css';
import styles from './ViewingForm.module.css';

const INITIAL: ViewingState = { status: 'idle' };
const ORDER: ViewingField[] = ['name', 'phone', 'date', 'time'];

/**
 * "Book a viewing": date, time of day, name and phone. Posts to a server action (works without JS);
 * with JS it shows inline errors, moves focus to the first problem and confirms in place.
 */
export function ViewingForm({ propertyId, action = requestViewing }: { propertyId: string; action?: typeof requestViewing }) {
  const { locale, t } = useI18n();
  const v = t.property.viewing;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const { min, max } = useMemo(() => viewingDateRange(), []);

  const errors = state.status === 'error' ? state.fieldErrors : {};
  const values = state.status === 'error' ? state.values : undefined;

  useEffect(() => {
    if (state.status === 'error') {
      const first = ORDER.find((field) => state.fieldErrors[field]);
      const target = first === 'time' ? '[name="time"]' : first ? `[name="${first}"]` : null;
      if (target) formRef.current?.querySelector<HTMLElement>(target)?.focus();
      else statusRef.current?.focus();
    } else if (state.status === 'success') {
      statusRef.current?.focus();
    }
  }, [state]);

  if (state.status === 'success') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className={formStyles.success}>
        <p className={formStyles.successTitle}>{v.sentTitle}</p>
        <p>{state.message}</p>
      </div>
    );
  }

  const describedBy = (field: ViewingField) => (errors[field] ? `viewing-${field}-error` : undefined);
  const error = (field: ViewingField) =>
    errors[field] ? (
      <p id={`viewing-${field}-error`} className={formStyles.error}>
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
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className={formStyles.honeypot} aria-hidden="true">
        <label htmlFor={`viewing-${HONEYPOT_FIELD}`}>{t.contact.honeypot}</label>
        <input id={`viewing-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label htmlFor="viewing-date" className={formStyles.label}>
            {v.date}
          </label>
          <input
            id="viewing-date"
            name="date"
            type="date"
            required
            min={min}
            max={max}
            defaultValue={values?.date}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy('date')}
            className={formStyles.input}
          />
          {error('date')}
        </div>

        <fieldset className={styles.slots} aria-describedby={describedBy('time')}>
          <legend className={formStyles.label}>{v.time}</legend>
          <div className={styles.slotOptions}>
            {TIME_SLOTS.map((slot) => (
              <label key={slot} className={styles.slot}>
                <input type="radio" name="time" value={slot} defaultChecked={values?.time === slot} required />
                <span>{v[slot]}</span>
              </label>
            ))}
          </div>
          {error('time')}
        </fieldset>
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label htmlFor="viewing-name" className={formStyles.label}>
            {v.name}
          </label>
          <input
            id="viewing-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            defaultValue={values?.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
            className={formStyles.input}
          />
          {error('name')}
        </div>
        <div className={formStyles.field}>
          <label htmlFor="viewing-phone" className={formStyles.label}>
            {v.phone}
          </label>
          <input
            id="viewing-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            required
            maxLength={30}
            defaultValue={values?.phone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy('phone')}
            className={formStyles.input}
          />
          {error('phone')}
        </div>
      </div>

      <div className={formStyles.field}>
        <label htmlFor="viewing-notes" className={formStyles.label}>
          {v.notes}
        </label>
        <textarea id="viewing-notes" name="notes" rows={3} maxLength={1000} defaultValue={values?.notes} className={formStyles.input} />
      </div>

      <div className={formStyles.footer}>
        <button type="submit" className="button" disabled={pending}>
          {pending ? v.sending : v.submit}
        </button>
        <p className={formStyles.privacy}>{t.contact.privacy}</p>
      </div>
    </form>
  );
}
