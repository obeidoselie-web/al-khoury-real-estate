import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS } from '@/lib/types';

import { ChevronDownIcon, HouseIcon, PinIcon, SearchIcon } from './icons';
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
        <label className={styles.field}>
          <PinIcon size={22} className={styles.fieldIcon} />
          <span className={styles.fieldText}>
            <span className={styles.label}>{s.where}</span>
            <select name="region" defaultValue="" className={styles.select}>
              <option value="">{s.whereAny}</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {t.regions[region]}
                </option>
              ))}
            </select>
          </span>
          <ChevronDownIcon size={16} className={styles.chevron} />
        </label>

        <span className={styles.divider} aria-hidden="true" />

        <label className={styles.field}>
          <HouseIcon size={22} className={styles.fieldIcon} />
          <span className={styles.fieldText}>
            <span className={styles.label}>{s.type}</span>
            <select name="type" defaultValue="" className={styles.select}>
              <option value="">{s.typeAny}</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t.types[type].short}
                </option>
              ))}
            </select>
          </span>
          <ChevronDownIcon size={16} className={styles.chevron} />
        </label>

        <button type="submit" className={styles.submit}>
          <SearchIcon size={18} />
          <span>{s.submit}</span>
        </button>
      </div>
    </form>
  );
}
