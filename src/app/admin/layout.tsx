import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { appearanceInitScript } from '@/lib/appearance';
import { getSiteSettings } from '@/lib/data/site-store';

import { arabicFont, brandFont, latinFont } from '../fonts';
import '../globals.css';

/** Root layout for the staff admin (English UI; listing text is edited in both languages). */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Al Khoury Admin' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0b0c' };

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const site = await getSiteSettings();
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${latinFont.variable} ${brandFont.variable} ${arabicFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Same appearance preferences (theme, text size, contrast) as the public site. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript(site.appearance.defaultTheme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
