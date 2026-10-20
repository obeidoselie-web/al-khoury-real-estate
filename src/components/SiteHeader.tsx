import Link from 'next/link';

import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';

import { AppearanceSettings } from './AppearanceSettings';
import { NavLink } from './NavLink';
import { Wordmark } from './Wordmark';
import styles from './SiteHeader.module.css';

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link
          href={localizedPath(locale)}
          className={styles.brand}
          aria-label={interpolate(t.nav.homeLabel, { name: t.company.name })}
        >
          <Wordmark id="header-mark" locale={locale} t={t} />
        </Link>
        <div className={styles.end}>
          <nav aria-label={t.nav.main}>
            <ul className={styles.nav}>
              <li>
                <NavLink href={localizedPath(locale, '/listings')} className={styles.link}>
                  {t.nav.properties}
                </NavLink>
              </li>
              <li>
                <NavLink href={localizedPath(locale, '/about')} className={styles.link}>
                  {t.nav.about}
                </NavLink>
              </li>
            </ul>
          </nav>
          <AppearanceSettings />
        </div>
      </div>
    </header>
  );
}
