import Link from 'next/link';

import { LOCALES, LOCALE_META, localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { COMPANY } from '@/lib/company';
import { listingsHref } from '@/lib/filters';
import { PROPERTY_TYPES } from '@/lib/types';

import { GlobeIcon } from './icons';
import { LanguageLink } from './NavLink';
import styles from './SiteFooter.module.css';
import { Wordmark } from './Wordmark';

/** Link columns on the canvas grey, then a bottom bar with copyright and the language selector. */
export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const other = LOCALES.find((l) => l !== locale) ?? locale;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Wordmark id="footer-mark" locale={locale} t={t} size="footer" />
          <p className={styles.muted}>
            <span className="sr-only">{t.company.name}. </span>
            {t.company.tagline}
          </p>
        </div>
        <nav aria-label={t.nav.footer} className={styles.columns}>
          <div>
            <h2 className={styles.heading}>{t.nav.browse}</h2>
            <ul className={styles.list}>
              <li>
                <Link href={listingsHref(locale, { deal: 'sale' })}>{t.nav.buy}</Link>
              </li>
              <li>
                <Link href={listingsHref(locale, { deal: 'rent' })}>{t.nav.rent}</Link>
              </li>
              {PROPERTY_TYPES.map((type) => (
                <li key={type}>
                  <Link href={listingsHref(locale, { type })}>{t.types[type].short}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={styles.heading}>{t.nav.aboutUs}</h2>
            <ul className={styles.list}>
              <li>
                <Link href={localizedPath(locale, '/about')}>{t.nav.about}</Link>
              </li>
              <li>
                <Link href={`${localizedPath(locale, '/about')}#contact`}>{t.nav.contact}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={styles.heading}>{t.nav.contact}</h2>
            <ul className={styles.list}>
              <li>
                <a href={COMPANY.phone.href} className="ltr">
                  {COMPANY.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="ltr">
                  {COMPANY.email}
                </a>
              </li>
              <li className={styles.muted}>{t.company.address.slice(0, 2).join(locale === 'ar' ? '، ' : ', ')}</li>
            </ul>
          </div>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.legal}>
          © {new Date().getFullYear()} {t.company.name} · {t.nav.legal}
        </p>
        <div className={styles.language}>
          <GlobeIcon size={16} />
          <span className="sr-only">{t.nav.language}: </span>
          <span lang={locale} className={styles.currentLang}>
            {LOCALE_META[locale].label}
          </span>
          <span aria-hidden="true">·</span>
          <LanguageLink locale={other} label={LOCALE_META[other].label} className={styles.langLink} />
        </div>
      </div>
    </footer>
  );
}
