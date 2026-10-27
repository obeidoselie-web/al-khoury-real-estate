/**
 * Contact details (phone, WhatsApp, email, founding year) are website settings, edited in
 * Admin → Website and read with getSiteSettings(); see src/lib/site.ts for the defaults.
 */
export { whatsappHref } from './site';

/** Absolute site origin for links that leave the site (WhatsApp messages, Open Graph). */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}
