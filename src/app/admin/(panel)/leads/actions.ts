'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/db';
import { leadNotes, leads, users } from '@/db/schema';
import { logActivity } from '@/lib/admin/activity';
import { STATUS_LABELS } from '@/lib/admin/format';
import { parseLeadStatus, parseNote } from '@/lib/admin/forms';
import { canAssignLead, canSeeLead } from '@/lib/admin/permissions';
import { requireUser } from '@/lib/auth/session';

async function loadVisible(id: string) {
  const user = await requireUser();
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead || !canSeeLead(user, lead)) return null;
  return { user, lead, db };
}

function refresh(id: string) {
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
}

export async function setLeadStatus(id: string, form: FormData): Promise<void> {
  const ctx = await loadVisible(id);
  const status = parseLeadStatus(form.get('status'));
  if (!ctx || !status || status === ctx.lead.status) return;
  await ctx.db.update(leads).set({ status, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
  await logActivity(ctx.user.id, 'lead.status', 'lead', id, `${ctx.user.name} marked ${ctx.lead.name}'s lead as ${STATUS_LABELS[status].toLowerCase()}`);
  refresh(id);
}

export async function assignLead(id: string, form: FormData): Promise<void> {
  const ctx = await loadVisible(id);
  if (!ctx || !canAssignLead(ctx.user)) return;
  const assigneeId = String(form.get('assigneeId') ?? '') || null;
  if (assigneeId === ctx.lead.assigneeId) return;
  let assigneeName = 'nobody';
  if (assigneeId) {
    const [assignee] = await ctx.db.select({ name: users.name, active: users.active }).from(users).where(eq(users.id, assigneeId));
    if (!assignee?.active) return;
    assigneeName = assignee.name;
  }
  await ctx.db.update(leads).set({ assigneeId, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
  await logActivity(ctx.user.id, 'lead.assigned', 'lead', id, `${ctx.user.name} assigned ${ctx.lead.name}'s lead to ${assigneeName}`);
  refresh(id);
}

export interface NoteState {
  error?: string;
  at?: number;
}

export async function addNote(id: string, _prev: NoteState, form: FormData): Promise<NoteState> {
  const ctx = await loadVisible(id);
  if (!ctx) return { error: 'You can no longer see this lead.' };
  const parsed = parseNote(form);
  if (!parsed.ok) return { error: parsed.fieldErrors.body };
  await ctx.db.insert(leadNotes).values({ id: crypto.randomUUID(), leadId: id, authorId: ctx.user.id, body: parsed.data });
  // A first note usually means someone has been in touch.
  if (ctx.lead.status === 'new') {
    await ctx.db.update(leads).set({ status: 'contacted', updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
  }
  refresh(id);
  return { at: Date.now() };
}
