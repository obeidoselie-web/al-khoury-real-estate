import Link from 'next/link';

import { LOCALES, LOCALE_META, localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { COMPANY } from '@/lib/company';
import { listingsHref } from '@/lib/filters';

import { LanguageLink } from './NavLink';
import styles from './SiteFooter.module.css';

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <p className={styles.name}>{t.company.name}</p>
          <p className={styles.muted}>{t.company.tagline}</p>
        </div>
        <nav aria-label={t.nav.footer}>
          <h2 className={styles.heading}>{t.nav.browse}</h2>
          <ul className={styles.list}>
            <li>
              <Link href={listingsHref(locale, { deal: 'sale' })}>{t.nav.buy}</Link>
            </li>
            <li>
              <Link href={listingsHref(locale, { deal: 'rent' })}>{t.nav.rent}</Link>
            </li>
            <li>
              <Link href={localizedPath(locale, '/about')}>{t.nav.aboutUs}</Link>
            </li>
          </ul>
        </nav>
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
        <div>
          <h2 className={styles.heading}>{t.nav.language}</h2>
          <ul className={styles.list}>
            {LOCALES.map((l) => (
              <li key={l}>
                {l === locale ? (
                  <span aria-current="true" className={styles.currentLang} lang={l}>
                    {LOCALE_META[l].label}
                  </span>
                ) : (
                  <LanguageLink locale={l} label={LOCALE_META[l].label} />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`container ${styles.legal}`}>
        <p>
          © {new Date().getFullYear()} {t.company.name}. {t.nav.legal}
        </p>
      </div>
    </footer>
  );
}
