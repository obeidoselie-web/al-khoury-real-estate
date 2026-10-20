import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { LOCALES, LOCALE_META, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import { APPEARANCE_INIT_SCRIPT } from '@/lib/appearance';
import { siteUrl } from '@/lib/company';
import { alternates } from '@/lib/seo';

import { arabicFont, brandFont, latinFont } from '../fonts';
import '../globals.css';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.siteTitle, template: `%s · ${t.company.name}` },
    description: t.meta.siteDescription,
    alternates: alternates(locale, '/'),
    openGraph: { siteName: t.company.name, type: 'website', locale: LOCALE_META[locale].ogLocale },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    // Appearance attributes are added by the inline script before hydration, hence suppressHydrationWarning.
    <html
      lang={locale}
      dir={LOCALE_META[locale].dir}
      className={`${latinFont.variable} ${brandFont.variable} ${arabicFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_INIT_SCRIPT }} />
      </head>
      <body>
        <I18nProvider locale={locale} dictionary={t}>
          <a className="skip-link" href="#main">
            {t.nav.skip}
          </a>
          <SiteHeader locale={locale} t={t} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter locale={locale} t={t} />
          <WhatsAppFab />
        </I18nProvider>
      </body>
    </html>
  );
}
