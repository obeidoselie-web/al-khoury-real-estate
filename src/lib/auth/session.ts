import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { and, count, eq, gt, lt } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { getDb } from '@/db';
import { loginAttempts, sessions, users, type Role } from '@/db/schema';

import { verifyPassword } from './password';

/*
 * Cookie sessions for the admin. The browser holds a random 256-bit token in an HttpOnly,
 * SameSite=Lax cookie scoped to /admin; the database stores only its SHA-256, so a leaked database
 * cannot be replayed as a session. Server Actions add Next's own Origin check against CSRF.
 */

export const SESSION_COOKIE = 'ak_admin_session';
const SESSION_DAYS = 7;
const ATTEMPT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

export type SignInResult = { ok: true; user: SessionUser } | { ok: false; reason: 'invalid' | 'throttled' };

/** Checks credentials (with throttling) and, on success, starts a session. */
export async function signIn(emailInput: string, password: string): Promise<SignInResult> {
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();
  const ip = await clientIp();
  const since = isoIn(-ATTEMPT_WINDOW_MINUTES * 60_000);

  const [[byEmail], [byIp]] = await Promise.all([
    db.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.key, `email:${email}`), gt(loginAttempts.at, since))),
    db.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.key, `ip:${ip}`), gt(loginAttempts.at, since))),
  ]);
  if (byEmail.n >= MAX_ATTEMPTS_PER_EMAIL || byIp.n >= MAX_ATTEMPTS_PER_IP) return { ok: false, reason: 'throttled' };

  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !user.passwordHash || !valid) {
    await db.insert(loginAttempts).values([{ key: `email:${email}` }, { key: `ip:${ip}` }]);
    return { ok: false, reason: 'invalid' };
  }

  await db.delete(loginAttempts).where(eq(loginAttempts.key, `email:${email}`));
  await db.delete(loginAttempts).where(lt(loginAttempts.at, since));
  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));
  await startSession(user.id);
  return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

// A valid scrypt hash of a random string, compared against when the account does not exist.
const DUMMY_HASH =
  'scrypt$32768$8$1$c2FsdHNhbHRzYWx0c2FsdA==$' + Buffer.alloc(64, 1).toString('base64');

async function startSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = isoIn(SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    expires: new Date(expiresAt),
  });
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.delete({ name: SESSION_COOKIE, path: '/admin' });
}

/** Ends every session of a user (after a password reset or deactivation). */
export async function revokeSessions(userId: string, keepCurrent = false): Promise<void> {
  const db = await getDb();
  const current = keepCurrent ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  const all = await db.select({ tokenHash: sessions.tokenHash }).from(sessions).where(eq(sessions.userId, userId));
  for (const { tokenHash } of all) {
    if (current && tokenHash === hashToken(current)) continue;
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
}

/** The signed-in staff member for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashToken(token)));
  if (!row || !row.active || row.expiresAt <= new Date().toISOString()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/** For admin pages and actions: the signed-in user, or a redirect to the login page. */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (role && user.role !== role) redirect('/admin?denied=1');
  return user;
}
