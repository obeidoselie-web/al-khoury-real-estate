'use client';

import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';

import type { AdvisorProfileRow } from '@/db/schema';
import { REGIONS } from '@/lib/types';

import styles from '../../admin.module.css';
import { useKeepValuesSubmit } from '../useKeepValuesSubmit';
import type { TeamFormState } from './actions';

type Action = (state: TeamFormState, form: FormData) => Promise<TeamFormState>;
const IDLE: TeamFormState = { status: 'idle' };

function Banner({ state }: { state: TeamFormState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <div
      key={state.at}
      role={state.status === 'error' ? 'alert' : 'status'}
      className={`${styles.banner} ${state.status === 'error' ? styles.bannerError : styles.bannerOk}`}
    >
      <div>
        {state.message}
        {state.password && (
          <>
            <br />
            Temporary password (shown once — share it privately):{' '}
            <code className={styles.secret}>{state.password}</code>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  errors,
  children,
  hint,
}: {
  name: string;
  label: string;
  errors?: Record<string, string | undefined>;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={`t-${name}`} className={styles.label}>
        {label}
      </label>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
      {errors?.[name] && (
        <p id={`t-${name}-error`} className={styles.error}>
          {errors[name]}
        </p>
      )}
    </div>
  );
}

const inputProps = (name: string, errors?: Record<string, string | undefined>) => ({
  id: `t-${name}`,
  name,
  className: styles.input,
  'aria-invalid': errors?.[name] ? true : undefined,
  'aria-describedby': errors?.[name] ? `t-${name}-error` : undefined,
});

/** Create (no `user`) or edit a staff account. */
export function UserForm({
  action,
  user,
}: {
  action: Action;
  user?: { name: string; email: string; role: string; active: boolean };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const onSubmit = useKeepValuesSubmit(formAction);
  const e = state.fieldErrors;
  const created = !user && state.status === 'saved';

  return (
    <form action={formAction} onSubmit={onSubmit} className={styles.section} noValidate>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <p className={styles.sectionHint}>Admins manage everything. Advisors manage their own listings and leads.</p>
      </div>
      <Banner state={state} />
      {created ? (
        <div className={styles.actions}>
          <Link href={`/admin/team/${state.userId}`} className={styles.btn}>
            Set up their public profile
          </Link>
          <Link href="/admin/team" className={`${styles.btn} ${styles.btnGhost}`}>
            Back to team
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.fields}>
            <Field name="name" label="Full name (English)" errors={e}>
              <input {...inputProps('name', e)} defaultValue={user?.name} autoComplete="off" />
            </Field>
            <Field name="email" label="Work email" errors={e} hint="Used to sign in.">
              <input {...inputProps('email', e)} type="email" defaultValue={user?.email} autoComplete="off" spellCheck={false} />
            </Field>
            <Field name="role" label="Role" errors={e}>
              <select {...inputProps('role', e)} defaultValue={user?.role ?? 'advisor'}>
                <option value="advisor">Advisor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          {user && (
            <label className={styles.check}>
              <input type="checkbox" name="active" defaultChecked={user.active} />
              Active (unticking signs them out and hides their profile)
            </label>
          )}
          <div>
            <button type="submit" className={`${styles.btn} ${styles.btnGold}`} disabled={pending}>
              {pending ? 'Saving…' : user ? 'Save account' : 'Add and create password'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

export function ResetPasswordForm({ action, canSignIn }: { action: (state: TeamFormState) => Promise<TeamFormState>; canSignIn: boolean }) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form action={formAction} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Password</h2>
        <p className={styles.sectionHint}>
          {canSignIn
            ? 'Generate a new temporary password if they forgot theirs. Their other sessions end.'
            : 'This account has no password yet, so it cannot sign in.'}
        </p>
      </div>
      <Banner state={state} />
      <div>
        <button type="submit" className={`${styles.btn} ${styles.btnGhost}`} disabled={pending}>
          {pending ? 'Generating…' : canSignIn ? 'Reset password' : 'Create password'}
        </button>
      </div>
    </form>
  );
}

export function ProfileForm({
  action,
  profile,
  regionLabels,
  isAdmin,
  aside,
}: {
  action: Action;
  profile: AdvisorProfileRow | null;
  regionLabels: Record<string, string>;
  isAdmin: boolean;
  aside?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const onSubmit = useKeepValuesSubmit(formAction);
  const e = state.fieldErrors;
  return (
    <form action={formAction} onSubmit={onSubmit} className={styles.section} noValidate>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Public profile</h2>
        <p className={styles.sectionHint}>
          Shown as the advisor card on property pages, with one-tap call and WhatsApp.
          {!profile && ' Not set up yet.'}
        </p>
      </div>
      <Banner state={state} />
      <div className={styles.fields2}>
        <Field name="nameAr" label="Name (Arabic)" errors={e}>
          <input {...inputProps('nameAr', e)} defaultValue={profile?.nameAr} dir="rtl" lang="ar" />
        </Field>
        <Field name="phoneDisplay" label="Mobile / WhatsApp" errors={e} hint="International format, e.g. +961 3 123 456.">
          <input {...inputProps('phoneDisplay', e)} defaultValue={profile?.phoneDisplay} type="tel" className={`${styles.input} ltr`} />
        </Field>
        <Field name="titleEn" label="Title (English)" errors={e}>
          <input {...inputProps('titleEn', e)} defaultValue={profile?.titleEn} placeholder="Advisor, Metn & Keserwan" />
        </Field>
        <Field name="titleAr" label="Title (Arabic)" errors={e}>
          <input {...inputProps('titleAr', e)} defaultValue={profile?.titleAr} dir="rtl" lang="ar" />
        </Field>
        <Field name="languagesEn" label="Languages spoken (English)" errors={e}>
          <input {...inputProps('languagesEn', e)} defaultValue={profile?.languagesEn} placeholder="Arabic, English, French" />
        </Field>
        <Field name="languagesAr" label="Languages spoken (Arabic)" errors={e}>
          <input {...inputProps('languagesAr', e)} defaultValue={profile?.languagesAr} dir="rtl" lang="ar" />
        </Field>
      </div>
      {isAdmin ? (
        <>
          <fieldset className={styles.field} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={styles.label}>Regions covered</legend>
            <p className={styles.hint}>Valuation requests and listings without an advisor in these regions go to this person.</p>
            <div className={styles.checks}>
              {REGIONS.map((r) => (
                <label key={r} className={styles.check}>
                  <input type="checkbox" name="regions" value={r} defaultChecked={profile?.regions.includes(r)} />
                  {regionLabels[r] ?? r}
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.fields}>
            <Field name="sortOrder" label="Order" errors={e} hint="Lower numbers come first.">
              <input {...inputProps('sortOrder', e)} defaultValue={profile?.sortOrder ?? 0} inputMode="numeric" />
            </Field>
          </div>
          <label className={styles.check}>
            <input type="checkbox" name="visible" defaultChecked={profile?.visible ?? true} />
            Show on the website
          </label>
        </>
      ) : (
        // Advisors keep their regions/visibility as set by an admin.
        <input type="hidden" name="visible" value={profile?.visible === false ? '' : 'on'} />
      )}
      <div className={styles.actions} style={{ justifyContent: 'space-between' }}>
        <button type="submit" className={`${styles.btn} ${styles.btnGold}`} disabled={pending}>
          {pending ? 'Saving…' : profile ? 'Save profile' : 'Create profile'}
        </button>
        {aside}
      </div>
    </form>
  );
}
