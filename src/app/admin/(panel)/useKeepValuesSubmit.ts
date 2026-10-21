'use client';

import { startTransition, type FormEvent } from 'react';

/**
 * React resets a form after its `action` runs, which snaps selects back to their first option and
 * wipes what was typed when the server rejects it. Editing forms submit through this handler
 * instead, so the fields keep showing exactly what was saved (or what needs fixing).
 * Without JavaScript the form still posts natively through its `action`.
 */
export function useKeepValuesSubmit(formAction: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  };
}
