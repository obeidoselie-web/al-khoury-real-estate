import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { whatsappHref } from '@/lib/company';
import { initials, type Advisor } from '@/lib/data/advisors';

import styles from './AdvisorCard.module.css';
import { ChatIcon, PhoneIcon } from './icons';

/** The advisor responsible for a listing, with one-tap call and WhatsApp. */
export function AdvisorCard({
  advisor,
  locale,
  t,
  whatsappMessage,
}: {
  advisor: Advisor;
  locale: Locale;
  t: Dictionary;
  whatsappMessage: string;
}) {
  const p = t.property;
  const name = advisor.name[locale];

  return (
    <div className={styles.card}>
      <p className={styles.kicker}>{p.advisorTitle}</p>
      <div className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(name)}
        </span>
        <div className={styles.text}>
          <p className={styles.name}>{name}</p>
          <p className={styles.meta}>{advisor.role[locale]}</p>
          <p className={styles.meta}>{interpolate(p.advisorLanguages, { languages: advisor.languages[locale] })}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <a href={advisor.phone.href} className={styles.action} aria-label={interpolate(p.advisorCall, { name })}>
          <PhoneIcon size={18} />
          <span className="ltr">{advisor.phone.display}</span>
        </a>
        <a
          href={whatsappHref(whatsappMessage, advisor.whatsapp)}
          className={styles.action}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={interpolate(p.advisorWhatsapp, { name })}
        >
          <ChatIcon size={18} />
          {p.whatsapp}
        </a>
      </div>
    </div>
  );
}
