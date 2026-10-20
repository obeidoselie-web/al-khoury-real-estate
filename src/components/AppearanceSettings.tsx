'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { LOCALES, LOCALE_COOKIE, LOCALE_META, switchLocalePath, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import {
  DEFAULT_APPEARANCE,
  applyAppearance,
  loadAppearance,
  saveAppearance,
  type Appearance,
  type AppearanceKey,
} from '@/lib/appearance';

import styles from './AppearanceSettings.module.css';
import { GlobeIcon } from './icons';
import { ChoiceGroup, type ChoiceOption } from './ChoiceGroup';

/** Moves to the same page in another language and remembers the choice for future visits. */
export function goToLocale(target: Locale, pathname: string) {
  document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
  window.location.assign(`${switchLocalePath(pathname, target)}${window.location.search}${window.location.hash}`);
}

/**
 * Header button + modal dialog for language and appearance (theme, text size, contrast, motion).
 * Uses the native <dialog>: focus is trapped, Esc closes it, and focus returns to the button.
 */
export function AppearanceSettings() {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? '/';
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [settings, setSettings] = useState<Appearance>(DEFAULT_APPEARANCE);

  useEffect(() => {
    setSettings(loadAppearance());
  }, []);

  function update<K extends AppearanceKey>(key: K, value: Appearance[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applyAppearance(next, document.documentElement);
    saveAppearance(next);
  }

  function reset() {
    setSettings(DEFAULT_APPEARANCE);
    applyAppearance(DEFAULT_APPEARANCE, document.documentElement);
    saveAppearance(DEFAULT_APPEARANCE);
  }

  function open() {
    setSettings(loadAppearance());
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
  const languageOptions: ChoiceOption<Locale>[] = LOCALES.map((l) => ({ value: l, label: LOCALE_META[l].label, lang: l }));
  const themeOptions: ChoiceOption<Appearance['theme']>[] = [
    { value: 'system', label: s.themeSystem },
    { value: 'light', label: s.themeLight },
    { value: 'dark', label: s.themeDark },
  ];
  const textOptions: ChoiceOption<Appearance['text']>[] = [
    { value: 'default', label: s.textDefault },
    { value: 'large', label: s.textLarge },
    { value: 'larger', label: s.textLarger },
  ];
  const contrastOptions: ChoiceOption<Appearance['contrast']>[] = [
    { value: 'standard', label: s.contrastStandard },
    { value: 'more', label: s.contrastMore },
  ];
  const motionOptions: ChoiceOption<Appearance['motion']>[] = [
    { value: 'system', label: s.motionSystem },
    { value: 'reduce', label: s.motionReduce },
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
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              {s.title}
            </h2>
            <button type="button" className={styles.close} onClick={close}>
              {s.close}
            </button>
          </div>

          <div className={styles.groups}>
            <ChoiceGroup
              name="language"
              legend={s.language}
              options={languageOptions}
              value={locale}
              onChange={(target) => target !== locale && goToLocale(target, pathname)}
            />
            <ChoiceGroup name="theme" legend={s.theme} options={themeOptions} value={settings.theme} onChange={(v) => update('theme', v)} />
            <ChoiceGroup name="text" legend={s.textSize} options={textOptions} value={settings.text} onChange={(v) => update('text', v)} />
            <ChoiceGroup
              name="contrast"
              legend={s.contrast}
              options={contrastOptions}
              value={settings.contrast}
              onChange={(v) => update('contrast', v)}
            />
            <ChoiceGroup name="motion" legend={s.motion} options={motionOptions} value={settings.motion} onChange={(v) => update('motion', v)} />
          </div>

          <div className={styles.foot}>
            <p className={styles.note}>{s.note}</p>
            <button type="button" className={styles.reset} onClick={reset}>
              {s.reset}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
