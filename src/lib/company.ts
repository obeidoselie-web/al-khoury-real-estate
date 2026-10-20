/**
 * Company details shown in the header, footer, property pages and About/Contact.
 * PLACEHOLDER values — replace with Al Khoury Real Estate's real details before launch.
 */
export const COMPANY = {
  name: 'Al Khoury Real Estate',
  shortName: 'Al Khoury',
  tagline: 'Homes, workplaces and land across Lebanon.',
  founded: 1998,
  phone: {
    display: '+961 1 234 567',
    href: 'tel:+9611234567',
  },
  email: 'info@alkhoury-realestate.example',
  address: {
    lines: ['Charles Malek Avenue', 'Achrafieh, Beirut', 'Lebanon'],
  },
  hours: [
    { days: 'Monday – Friday', time: '9:00 – 18:00' },
    { days: 'Saturday', time: '10:00 – 14:00' },
  ],
} as const;
