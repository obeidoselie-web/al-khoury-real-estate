'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { localizedPath } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import { plural } from '@/i18n/plural';
import { pruneFavourites, useFavourites, useHydrated } from '@/lib/favourites';
import type { ListingSummary } from '@/lib/types';

import { HeartIcon } from './icons';
import { ListingGrid } from './ListingGrid';
import styles from './SavedListings.module.css';

/**
 * The saved-properties list. Saved ids live only in this browser, so the page server-renders every
 * listing summary and this island picks out the saved ones after hydration.
 *
 * A card that is unsaved here stays on screen (with an empty heart) until the visitor leaves the page:
 * a mis-tap can be undone, and keyboard focus is never dropped because a card vanished.
 */
export function SavedListings({ listings }: { listings: ListingSummary[] }) {
  const { locale, t } = useI18n();
  const ids = useFavourites();
  const hydrated = useHydrated();

  const [shown, setShown] = useState<readonly string[]>(ids);
  const added = ids.filter((id) => !shown.includes(id));
  if (added.length > 0) setShown([...added, ...shown]); // newly saved (e.g. in another tab) go first

  useEffect(() => {
    if (hydrated) pruneFavourites(listings.map((listing) => listing.id));
  }, [hydrated, listings]);

  const byId = useMemo(() => new Map(listings.map((listing) => [listing.id, listing])), [listings]);
  const visible = shown.flatMap((id) => byId.get(id) ?? []);

  if (!hydrated) {
    return (
      <p className="sr-only" role="status">
        {t.saved.loading}
      </p>
    );
  }

  return (
    <>
      <p className={styles.count} role="status" aria-live="polite" aria-atomic="true">
        {ids.length > 0 ? plural(locale, ids.length, t.saved.count) : ''}
      </p>
      {visible.length > 0 ? (
        <ListingGrid listings={visible} locale={locale} t={t} priorityCount={3} label={t.saved.listLabel} headingLevel="h2" />
      ) : (
        <div className={styles.empty}>
          <HeartIcon size={32} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>{t.saved.emptyTitle}</h2>
          <p className={styles.emptyText}>{t.saved.emptyText}</p>
          <Link href={localizedPath(locale, '/listings')} className="button button-inverse">
            {t.saved.browse}
          </Link>
        </div>
      )}
    </>
  );
}
