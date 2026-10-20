'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { localizedPath } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import { plural } from '@/i18n/plural';
import { useFavourites } from '@/lib/favourites';

import { HeartIcon } from './icons';
import styles from './SavedLink.module.css';

/** Header link to the saved-properties page, with a live count badge. */
export function SavedLink() {
  const { locale, t } = useI18n();
  const count = useFavourites().length;
  const href = localizedPath(locale, '/saved');
  const isCurrent = (usePathname() ?? '') === href;

  return (
    <Link href={href} className={styles.link} aria-current={isCurrent ? 'page' : undefined}>
      <HeartIcon size={20} className={styles.icon} />
      <span className={styles.label}>{t.saved.nav}</span>
      {count > 0 && (
        <>
          <span className={styles.badge} aria-hidden="true">
            {count}
          </span>
          <span className="sr-only">, {plural(locale, count, t.saved.count)}</span>
        </>
      )}
    </Link>
  );
}
