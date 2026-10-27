import Link from 'next/link';

import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { telHref, type SiteSettings } from '@/lib/site';
import { listingsHref } from '@/lib/filters';

import { AppearanceSettings } from './AppearanceSettings';
import { PhoneIcon } from './icons';
import { NavLink } from './NavLink';
import { SavedLink } from './SavedLink';
import styles from './SiteHeader.module.css';
import { Wordmark } from './Wordmark';

/**
 * Logo · centred navigation · utilities (phone, saved, Enquire, language & appearance).
 * Secondary items drop away as the screen narrows, so the bar never wraps.
 */
export function SiteHeader({ locale, t, site }: { locale: Locale; t: Dictionary; site: SiteSettings }) {
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

        <nav aria-label={t.nav.main} className={styles.navArea}>
          <ul className={styles.nav}>
            <li>
              <NavLink href={localizedPath(locale, '/listings')} className={styles.link}>
                {t.nav.properties}
              </NavLink>
            </li>
            <li className={styles.wideOnly}>
              <Link href={listingsHref(locale, { deal: 'sale' })} className={styles.link}>
                {t.nav.buy}
              </Link>
            </li>
            <li className={styles.wideOnly}>
              <Link href={listingsHref(locale, { deal: 'rent' })} className={styles.link}>
                {t.nav.rent}
              </Link>
            </li>
            <li>
              <NavLink href={localizedPath(locale, '/about')} className={styles.link}>
                {/* Phones get the short label so the bar fits 360px screens; only one is displayed. */}
                <span className={styles.labelLong}>{t.nav.about}</span>
                <span className={styles.labelShort}>{t.nav.contact}</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={styles.end}>
          {site.header.showPhone && (
            <a href={telHref(site.contact.phone)} className={styles.phone}>
              <PhoneIcon size={18} />
              <span className="sr-only">{t.nav.callUs}: </span>
              <span className="ltr">{site.contact.phone}</span>
            </a>
          )}
          <SavedLink />
          <Link href={`${localizedPath(locale, '/about')}#contact`} className={styles.cta}>
            {t.nav.enquire}
          </Link>
          <AppearanceSettings />
        </div>
      </div>
    </header>
  );
}
