'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { LOCALES, LOCALE_COOKIE, LOCALE_META, switchLocalePath, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import {
  applyAppearance,
  isDefaultAppearance,
  loadAppearance,
  saveAppearance,
  siteDefaults,
  type Appearance,
  type AppearanceKey,
} from '@/lib/appearance';

import styles from './AppearanceSettings.module.css';
import { CheckIcon, CloseIcon, GlobeIcon, SlidersIcon } from './icons';

/** Moves to the same page in another language and remembers the choice for future visits. */
export function goToLocale(target: Locale, pathname: string) {
  document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
  window.location.assign(`${switchLocalePath(pathname, target)}${window.location.search}${window.location.hash}`);
}

const LANGUAGE_SAMPLE: Record<Locale, string> = { en: 'Aa', ar: 'أب' };

/** A visual radio card: native radio input underneath, so arrow keys and screen readers work as usual. */
function Card<T extends string>({
  name,
  value,
  checked,
  onChange,
  children,
  lang,
}: {
  name: string;
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <label className={styles.card} lang={lang}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className={styles.cardInput} />
      <span className={styles.cardBody}>
        {children}
        <span className={styles.cardCheck} aria-hidden="true">
          <CheckIcon size={12} />
        </span>
      </span>
    </label>
  );
}

/** An on/off switch: a native checkbox exposed as role="switch". */
function Switch({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <label htmlFor={id} className={styles.switchLabel}>
          {label}
        </label>
        <span className={styles.switchHint} id={`${id}-hint`}>
          {hint}
        </span>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.checked)}
        className={styles.switch}
      />
    </div>
  );
}

/**
 * Header button + modal dialog for language and appearance.
 * Native <dialog>: focus is trapped, Esc closes it, focus returns to the button. Every change applies
 * instantly (the page behind updates live) and is saved on this device.
 */
export function AppearanceSettings() {
  const { locale, t, contact } = useI18n();
  // The site default theme (Admin → Website) is what "no choice" and Reset mean here.
  const defaults = siteDefaults(contact.defaultTheme);
  const pathname = usePathname() ?? '/';
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const [settings, setSettings] = useState<Appearance>(defaults);

  useEffect(() => {
    setSettings(loadAppearance(defaults));
  }, [contact.defaultTheme]);

  function update<K extends AppearanceKey>(key: K, value: Appearance[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applyAppearance(next, document.documentElement);
    saveAppearance(next, defaults);
  }

  function reset() {
    setSettings(defaults);
    applyAppearance(defaults, document.documentElement);
    saveAppearance(defaults, defaults);
  }

  function open() {
    setSettings(loadAppearance(defaults));
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

  const s = t.settings;
  const isDefault = isDefaultAppearance(settings, defaults);

  const themes: { value: Appearance['theme']; label: string; hint?: string }[] = [
    { value: 'system', label: s.themeSystem, hint: s.themeSystemHint },
    { value: 'light', label: s.themeLight },
    { value: 'dark', label: s.themeDark },
    { value: 'ivory', label: s.themeIvory, hint: s.themeIvoryHint },
    { value: 'cedar', label: s.themeCedar, hint: s.themeCedarHint },
    { value: 'coastal', label: s.themeCoastal, hint: s.themeCoastalHint },
    { value: 'midnight', label: s.themeMidnight, hint: s.themeMidnightHint },
  ];
  const textSizes: { value: Appearance['text']; label: string }[] = [
    { value: 'default', label: s.textDefault },
    { value: 'large', label: s.textLarge },
    { value: 'larger', label: s.textLarger },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={open}
        aria-haspopup="dialog"
        aria-label={s.open}
        title={s.open}
      >
        <GlobeIcon size={18} />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself, outside the panel) closes it.
          if (event.target === dialogRef.current) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className={styles.panel}>
          <header className={styles.head}>
            <span className={styles.headIcon} aria-hidden="true">
              <SlidersIcon size={20} />
            </span>
            <div className={styles.headText}>
              <h2 id={titleId} className={styles.title}>
                {s.title}
              </h2>
              <p id={descId} className={styles.subtitle}>
                {s.subtitle}
              </p>
            </div>
            <button type="button" className={styles.close} onClick={close} aria-label={s.close}>
              <CloseIcon size={18} />
            </button>
          </header>

          <div className={styles.body}>
            <fieldset className={styles.group}>
              <legend className={styles.legend}>{s.language}</legend>
              <div className={`${styles.grid} ${styles.grid2}`}>
                {LOCALES.map((l) => (
                  <Card key={l} name="language" value={l} checked={l === locale} onChange={(v) => v !== locale && goToLocale(v, pathname)} lang={l}>
                    <span className={styles.langSample} aria-hidden="true">
                      {LANGUAGE_SAMPLE[l]}
                    </span>
                    <span className={styles.cardText}>
                      <span className={styles.cardLabel}>{LOCALE_META[l].label}</span>{' '}
                      {/* Show the language's name in the current language when it differs ("Arabic" under "العربية"). */}
                      {s.languageNames[l] !== LOCALE_META[l].label && (
                        <span className={styles.cardHint} lang={locale}>
                          {s.languageNames[l]}
                        </span>
                      )}
                    </span>
                  </Card>
                ))}
              </div>
            </fieldset>

            <p className={styles.section}>{s.sectionDisplay}</p>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>{s.theme}</legend>
              <div className={`${styles.grid} ${styles.grid3}`}>
                {themes.map((theme) => (
                  <Card key={theme.value} name="theme" value={theme.value} checked={settings.theme === theme.value} onChange={(v) => update('theme', v)}>
                    <span className={styles.preview} data-preview={theme.value} aria-hidden="true">
                      <span className={styles.previewBar} />
                      <span className={styles.previewLine} />
                      <span className={`${styles.previewLine} ${styles.previewShort}`} />
                      <span className={styles.previewButton} />
                    </span>
                    <span className={styles.cardText}>
                      <span className={styles.cardLabel}>{theme.label}</span>{' '}
                      {theme.hint && <span className={styles.cardHint}>{theme.hint}</span>}
                    </span>
                  </Card>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>{s.textSize}</legend>
              <div className={`${styles.grid} ${styles.grid3}`}>
                {textSizes.map((size, index) => (
                  <Card key={size.value} name="text" value={size.value} checked={settings.text === size.value} onChange={(v) => update('text', v)}>
                    <span className={styles.textSample} data-step={index} aria-hidden="true">
                      {LANGUAGE_SAMPLE[locale].charAt(0)}
                    </span>
                    <span className={styles.cardText}>
                      <span className={styles.cardLabel}>{size.label}</span>
                    </span>
                  </Card>
                ))}
              </div>
            </fieldset>

            <p className={styles.section}>{s.sectionAccessibility}</p>

            <div className={styles.switches}>
              <Switch
                label={s.contrastToggle}
                hint={s.contrastHint}
                checked={settings.contrast === 'more'}
                onChange={(on) => update('contrast', on ? 'more' : 'standard')}
              />
              <Switch
                label={s.motionToggle}
                hint={s.motionHint}
                checked={settings.motion === 'reduce'}
                onChange={(on) => update('motion', on ? 'reduce' : 'system')}
              />
            </div>
          </div>

          <footer className={styles.foot}>
            <button type="button" className={styles.reset} onClick={reset} disabled={isDefault}>
              {s.reset}
            </button>
            <button type="button" className={`button button-inverse ${styles.done}`} onClick={close}>
              {s.done}
            </button>
          </footer>
          <p className={styles.note}>{s.note}</p>
        </div>
      </dialog>
    </>
  );
}
