import Link from 'next/link';

import styles from '../admin.module.css';

export default function AdminNotFound() {
  return (
    <div className={`${styles.card} ${styles.empty}`}>
      <h1 className={styles.pageTitle}>Not found</h1>
      <p style={{ margin: 'var(--space-2) 0 var(--space-4)' }}>It may have been deleted, or it is not one of yours.</p>
      <Link href="/admin" className={styles.btn}>
        Back to the dashboard
      </Link>
    </div>
  );
}
