import styles from './listings.module.css';

export default function ListingsLoading() {
  return (
    <div className="container" aria-busy="true">
      <header className={styles.header}>
        <h1 className={styles.title}>Properties</h1>
        <p className={styles.lead} role="status">
          Loading properties…
        </p>
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
