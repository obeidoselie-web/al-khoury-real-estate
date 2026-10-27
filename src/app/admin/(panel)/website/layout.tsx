import type { ReactNode } from 'react';

import { ExternalIcon } from '@/components/icons';
import { requireUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';
import { WebsiteTabs } from './WebsiteTabs';

export default async function WebsiteLayout({ children }: { children: ReactNode }) {
  await requireUser('admin');
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Website</h1>
          <p className={styles.pageSub}>Contact details, map, photos, page sections and every text on the site, in English and Arabic.</p>
        </div>
        <div className={styles.actions}>
          <a href="/en" target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGhost}`}>
            <ExternalIcon size={16} />
            View site
          </a>
        </div>
      </header>
      <WebsiteTabs />
      {children}
    </>
  );
}
