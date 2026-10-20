'use client';

import { usePathname } from 'next/navigation';

import { useI18n } from '@/i18n/I18nProvider';
import { whatsappHref } from '@/lib/company';

import { ChatIcon } from './icons';
import styles from './WhatsAppFab.module.css';

/**
 * Floating "Chat on WhatsApp" button — how most Lebanese buyers prefer to reach an agent.
 * Hidden on property pages, which have their own WhatsApp action (with the property pre-filled).
 */
export function WhatsAppFab() {
  const { t } = useI18n();
  const pathname = usePathname() ?? '';
  if (/^\/[a-z]{2}\/listings\/[^/]+$/.test(pathname)) return null;

  return (
    <a
      href={whatsappHref(t.nav.whatsappHello)}
      className={styles.fab}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.nav.whatsappChat}
      title={t.nav.whatsappChat}
    >
      <ChatIcon size={28} />
    </a>
  );
}
