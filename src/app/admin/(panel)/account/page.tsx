import type { Metadata } from 'next';

import { getDictionary } from '@/i18n/dictionaries';
import { getTeamMember } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';
import { saveProfile } from '../team/actions';
import { ProfileForm } from '../team/TeamForms';
import { PasswordForm } from './PasswordForm';

export const metadata: Metadata = { title: 'My account' };

export default async function AccountPage() {
  const me = await requireUser();
  const member = await getTeamMember(me.id);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>My account</h1>
          <p className={styles.pageSub}>
            {me.name} · {me.email} · <span style={{ textTransform: 'capitalize' }}>{me.role}</span>
          </p>
        </div>
      </header>
      <div className={styles.form}>
        <PasswordForm />
        <ProfileForm
          action={saveProfile.bind(null, me.id)}
          profile={member?.profile ?? null}
          regionLabels={getDictionary('en').regions}
          isAdmin={me.role === 'admin'}
        />
      </div>
    </>
  );
}
