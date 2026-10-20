import Link from 'next/link';

import { COMPANY } from '@/lib/company';
import { listingsHref } from '@/lib/filters';

import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <p className={styles.name}>{COMPANY.name}</p>
          <p className={styles.muted}>{COMPANY.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <h2 className={styles.heading}>Browse</h2>
          <ul className={styles.list}>
            <li>
              <Link href={listingsHref({ deal: 'sale' })}>Buy</Link>
            </li>
            <li>
              <Link href={listingsHref({ deal: 'rent' })}>Rent</Link>
            </li>
            <li>
              <Link href="/about">About us</Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className={styles.heading}>Contact</h2>
          <ul className={styles.list}>
            <li>
              <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            <li className={styles.muted}>{COMPANY.address.lines.slice(0, 2).join(', ')}</li>
          </ul>
        </div>
      </div>
      <div className={`container ${styles.legal}`}>
        <p>
          © {new Date().getFullYear()} {COMPANY.name}. Listings and images shown are illustrative placeholders.
        </p>
      </div>
    </footer>
  );
}
