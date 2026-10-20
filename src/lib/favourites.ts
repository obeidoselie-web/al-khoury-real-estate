import { useSyncExternalStore } from 'react';

/**
 * Saved properties ("favourites"), stored per device in localStorage as a JSON array of listing ids,
 * most recently saved first. There are no accounts, so nothing leaves the browser.
 *
 * A tiny external store: components read it through `useFavourites()` (useSyncExternalStore), every
 * heart and the header count stay in sync, and changes made in another tab arrive via the `storage` event.
 * If storage is blocked (private mode), saving still works for the current page view.
 */
export const FAVOURITES_STORAGE_KEY = 'ak-saved';

/** Same shape as listing ids accepted by the data layer. */
const ID_PATTERN = /^[a-z0-9-]{1,120}$/;
const MAX_SAVED = 200;
const EMPTY: readonly string[] = Object.freeze([]);

/** Parses stored JSON defensively: invalid ids and duplicates are dropped, the list is capped. */
export function parseFavourites(raw: string | null | undefined): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const ids = data.filter((id): id is string => typeof id === 'string' && ID_PATTERN.test(id));
    return [...new Set(ids)].slice(0, MAX_SAVED);
  } catch {
    // Corrupt storage: start empty.
    return EMPTY;
  }
}

let current: readonly string[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    return parseFavourites(window.localStorage.getItem(FAVOURITES_STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

function write(ids: readonly string[]): void {
  current = ids;
  try {
    if (ids.length === 0) window.localStorage.removeItem(FAVOURITES_STORAGE_KEY);
    else window.localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private mode / blocked storage: keep the in-memory list for this page view.
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== FAVOURITES_STORAGE_KEY && event.key !== null) return;
  current = parseFavourites(event.newValue);
  listeners.forEach((listener) => listener());
}

export function getFavourites(): readonly string[] {
  if (current === null) current = read();
  return current;
}

export function isFavourite(id: string): boolean {
  return getFavourites().includes(id);
}

/** Saves or unsaves a listing; returns whether it is now saved. */
export function toggleFavourite(id: string): boolean {
  if (!ID_PATTERN.test(id)) return false;
  const ids = getFavourites();
  if (ids.includes(id)) {
    write(ids.filter((saved) => saved !== id));
    return false;
  }
  write([id, ...ids].slice(0, MAX_SAVED));
  return true;
}

/** Drops ids that no longer match a listing (sold, let or withdrawn). */
export function pruneFavourites(knownIds: Iterable<string>): void {
  const known = new Set(knownIds);
  const ids = getFavourites();
  const kept = ids.filter((id) => known.has(id));
  if (kept.length !== ids.length) write(kept);
}

export function subscribeFavourites(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

/** Test seam: forget the in-memory copy so the next read comes from storage again. */
export function resetFavouritesCache(): void {
  current = null;
}

/**
 * The saved ids. The server render (and the hydration pass) sees an empty list, so markup always
 * matches; the stored list appears immediately after hydration.
 */
export function useFavourites(): readonly string[] {
  return useSyncExternalStore(subscribeFavourites, getFavourites, () => EMPTY);
}

const noopSubscribe = () => () => {};

/** False during the server render and hydration, true afterwards (avoids flashing an empty state). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
