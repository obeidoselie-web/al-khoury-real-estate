import { LoadingStatus, LoadingTitle } from '@/components/LoadingStatus';

import styles from './listings.module.css';

export default function ListingsLoading() {
  return (
    <div className="container" aria-busy="true">
      <header className={styles.header}>
        <LoadingTitle className={styles.title} />
        <LoadingStatus what="listings" className={styles.lead} />
      </header>
      <div className={`${styles.skeletonFilters} ${styles.shimmer}`} aria-hidden="true" />
      <ul className={styles.skeletonGrid} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className={`${styles.skeletonCard} ${styles.shimmer}`} />
        ))}
      </ul>
    </div>
  );
}
