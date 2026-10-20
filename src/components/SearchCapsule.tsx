import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { DEAL_TYPES, PROPERTY_TYPES } from '@/lib/types';

import { SearchIcon } from './icons';
import styles from './SearchCapsule.module.css';

/**
 * The home page's floating search capsule: two segments and a round gold search button.
 * A plain GET form to the listings page — works without JavaScript, and the listings page
 * reads the same ?deal & ?type parameters the filters use.
 */
export function SearchCapsule({ locale, t }: { locale: Locale; t: Pick<Dictionary, 'home' | 'deals' | 'types'> }) {
  const s = t.home.search;
  return (
    <form action={localizedPath(locale, '/listings')} method="get" role="search" aria-label={s.label} className={styles.capsule}>
      <label className={styles.segment}>
        <span className={styles.label}>{s.deal}</span>
        <select name="deal" defaultValue="" className={styles.select}>
          <option value="">{s.dealAny}</option>
          {DEAL_TYPES.map((deal) => (
            <option key={deal} value={deal}>
              {t.deals[deal].filter}
            </option>
          ))}
        </select>
      </label>
      <span className={styles.divider} aria-hidden="true" />
      <label className={styles.segment}>
        <span className={styles.label}>{s.type}</span>
        <select name="type" defaultValue="" className={styles.select}>
          <option value="">{s.typeAny}</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t.types[type].short}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={styles.submit}>
        <SearchIcon size={16} />
        <span className={styles.submitText}>{s.submit}</span>
      </button>
    </form>
  );
}
