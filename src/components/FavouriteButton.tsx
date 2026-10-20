'use client';

import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { toggleFavourite, useFavourites } from '@/lib/favourites';

import styles from './FavouriteButton.module.css';
import { HeartIcon } from './icons';

interface FavouriteButtonProps {
  id: string;
  title: string;
  t: Pick<Dictionary, 'saved'>;
  /** "card": a round heart over the photo. "page": a labelled pill beside Share on the property page. */
  variant?: 'card' | 'page';
}

/**
 * Save / unsave toggle. The accessible name stays fixed ("Save {title}") and aria-pressed carries the
 * state, which screen readers announce as "toggle button, pressed / not pressed".
 */
export function FavouriteButton({ id, title, t, variant = 'card' }: FavouriteButtonProps) {
  const saved = useFavourites().includes(id);
  const label = interpolate(t.saved.toggle, { title });

  return (
    <button
      type="button"
      className={variant === 'card' ? styles.card : styles.page}
      aria-pressed={saved}
      aria-label={label}
      onClick={() => toggleFavourite(id)}
    >
      <HeartIcon size={variant === 'card' ? 24 : 18} filled={saved} className={styles.icon} />
      {variant === 'page' && <span aria-hidden="true">{t.saved.save}</span>}
    </button>
  );
}
