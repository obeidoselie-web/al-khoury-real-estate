import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BrandMark } from '@/components/BrandMark';
import { safeAdminPath } from '@/lib/admin/forms';
import { getCurrentUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { next } = await searchParams;
  const destination = safeAdminPath(next);
  if (await getCurrentUser()) redirect(destination);

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <BrandMark id="login-mark" />
          <p className="kicker">Al Khoury Real Estate</p>
          <h1 className={styles.loginTitle}>Sign in to the admin</h1>
        </div>
        <LoginForm next={destination} />
      </div>
    </main>
  );
}
