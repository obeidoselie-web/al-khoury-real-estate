import { LoadingStatus } from '@/components/LoadingStatus';

import styles from '../listings.module.css';

export default function PropertyLoading() {
  return (
    <div className="container" aria-busy="true">
      <LoadingStatus what="property" />
      <div aria-hidden="true" style={{ display: 'grid', gap: 'var(--space-3)', paddingBlock: 'var(--space-7) var(--space-5)' }}>
        <div className={styles.shimmer} style={{ height: '1rem', width: '9rem', borderRadius: 8 }} />
        <div className={styles.shimmer} style={{ height: '2.5rem', width: 'min(32rem, 90%)', borderRadius: 10 }} />
        <div className={styles.shimmer} style={{ height: '1.25rem', width: '12rem', borderRadius: 8 }} />
      </div>
      <div className={styles.shimmer} aria-hidden="true" style={{ aspectRatio: '2 / 1', borderRadius: 'var(--radius-lg)' }} />
    </div>
  );
}
