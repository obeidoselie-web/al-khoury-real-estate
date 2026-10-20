import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

import { BrandMark } from './BrandMark';
import styles from './Wordmark.module.css';

interface WordmarkProps {
  id: string;
  locale: Locale;
  t: Pick<Dictionary, 'company'>;
  size?: 'header' | 'footer';
}

/**
 * Logo lock-up: the gold "lk" mark on a black tile, plus "AL KHOURY / REAL ESTATE"
 * (or "الخوري / للعقارات"), set like the brand artwork. Decorative: the surrounding link names it.
 */
export function Wordmark({ id, locale, t, size = 'header' }: WordmarkProps) {
  return (
    <span className={`${styles.lockup} ${styles[size]}`} aria-hidden="true">
      <span className={styles.tile}>
        <BrandMark id={id} className={styles.mark} />
      </span>
      <span className={styles.text} data-locale={locale}>
        <span className={styles.name}>{t.company.shortName}</span>
        <span className={styles.suffix}>{t.company.wordmarkSuffix}</span>
      </span>
    </span>
  );
}
