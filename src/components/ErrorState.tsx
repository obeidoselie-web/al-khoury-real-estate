'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { localizedPath } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';

import styles from './StatusPage.module.css';

interface ErrorStateProps {
  variant: 'listings' | 'generic';
  onRetry: () => void;
}

/** Shared UI for route error boundaries: explains, offers a retry, and a way out. */
export function ErrorState({ variant, onRetry }: ErrorStateProps) {
  const { locale, t, contact } = useI18n();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = variant === 'listings' ? t.errors.listingsTitle : t.errors.genericTitle;
  const message = variant === 'listings' ? t.errors.listingsText : t.errors.genericText;
  const [before, after = ''] = t.errors.stillNot.split('{phone}');

  // Move focus to the message so keyboard and screen-reader users know the page changed.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={`container ${styles.wrap}`} role="alert">
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className="button" onClick={onRetry}>
          {t.errors.retry}
        </button>
        <Link href={localizedPath(locale)} className="text-link">
          {t.errors.home}
        </Link>
      </div>
      <p className={styles.small}>
        {before}
        <a href={contact.phoneHref} className="ltr">
          {contact.phone}
        </a>
        {after}
      </p>
    </div>
  );
}
