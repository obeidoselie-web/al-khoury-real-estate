'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from '../../admin.module.css';

const TABS = [
  { href: '/admin/website', label: 'Contact & map' },
  { href: '/admin/website/home', label: 'Home page' },
  { href: '/admin/website/about', label: 'About page' },
  { href: '/admin/website/listings', label: 'Listings' },
  { href: '/admin/website/texts', label: 'All texts' },
];

export function WebsiteTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Website sections" className={`${styles.segmented} ${styles.tabs}`}>
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={styles.segment} aria-current={pathname === tab.href ? 'page' : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
