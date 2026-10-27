import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS } from '@/lib/types';

import { Dropdown } from './Dropdown';
import { HouseIcon, PROPERTY_TYPE_ICONS, PinIcon, SearchIcon } from './icons';
import styles from './SearchCapsule.module.css';

/**
 * The home page's floating search: a one-tap Buy / Rent toggle, then "Where" and "Property type"
 * fields and a gold search button. A plain GET form to the listings page — it works without
 * JavaScript, and the listings page reads the same ?deal, ?region and ?type parameters.
 */
export function SearchCapsule({
  locale,
  t,
}: {
  locale: Locale;
  t: Pick<Dictionary, 'home' | 'deals' | 'types' | 'regions'>;
}) {
  const s = t.home.search;
  const dealOptions = [{ value: '', label: s.dealAny }, ...DEAL_TYPES.map((deal) => ({ value: deal, label: t.deals[deal].filter }))];

  return (
    <form action={localizedPath(locale, '/listings')} method="get" role="search" aria-label={s.label} className={styles.search}>
      <fieldset className={styles.toggle}>
        <legend className="sr-only">{s.deal}</legend>
        {dealOptions.map((option) => (
          <label key={option.value || 'any'} className={styles.toggleOption}>
            <input type="radio" name="deal" value={option.value} defaultChecked={option.value === ''} className={styles.toggleInput} />
            <span className={styles.togglePill}>{option.label}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.capsule}>
        <div className={styles.field}>
          <Dropdown
            name="region"
            label={s.where}
            caption={s.where}
            icon={<PinIcon size={22} />}
            defaultValue=""
            triggerClassName={styles.trigger}
            nativeClassName={styles.select}
            options={[
              { value: '', label: s.whereAny, icon: <PinIcon size={18} /> },
              ...REGIONS.map((region) => ({ value: region, label: t.regions[region], icon: <PinIcon size={18} /> })),
            ]}
          />
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div className={styles.field}>
          <Dropdown
            name="type"
            label={s.type}
            caption={s.type}
            icon={<HouseIcon size={22} />}
            defaultValue=""
            triggerClassName={styles.trigger}
            nativeClassName={styles.select}
            options={[
              { value: '', label: s.typeAny, icon: <TypeIcon type="all" /> },
              ...PROPERTY_TYPES.map((type) => ({ value: type, label: t.types[type].short, icon: <TypeIcon type={type} /> })),
            ]}
          />
        </div>

        <button type="submit" className={styles.submit}>
          <SearchIcon size={18} />
          <span>{s.submit}</span>
        </button>
      </div>
    </form>
  );
}

function TypeIcon({ type }: { type: keyof typeof PROPERTY_TYPE_ICONS }) {
  const Icon = PROPERTY_TYPE_ICONS[type];
  return <Icon size={18} />;
}
