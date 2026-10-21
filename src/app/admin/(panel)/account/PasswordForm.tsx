'use client';

import { useActionState } from 'react';

import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';

import styles from '../../admin.module.css';
import { changePassword, type PasswordState } from './actions';

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, { status: 'idle' });
  const invalid = (field: PasswordState['field']) => (state.status === 'error' && state.field === field ? true : undefined);

  return (
    <form action={action} className={styles.section} noValidate>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Change password</h2>
        <p className={styles.sectionHint}>At least {PASSWORD_MIN_LENGTH} characters. A short sentence is easy to remember and hard to guess.</p>
      </div>
      {state.status !== 'idle' && (
        <p
          key={state.at}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`${styles.banner} ${state.status === 'error' ? styles.bannerError : styles.bannerOk}`}
        >
          {state.message}
        </p>
      )}
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="pw-current" className={styles.label}>
            Current password
          </label>
          <input id="pw-current" name="current" type="password" autoComplete="current-password" className={styles.input} aria-invalid={invalid('current')} />
        </div>
        <div className={styles.field}>
          <label htmlFor="pw-next" className={styles.label}>
            New password
          </label>
          <input
            id="pw-next"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            className={styles.input}
            aria-invalid={invalid('next')}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="pw-confirm" className={styles.label}>
            Repeat new password
          </label>
          <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" className={styles.input} aria-invalid={invalid('confirm')} />
        </div>
      </div>
      <div>
        <button type="submit" className={`${styles.btn}`} disabled={pending}>
          {pending ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
