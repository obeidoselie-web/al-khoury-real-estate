import type { Metadata } from 'next';
import Link from 'next/link';

import { PlusIcon } from '@/components/icons';
import { timeAgo } from '@/lib/admin/format';
import { listTeam } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  const me = await requireUser('admin');
  const team = await listTeam();

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Team & advisors</h1>
          <p className={styles.pageSub}>Staff accounts, and the advisor profiles the website shows on property pages.</p>
        </div>
        <Link href="/admin/team/new" className={`${styles.btn} ${styles.btnGold}`}>
          <PlusIcon size={16} />
          Add staff member
        </Link>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">Staff accounts</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col" className={styles.hideSm}>
                On the website
              </th>
              <th scope="col" className={styles.hideSm}>
                Live listings
              </th>
              <th scope="col" className={styles.hideSm}>
                Last sign-in
              </th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/admin/team/${m.id}`} className={styles.rowLink}>
                    {m.name}
                  </Link>
                  {m.id === me.id && <span className={styles.muted}> (you)</span>}
                  <div className={styles.muted}>{m.email}</div>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                <td>
                  {!m.active ? (
                    <span className={`${styles.pill} ${styles.pill_inactive}`}>Inactive</span>
                  ) : m.canSignIn ? (
                    <span className={`${styles.pill} ${styles.pill_published}`}>Active</span>
                  ) : (
                    <span className={`${styles.pill} ${styles.pill_new}`}>No password</span>
                  )}
                </td>
                <td className={styles.hideSm}>
                  {m.profile ? (m.profile.visible && m.active ? 'Advisor card shown' : 'Profile hidden') : <span className={styles.muted}>No profile</span>}
                </td>
                <td className={`${styles.hideSm} ${styles.num}`}>{m.publishedListings}</td>
                <td className={`${styles.hideSm} ${styles.muted} ${styles.nowrap}`}>{m.lastLoginAt ? timeAgo(m.lastLoginAt) : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
