import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDictionary } from '@/i18n/dictionaries';
import { getTeamMember } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../../admin.module.css';
import { ConfirmButton } from '../../ConfirmButton';
import { removeProfile, resetPassword, saveProfile, updateUser } from '../actions';
import { ProfileForm, ResetPasswordForm, UserForm } from '../TeamForms';

export const metadata: Metadata = { title: 'Staff member' };

export default async function TeamMemberPage({ params }: PageProps<'/admin/team/[id]'>) {
  await requireUser('admin');
  const { id } = await params;
  const member = await getTeamMember(id);
  if (!member) notFound();
  const { user, profile } = member;

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <Link href="/admin/team" className={styles.crumb}>
            ‹ Team
          </Link>
          <h1 className={styles.pageTitle}>{user.name}</h1>
          <p className={styles.pageSub}>{user.email}</p>
        </div>
      </header>
      <div className={styles.form}>
        <UserForm action={updateUser.bind(null, user.id)} user={user} />
        <ResetPasswordForm action={resetPassword.bind(null, user.id)} canSignIn={user.canSignIn} />
        <ProfileForm
          action={saveProfile.bind(null, user.id)}
          profile={profile}
          regionLabels={getDictionary('en').regions}
          isAdmin
          aside={
            profile ? (
              <ConfirmButton
                action={removeProfile.bind(null, user.id)}
                message={`Remove ${user.name}'s public profile? Their listings will show the regional advisor instead.`}
                className={`${styles.btn} ${styles.btnDanger}`}
              >
                Remove profile
              </ConfirmButton>
            ) : null
          }
        />
      </div>
    </>
  );
}
