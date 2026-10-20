import Link from 'next/link';

import { LOCALES, LOCALE_META, localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { COMPANY, whatsappHref } from '@/lib/company';
import { listingsHref } from '@/lib/filters';
import { PROPERTY_TYPES } from '@/lib/types';

import { ChatIcon, GlobeIcon, MailIcon, PhoneIcon } from './icons';
import { LanguageLink } from './NavLink';
import styles from './SiteFooter.module.css';
import { Wordmark } from './Wordmark';

/**
 * Compact brand-black footer: logo and quick contact, two link groups set as inline rows,
 * then a slim bar with copyright, address and the language switch.
 */
export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const browse = [
    { href: listingsHref(locale, { deal: 'sale' }), label: t.nav.buy },
    { href: listingsHref(locale, { deal: 'rent' }), label: t.nav.rent },
    ...PROPERTY_TYPES.map((type) => ({ href: listingsHref(locale, { type }), label: t.types[type].short })),
  ];
  const company = [
    { href: localizedPath(locale, '/about'), label: t.nav.aboutUs },
    { href: localizedPath(locale, '/sell'), label: t.nav.listProperty },
    { href: localizedPath(locale, '/saved'), label: t.saved.nav },
    { href: `${localizedPath(locale, '/about')}#contact`, label: t.nav.contact },
  ];

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Wordmark id="footer-mark" locale={locale} t={t} size="footer" />
          <p className={styles.tagline}>
            <span className="sr-only">{t.company.name}. </span>
            {t.company.tagline}
          </p>
        </div>
        <ul className={styles.contact} aria-label={t.nav.contact}>
          <li>
            <a href={COMPANY.phone.href} className={styles.chip}>
              <PhoneIcon size={16} />
              <span className="ltr">{COMPANY.phone.display}</span>
            </a>
          </li>
          <li>
            <a href={whatsappHref(t.nav.whatsappHello)} className={styles.chip} target="_blank" rel="noopener noreferrer">
              <ChatIcon size={16} />
              {t.property.whatsapp}
            </a>
          </li>
          <li>
            <a href={`mailto:${COMPANY.email}`} className={styles.chip} aria-label={`${t.contact.email}: ${COMPANY.email}`}>
              <MailIcon size={16} />
              {t.contact.email}
            </a>
          </li>
        </ul>
      </div>

      <nav aria-label={t.nav.footer} className={`container ${styles.links}`}>
        <div className={styles.group}>
          <h2 className={styles.heading}>{t.nav.browse}</h2>
          <ul className={styles.list}>
            {browse.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.group}>
          <h2 className={styles.heading}>{t.nav.aboutUs}</h2>
          <ul className={styles.list}>
            {company.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.legal}>
          © {new Date().getFullYear()} {t.company.name}
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          {t.company.address.slice(0, 2).join(locale === 'ar' ? '، ' : ', ')}
          <span className={styles.note}>{t.nav.legal}</span>
        </p>
        <div className={styles.language} role="group" aria-label={t.nav.language}>
          <GlobeIcon size={16} />
          {LOCALES.map((l) =>
            l === locale ? (
              <span key={l} lang={l} aria-current="true" className={styles.langCurrent}>
                {LOCALE_META[l].label}
              </span>
            ) : (
              <LanguageLink key={l} locale={l} label={LOCALE_META[l].label} className={styles.langLink} />
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
