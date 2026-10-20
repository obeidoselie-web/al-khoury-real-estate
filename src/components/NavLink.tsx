'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Header link that marks the current section with aria-current for screen readers and styling. */
export function NavLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isCurrent = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={isCurrent ? 'page' : undefined}>
      {children}
    </Link>
  );
}
