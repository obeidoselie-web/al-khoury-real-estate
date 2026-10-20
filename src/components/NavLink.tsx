'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { LOCALE_COOKIE, switchLocalePath, type Locale } from '@/i18n/config';

/** Header link that marks the current section with aria-current for screen readers and styling. */
export function NavLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isCurrent = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={isCurrent ? 'page' : undefined}>
      {children}
    </Link>
  );
}

/** Link to the current page in another language (used in the footer). */
export function LanguageLink({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname() ?? '/';
  return (
    <a
      href={switchLocalePath(pathname, locale)}
      hrefLang={locale}
      lang={locale}
      className={className}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      {label}
    </a>
  );
}
