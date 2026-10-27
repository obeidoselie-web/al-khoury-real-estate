'use client';

import { createContext, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import type { TextKind, TextValue } from '@/lib/content/texts';

import styles from '../../admin.module.css';
import { MapPicker } from '../MapPicker';
import { useKeepValuesSubmit } from '../useKeepValuesSubmit';
import { saveWebsite, type WebsiteFormState } from './actions';

const ErrorsContext = createContext<Record<string, string>>({});

/**
 * One Website page: settings and texts together, saved in one go. `settings` lists the setting
 * paths on the page (so an unticked switch saves as "off").
 */
export function WebsiteForm({ page, settings = [], children }: { page: string; settings?: string[]; children: ReactNode }) {
  const [state, formAction, pending] = useActionState<WebsiteFormState, FormData>(saveWebsite, { status: 'idle' });
  const onSubmit = useKeepValuesSubmit(formAction);
  const bannerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status !== 'idle') bannerRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
      <input type="hidden" name="__page" value={page} />
      {settings.length > 0 && <input type="hidden" name="__settings" value={settings.join(',')} />}
      {state.status !== 'idle' && (
        <p
          ref={bannerRef}
          tabIndex={-1}
          key={state.at}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`${styles.banner} ${state.status === 'error' ? styles.bannerError : styles.bannerOk}`}
        >
          {state.message}
        </p>
      )}
      <ErrorsContext.Provider value={state.fieldErrors ?? {}}>{children}</ErrorsContext.Provider>
      <div className={styles.formBar}>
        <p className={styles.hint}>Changes go live on the website as soon as you save.</p>
        <button type="submit" className={`${styles.btn} ${styles.btnGold}`} disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  const id = `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        {hint && <p className={styles.sectionHint}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function FieldError({ name }: { name: string }) {
  const error = useContext(ErrorsContext)[name];
  return error ? (
    <p id={`${name}-error`} className={styles.error}>
      {error}
    </p>
  ) : null;
}

const fieldId = (name: string) => `f-${name.replace(/\./g, '-')}`;

/** A text, number or URL setting. */
export function SettingInput({
  path,
  label,
  value,
  hint,
  type = 'text',
  ltr,
}: {
  path: string;
  label: string;
  value: string | number;
  hint?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  ltr?: boolean;
}) {
  const name = `s.${path}`;
  const invalid = Boolean(useContext(ErrorsContext)[name]);
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId(name)} className={styles.label}>
        {label}
      </label>
      <input
        id={fieldId(name)}
        name={name}
        type={type === 'number' ? 'text' : type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        defaultValue={value}
        className={`${styles.input} ${ltr ? 'ltr' : ''}`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${name}-error` : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <p className={styles.hint}>{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

/** An on/off setting, shown as a switch-like checkbox. */
export function SettingToggle({ path, label, checked, hint }: { path: string; label: string; checked: boolean; hint?: string }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" name={`s.${path}`} defaultChecked={checked} />
      <span>
        <span className={styles.toggleLabel}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  );
}

export interface TextFieldData {
  path: string;
  kind: TextKind;
  label: string;
  hint?: string;
  en: { value: TextValue; default: TextValue };
  ar: { value: TextValue; default: TextValue };
}

const asText = (value: TextValue) => (Array.isArray(value) ? value.join('\n') : value);

function TextInput({ name, value, fallback, kind, lang, label }: { name: string; value: TextValue; fallback: TextValue; kind: TextKind; lang: 'en' | 'ar'; label: string }) {
  const [text, setText] = useState(asText(value));
  const invalid = Boolean(useContext(ErrorsContext)[name]);
  const original = asText(fallback);
  const multiline = kind === 'lines' || original.length > 90 || original.includes('\n');
  const common = {
    id: fieldId(name),
    name,
    value: text,
    onChange: (e: { target: { value: string } }) => setText(e.target.value),
    className: styles.input,
    dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const),
    lang,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? `${name}-error` : undefined,
  };
  return (
    <div className={styles.field}>
      <div className={styles.textHead}>
        <label htmlFor={fieldId(name)} className={styles.hint}>
          {label}
        </label>
        {text !== original && (
          <button type="button" className={styles.linkBtn} onClick={() => setText(original)}>
            Reset to default
          </button>
        )}
      </div>
      {multiline ? <textarea {...common} rows={kind === 'lines' ? Math.max(2, text.split('\n').length) : 3} /> : <input {...common} />}
      <FieldError name={name} />
    </div>
  );
}

/** One piece of website text, English and Arabic side by side. */
export function TextField({ field }: { field: TextFieldData }) {
  const edited = asText(field.en.value) !== asText(field.en.default) || asText(field.ar.value) !== asText(field.ar.default);
  return (
    <fieldset className={styles.textField}>
      <legend className={styles.label}>
        {field.label} {edited && <span className={styles.tag}>Edited</span>}
      </legend>
      {field.hint && <p className={styles.hint}>{field.hint}</p>}
      {field.kind === 'lines' && <p className={styles.hint}>One per line.</p>}
      <div className={styles.fields2}>
        <TextInput name={`t.en.${field.path}`} value={field.en.value} fallback={field.en.default} kind={field.kind} lang="en" label="English" />
        <TextInput name={`t.ar.${field.path}`} value={field.ar.value} fallback={field.ar.default} kind={field.kind} lang="ar" label="العربية" />
      </div>
    </fieldset>
  );
}

/** The office pin, wired to the form's field errors. */
export function OfficeMapField({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const error = useContext(ErrorsContext)['s.office.lat'];
  return (
    <MapPicker latName="s.office.lat" lngName="s.office.lng" zoomName="s.office.zoom" initial={{ lat, lng }} initialZoom={zoom} error={error} />
  );
}
