'use client';

import Link from 'next/link';

import { localizedPath } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';

import styles from './StatusPage.module.css';

/**
 * Client component because not-found files don't receive route params;
 * the locale comes from the layout's I18nProvider instead.
 */
export function NotFoundState({ variant }: { variant: 'page' | 'property' }) {
  const { locale, t } = useI18n();
  const title = variant === 'property' ? t.property.notFoundTitle : t.errors.notFoundTitle;
  const message = variant === 'property' ? t.property.notFoundText : t.errors.notFoundText;

  return (
    <div className={`container ${styles.wrap}`}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <Link href={localizedPath(locale, '/listings')} className="button">
          {t.errors.browse}
        </Link>
        <Link href={`${localizedPath(locale, '/about')}#contact`} className="text-link">
          {t.errors.contactUs}
        </Link>
      </div>
    </div>
  );
}
