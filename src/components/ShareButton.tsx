'use client';

import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/I18nProvider';

import styles from './FavouriteButton.module.css';
import { ShareIcon } from './icons';

type Outcome = 'idle' | 'copied' | 'failed';

/**
 * Shares the current page: the system share sheet where the browser has one (phones), otherwise
 * the URL is copied to the clipboard and a polite status message says so.
 */
export function ShareButton({ title }: { title: string }) {
  const { t } = useI18n();
  const [outcome, setOutcome] = useState<Outcome>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function report(next: Outcome) {
    setOutcome(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOutcome('idle'), 5000);
  }

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Dismissing the share sheet is not an error; anything else falls back to copying.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      report('copied');
    } catch {
      report('failed');
    }
  }

  return (
    <span className={styles.shareWrap}>
      <button type="button" className={styles.page} onClick={share}>
        <ShareIcon size={18} className={styles.icon} />
        {t.property.share}
      </button>
      <span role="status" className={outcome === 'idle' ? 'sr-only' : styles.status}>
        {outcome === 'copied' ? t.property.shareCopied : outcome === 'failed' ? t.property.shareFailed : ''}
      </span>
    </span>
  );
}
