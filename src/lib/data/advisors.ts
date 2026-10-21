import type { Locale } from '@/i18n/config';

import type { Region } from '../types';

/*
 * Public advisor profile shape. Live profiles come from the database (Admin → Team); the list below is
 * only the PLACEHOLDER seed data.
 *
 * PLACEHOLDER advisors — fictional names used to demonstrate the advisor card. Replace with the real
 * Al Khoury team (and their photos, if wanted) before launch. Each advisor covers a set of regions.
 */
export interface Advisor {
  id: string;
  name: Record<Locale, string>;
  role: Record<Locale, string>;
  /** Language names in each UI language. */
  languages: Record<Locale, string>;
  phone: { display: string; href: string };
  /** International digits only, as wa.me expects. */
  whatsapp: string;
  regions: Region[];
}

export const ADVISORS: Advisor[] = [
  {
    id: 'nadine',
    name: { en: 'Nadine Azar', ar: 'نادين عازار' },
    role: { en: 'Senior advisor, Beirut', ar: 'مستشارة أولى، بيروت' },
    languages: { en: 'Arabic, English, French', ar: 'العربية والإنجليزية والفرنسية' },
    phone: { display: '+961 3 111 222', href: 'tel:+9613111222' },
    whatsapp: '9613111222',
    regions: ['beirut'],
  },
  {
    id: 'karim',
    name: { en: 'Karim Haddad', ar: 'كريم حداد' },
    role: { en: 'Advisor, Metn & Keserwan', ar: 'مستشار، المتن وكسروان' },
    languages: { en: 'Arabic, English', ar: 'العربية والإنجليزية' },
    phone: { display: '+961 3 333 444', href: 'tel:+9613333444' },
    whatsapp: '9613333444',
    regions: ['metn', 'keserwan'],
  },
  {
    id: 'maya',
    name: { en: 'Maya Saad', ar: 'مايا سعد' },
    role: { en: 'Advisor, North & Bekaa', ar: 'مستشارة، الشمال والبقاع' },
    languages: { en: 'Arabic, English, French', ar: 'العربية والإنجليزية والفرنسية' },
    phone: { display: '+961 3 555 666', href: 'tel:+9613555666' },
    whatsapp: '9613555666',
    regions: ['batroun', 'koura', 'bekaa'],
  },
];

/** The advisor who covers a region (falls back to the first advisor). */
export function advisorForRegion<A extends Pick<Advisor, 'regions'>>(region: Region, advisors: readonly A[]): A;
export function advisorForRegion(region: Region): Advisor;
export function advisorForRegion(region: Region, advisors: readonly Pick<Advisor, 'regions'>[] = ADVISORS) {
  return advisors.find((advisor) => advisor.regions.includes(region)) ?? advisors[0];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}
