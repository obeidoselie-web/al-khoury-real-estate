'use server';

import { redirect } from 'next/navigation';

import { safeAdminPath } from '@/lib/admin/forms';
import { signIn } from '@/lib/auth/session';

export interface LoginState {
  error?: string;
  email?: string;
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').slice(0, 200);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: 'Enter your email and password.', email };

  const result = await signIn(email, password);
  if (!result.ok) {
    return {
      email,
      error:
        result.reason === 'throttled'
          ? 'Too many attempts. Wait 15 minutes and try again.'
          : 'That email and password do not match an active account.',
    };
  }
  redirect(safeAdminPath(formData.get('next')));
}
