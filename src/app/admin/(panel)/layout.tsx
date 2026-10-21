import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/BrandMark';
import { ExternalIcon, LogoutIcon } from '@/components/icons';
import { initials } from '@/lib/data/advisors';
import { countNewLeads } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../admin.module.css';
import { signOutAction } from './actions';
import { AdminNav } from './AdminNav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const newLeads = await countNewLeads(user);

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={styles.sidebar} aria-label="Admin">
        <Link href="/admin" className={styles.brand}>
          <BrandMark id="admin-mark" />
          <span className={styles.brandText}>
            <span className={styles.brandName}>AL KHOURY</span>
            <span className={styles.brandSub}>Admin</span>
          </span>
        </Link>
        <AdminNav isAdmin={user.role === 'admin'} newLeads={newLeads} />
        <div className={styles.sidebarFoot}>
          <div className={styles.me}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className={styles.meText}>
              <span className={styles.meName}>{user.name}</span>
              <span className={styles.meRole}>{user.role}</span>
            </span>
          </div>
          <div className={styles.footLinks}>
            <a href="/" target="_blank" rel="noopener" className={styles.ghostDark}>
              <ExternalIcon size={16} />
              Site
            </a>
            <form action={signOutAction}>
              <button type="submit" className={styles.ghostDark} aria-label="Sign out">
                <LogoutIcon size={16} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
}
