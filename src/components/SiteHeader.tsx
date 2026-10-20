import Link from 'next/link';

import { COMPANY } from '@/lib/company';

import { NavLink } from './NavLink';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${COMPANY.name} — home`}>
          <span className={styles.mark} aria-hidden="true">
            AK
          </span>
          <span className={styles.wordmark}>
            {COMPANY.shortName}
            <span className={styles.wordmarkSub}> Real Estate</span>
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className={styles.nav}>
            <li>
              <NavLink href="/listings" className={styles.link}>
                Properties
              </NavLink>
            </li>
            <li>
              <NavLink href="/about" className={styles.link}>
                About & Contact
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
