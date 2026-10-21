import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/session';

import styles from '../../../admin.module.css';
import { createUser } from '../actions';
import { UserForm } from '../TeamForms';

export const metadata: Metadata = { title: 'Add staff member' };

export default async function NewTeamMemberPage() {
  await requireUser('admin');
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <Link href="/admin/team" className={styles.crumb}>
            ‹ Team
          </Link>
          <h1 className={styles.pageTitle}>Add staff member</h1>
          <p className={styles.pageSub}>A temporary password is generated for them; they can change it under My account.</p>
        </div>
      </header>
      <UserForm action={createUser} />
    </>
  );
}
