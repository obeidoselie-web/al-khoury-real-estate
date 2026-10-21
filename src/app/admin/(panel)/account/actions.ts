'use server';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { logActivity } from '@/lib/admin/activity';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { requireUser, revokeSessions } from '@/lib/auth/session';

export interface PasswordState {
  status: 'idle' | 'error' | 'saved';
  message?: string;
  field?: 'current' | 'next' | 'confirm';
  at?: number;
}

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const me = await requireUser();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  const at = Date.now();

  const db = await getDb();
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, me.id));
  if (!(await verifyPassword(current, row?.passwordHash))) {
    return { status: 'error', field: 'current', message: 'Your current password is not right.', at };
  }
  const problem = passwordProblem(next);
  if (problem) return { status: 'error', field: 'next', message: problem, at };
  if (next === current) return { status: 'error', field: 'next', message: 'Choose a password you have not used here.', at };
  if (next !== confirm) return { status: 'error', field: 'confirm', message: 'The two new passwords do not match.', at };

  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
  await revokeSessions(me.id, true);
  await logActivity(me.id, 'user.password', 'user', me.id, `${me.name} changed their password`);
  return { status: 'saved', message: 'Password changed. Other devices have been signed out.', at };
}
