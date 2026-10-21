'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AllIcon, HouseIcon, MailIcon, UserIcon, UsersIcon } from '@/components/icons';

import styles from '../admin.module.css';

export function AdminNav({ isAdmin, newLeads }: { isAdmin: boolean; newLeads: number }) {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'Dashboard', Icon: AllIcon, exact: true },
    { href: '/admin/listings', label: 'Listings', Icon: HouseIcon },
    { href: '/admin/leads', label: 'Leads', Icon: MailIcon, badge: newLeads },
    ...(isAdmin ? [{ href: '/admin/team', label: 'Team', Icon: UsersIcon }] : []),
    { href: '/admin/account', label: 'My account', Icon: UserIcon },
  ];

  return (
    <nav aria-label="Admin sections">
      <ul className={styles.nav}>
        {items.map(({ href, label, Icon, exact, badge }) => {
          const current = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} className={styles.navLink} aria-current={current ? 'page' : undefined}>
                <Icon size={18} />
                {label}
                {badge ? (
                  <span className={styles.navBadge}>
                    {badge}
                    <span className="sr-only"> new</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
