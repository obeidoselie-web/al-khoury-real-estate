'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/db';
import { advisorProfiles, users } from '@/db/schema';
import { logActivity, refreshPublicSite } from '@/lib/admin/activity';
import { parseProfileForm, parseUserForm, type FieldErrors } from '@/lib/admin/forms';
import { canManageTeam } from '@/lib/admin/permissions';
import { countActiveAdmins } from '@/lib/admin/queries';
import { generatePassword, hashPassword } from '@/lib/auth/password';
import { requireUser, revokeSessions } from '@/lib/auth/session';

export interface TeamFormState {
  status: 'idle' | 'error' | 'saved';
  message?: string;
  fieldErrors?: FieldErrors;
  /** A generated password, shown once to the admin. */
  password?: string;
  userId?: string;
  at?: number;
}

const saved = (message: string, extra: Partial<TeamFormState> = {}): TeamFormState => ({ status: 'saved', message, at: Date.now(), ...extra });
const failed = (message: string, fieldErrors?: FieldErrors): TeamFormState => ({ status: 'error', message, fieldErrors, at: Date.now() });

async function requireAdmin() {
  const user = await requireUser();
  return canManageTeam(user) ? user : null;
}

export async function createUser(_prev: TeamFormState, form: FormData): Promise<TeamFormState> {
  const admin = await requireAdmin();
  if (!admin) return failed('Only admins can add staff.');
  const parsed = parseUserForm(form);
  if (!parsed.ok) return failed('Check the highlighted fields.', parsed.fieldErrors);
  const db = await getDb();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));
  if (taken) return failed('Check the highlighted fields.', { email: 'Someone already uses this email.' });

  const password = generatePassword();
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, ...parsed.data, active: true, passwordHash: await hashPassword(password) });
  await logActivity(admin.id, 'user.created', 'user', id, `${admin.name} added ${parsed.data.name} as ${parsed.data.role}`);
  revalidatePath('/admin/team');
  return saved(`${parsed.data.name} can now sign in.`, { password, userId: id });
}

export async function updateUser(id: string, _prev: TeamFormState, form: FormData): Promise<TeamFormState> {
  const admin = await requireAdmin();
  if (!admin) return failed('Only admins can change accounts.');
  const parsed = parseUserForm(form);
  if (!parsed.ok) return failed('Check the highlighted fields.', parsed.fieldErrors);
  const input = { ...parsed.data, active: form.get('active') === 'on' };
  const db = await getDb();
  const [current] = await db.select().from(users).where(eq(users.id, id));
  if (!current) return failed('This account no longer exists.');

  const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, input.email), ne(users.id, id)));
  if (taken) return failed('Check the highlighted fields.', { email: 'Someone else already uses this email.' });

  const losesAdmin = current.role === 'admin' && current.active && (input.role !== 'admin' || !input.active);
  if (losesAdmin && id === admin.id) return failed('You cannot remove your own admin access. Ask another admin.');
  if (losesAdmin && (await countActiveAdmins()) <= 1) return failed('There must always be at least one active admin.');

  await db.update(users).set(input).where(eq(users.id, id));
  if (!input.active && current.active) await revokeSessions(id);
  await logActivity(
    admin.id,
    'user.updated',
    'user',
    id,
    !input.active && current.active ? `${admin.name} deactivated ${input.name}` : `${admin.name} updated ${input.name}'s account`,
  );
  refreshPublicSite();
  revalidatePath('/admin/team');
  return saved('Account saved.');
}

export async function resetPassword(id: string, _prev: TeamFormState): Promise<TeamFormState> {
  const admin = await requireAdmin();
  if (!admin) return failed('Only admins can reset passwords.');
  const db = await getDb();
  const [target] = await db.select({ name: users.name }).from(users).where(eq(users.id, id));
  if (!target) return failed('This account no longer exists.');
  const password = generatePassword();
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
  await revokeSessions(id, id === admin.id);
  await logActivity(admin.id, 'user.password', 'user', id, `${admin.name} reset ${target.name}'s password`);
  revalidatePath(`/admin/team/${id}`);
  return saved(`New password for ${target.name}. They have been signed out everywhere.`, { password });
}

/** Saves the public advisor profile of `userId` — allowed for admins and for the person themself. */
export async function saveProfile(userId: string, _prev: TeamFormState, form: FormData): Promise<TeamFormState> {
  const actor = await requireUser();
  if (!canManageTeam(actor) && actor.id !== userId) return failed('You can only edit your own profile.');
  const parsed = parseProfileForm(form);
  if (!parsed.ok) return failed('Check the highlighted fields.', parsed.fieldErrors);
  // Only admins decide whether a profile is shown and in what order.
  const db = await getDb();
  const [existing] = await db.select().from(advisorProfiles).where(eq(advisorProfiles.userId, userId));
  const data = canManageTeam(actor)
    ? parsed.data
    : { ...parsed.data, visible: existing?.visible ?? true, sortOrder: existing?.sortOrder ?? 0, regions: existing?.regions ?? parsed.data.regions };

  await db
    .insert(advisorProfiles)
    .values({ userId, ...data })
    .onConflictDoUpdate({ target: advisorProfiles.userId, set: data });
  const [person] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  await logActivity(actor.id, 'user.profile', 'user', userId, `${actor.name} updated ${actor.id === userId ? 'their' : `${person?.name ?? 'a'}'s`} public profile`);
  refreshPublicSite();
  revalidatePath('/admin/team');
  revalidatePath('/admin/account');
  return saved('Profile saved. The website shows it on this person’s listings.');
}

export async function removeProfile(userId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const db = await getDb();
  await db.delete(advisorProfiles).where(eq(advisorProfiles.userId, userId));
  await logActivity(admin.id, 'user.profile', 'user', userId, `${admin.name} removed a public profile`);
  refreshPublicSite();
  revalidatePath(`/admin/team/${userId}`);
}
