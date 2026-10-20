import Link from 'next/link';

import styles from './StatusPage.module.css';

interface NotFoundStateProps {
  title: string;
  message: string;
}

export function NotFoundState({ title, message }: NotFoundStateProps) {
  return (
    <div className={`container ${styles.wrap}`}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <Link href="/listings" className="button">
          Browse properties
        </Link>
        <Link href="/about#contact" className="text-link">
          Contact us
        </Link>
      </div>
    </div>
  );
}
