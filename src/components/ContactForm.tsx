'use client';

import { useActionState, useEffect, useRef } from 'react';

import { submitContact } from '@/app/[locale]/about/actions';
import { useI18n } from '@/i18n/I18nProvider';
import { interpolate } from '@/i18n/plural';
import { CONTACT_LIMITS, HONEYPOT_FIELD, type ContactField, type ContactState } from '@/lib/contact';

import styles from './ContactForm.module.css';

const INITIAL_STATE: ContactState = { status: 'idle' };
const FIELD_ORDER: ContactField[] = ['name', 'email', 'phone', 'message'];

interface ContactFormProps {
  propertyId?: string;
  propertyTitle?: string;
  /** Injected in tests; defaults to the real server action. */
  action?: typeof submitContact;
}

/**
 * Works without JavaScript (a plain form POST to the server action) and is enhanced with
 * inline errors, focus management and a pending state when JS is available.
 */
export function ContactForm({ propertyId, propertyTitle, action = submitContact }: ContactFormProps) {
  const { locale, t } = useI18n();
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === 'error' ? state.fieldErrors : {};
  const values = state.status === 'error' ? state.values : undefined;
  const defaultMessage = propertyTitle ? interpolate(t.contact.defaultMessage, { title: propertyTitle }) : '';

  // After a failed submit, move focus to the first invalid field; after success, to the confirmation.
  useEffect(() => {
    if (state.status === 'error') {
      const firstInvalid = FIELD_ORDER.find((field) => state.fieldErrors[field]);
      if (firstInvalid) formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      else statusRef.current?.focus();
    } else if (state.status === 'success') {
      statusRef.current?.focus();
    }
  }, [state]);

  if (state.status === 'success') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className={styles.success}>
        <p className={styles.successTitle}>{t.contact.sentTitle}</p>
        <p>{state.message}</p>
      </div>
    );
  }

  function fieldProps(field: ContactField) {
    const errorId = `${field}-error`;
    return {
      id: `contact-${field}`,
      name: field,
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? errorId : undefined,
      className: styles.input,
    } as const;
  }

  function fieldError(field: ContactField) {
    if (!errors[field]) return null;
    return (
      <p id={`${field}-error`} className={styles.error}>
        {errors[field]}
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      {state.status === 'error' && (
        <div ref={statusRef} tabIndex={-1} role="alert" className={styles.formError}>
          {state.message}
        </div>
      )}

      <input type="hidden" name="locale" value={locale} />
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}

      {/* Honeypot: hidden from people and assistive tech, often filled by bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>{t.contact.honeypot}</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="contact-name" className={styles.label}>
            {t.contact.fullName}
          </label>
          <input
            {...fieldProps('name')}
            type="text"
            autoComplete="name"
            required
            maxLength={CONTACT_LIMITS.name.max}
            defaultValue={values?.name}
          />
          {fieldError('name')}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-email" className={styles.label}>
            {t.contact.email}
          </label>
          <input
            {...fieldProps('email')}
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            defaultValue={values?.email}
          />
          {fieldError('email')}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-phone" className={styles.label}>
          {t.contact.phone} <span className={styles.optional}>{t.contact.optional}</span>
        </label>
        <input
          {...fieldProps('phone')}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          maxLength={CONTACT_LIMITS.phone.max}
          defaultValue={values?.phone}
        />
        {fieldError('phone')}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>
          {t.contact.message}
        </label>
        <textarea
          {...fieldProps('message')}
          rows={5}
          required
          maxLength={CONTACT_LIMITS.message.max}
          defaultValue={values?.message ?? defaultMessage}
        />
        {fieldError('message')}
      </div>

      <div className={styles.footer}>
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? t.contact.sending : t.contact.send}
        </button>
        <p className={styles.privacy}>{t.contact.privacy}</p>
      </div>
    </form>
  );
}
