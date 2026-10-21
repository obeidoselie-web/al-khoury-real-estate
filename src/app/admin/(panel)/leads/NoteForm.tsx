'use client';

import { useActionState } from 'react';

import styles from '../../admin.module.css';
import { addNote, type NoteState } from './actions';

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<NoteState, FormData>(addNote.bind(null, leadId), {});
  return (
    <form action={action} className={styles.form} style={{ gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
      <label htmlFor="note-body" className={styles.label}>
        Add a note
      </label>
      <textarea
        id="note-body"
        name="body"
        rows={3}
        className={styles.input}
        placeholder="Called back, booked a viewing for Saturday…"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? 'note-error' : 'note-hint'}
        dir="auto"
      />
      {state.error ? (
        <p id="note-error" className={styles.error} role="alert">
          {state.error}
        </p>
      ) : (
        <p id="note-hint" className={styles.hint}>
          Visible to staff only. A first note on a new lead marks it as contacted.
        </p>
      )}
      <div>
        <button type="submit" className={styles.btn} disabled={pending}>
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </form>
  );
}
