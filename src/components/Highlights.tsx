import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { plural } from '@/i18n/plural';
import { formatArea } from '@/lib/format';
import type { Listing } from '@/lib/types';

import styles from './Highlights.module.css';
import { AreaIcon, BathIcon, BedIcon, CalendarIcon, PlotIcon } from './icons';

type Source = Pick<Listing, 'type' | 'bedrooms' | 'bathrooms' | 'areaSqm' | 'plotSqm' | 'yearBuilt'>;

/** Icon + value facts ("5 beds", "420 m²") — the at-a-glance strip on spotlight and property pages. */
export function Highlights({ listing, locale, t, label }: { listing: Source; locale: Locale; t: Dictionary; label: string }) {
  const items: { key: string; icon: React.JSX.Element; text: string }[] = [];

  if (listing.bedrooms !== undefined) {
    items.push({
      key: 'beds',
      icon: <BedIcon size={22} />,
      text: listing.bedrooms === 0 ? t.card.studio : plural(locale, listing.bedrooms, t.card.beds),
    });
  }
  if (listing.bathrooms !== undefined && listing.type !== 'land') {
    items.push({ key: 'baths', icon: <BathIcon size={22} />, text: plural(locale, listing.bathrooms, t.card.baths) });
  }
  if (listing.areaSqm !== undefined) {
    items.push({
      key: 'area',
      icon: listing.type === 'land' ? <PlotIcon size={22} /> : <AreaIcon size={22} />,
      text: formatArea(listing.areaSqm, locale, t),
    });
  }
  if (listing.plotSqm !== undefined) {
    items.push({ key: 'plot', icon: <PlotIcon size={22} />, text: `${t.property.plotSize}: ${formatArea(listing.plotSqm, locale, t)}` });
  }
  if (listing.yearBuilt !== undefined) {
    items.push({ key: 'year', icon: <CalendarIcon size={22} />, text: `${t.property.yearBuilt}: ${listing.yearBuilt}` });
  }

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className={styles.item}>
          {item.icon}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
