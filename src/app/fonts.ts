import { Cairo, DM_Sans, Montserrat } from 'next/font/google';

/*
 * Fonts are downloaded at build time and self-hosted by next/font: no request to Google at runtime,
 * and size-adjusted fallbacks avoid layout shift while they load.
 */

/**
 * Latin UI and reading text: DM Sans — a geometric sans with a variable weight axis, the recommended
 * open substitute for the custom geometric sans the design reference is built on.
 */
export const latinFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-latin',
});

/**
 * Arabic text: Cairo — a contemporary Kufi-based Arabic sans (variable weight), widely used on
 * Arabic-language sites and well matched to the geometric Latin type.
 * Not preloaded, so English pages never download it; Arabic pages fetch it on first paint.
 */
export const arabicFont = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  preload: false,
  variable: '--font-arabic',
});

/** Brand wordmark ("AL KHOURY / REAL ESTATE"): Montserrat, matching the logo lettering. */
export const brandFont = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-brand',
});
