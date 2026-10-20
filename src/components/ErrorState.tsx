'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { COMPANY } from '@/lib/company';

import styles from './StatusPage.module.css';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

/** Shared UI for route error boundaries: explains, offers a retry, and a way out. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the message so keyboard and screen-reader users know the page changed.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={`container ${styles.wrap}`} role="alert">
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
        <Link href="/" className="text-link">
          Go to the home page
        </Link>
      </div>
      <p className={styles.small}>
        Still not working? Call us on <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>.
      </p>
    </div>
  );
}
