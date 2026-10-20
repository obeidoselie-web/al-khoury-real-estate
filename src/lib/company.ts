/**
 * Language-independent company details. Translatable details (name, tagline, address, hours)
 * live in the dictionaries under `company`.
 * PLACEHOLDER values — replace with Al Khoury Real Estate's real details before launch.
 */
export const COMPANY = {
  founded: 1998,
  phone: {
    display: '+961 1 234 567',
    href: 'tel:+9611234567',
  },
  email: 'info@alkhoury-realestate.example',
  /** International format, digits only (country code first, no "+" or leading zeros), as wa.me expects. */
  whatsapp: '96170123456',
} as const;

/** A WhatsApp "click to chat" link with a pre-filled message. */
export function whatsappHref(message: string, number: string = COMPANY.whatsapp): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Absolute site origin for links that leave the site (WhatsApp messages, Open Graph). */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}
