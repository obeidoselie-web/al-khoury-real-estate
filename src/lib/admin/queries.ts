import 'server-only';

import { and, asc, count, desc, eq, gte, inArray, like, or, sql, type SQL } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  activity,
  advisorProfiles,
  leadNotes,
  leads,
  listingPhotos,
  listings,
  users,
  type LeadKind,
  type LeadStatus,
  type ListingStatus,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';

import { isAdmin } from './permissions';

/*
 * Read queries for the admin. Every function takes the signed-in user and scopes results to what
 * they may see (advisors: their own listings and leads).
 */

const leadScope = (user: SessionUser): SQL | undefined => (isAdmin(user) ? undefined : eq(leads.assigneeId, user.id));
const listingScope = (user: SessionUser): SQL | undefined =>
  isAdmin(user) ? undefined : eq(listings.advisorId, user.id);

// ---------- Dashboard ----------

export async function getDashboard(user: SessionUser) {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [leadCounts, listingCounts, [lastWeek], recentLeads, recentActivity, unassigned] = await Promise.all([
    db.select({ status: leads.status, n: count() }).from(leads).where(leadScope(user)).groupBy(leads.status),
    db.select({ status: listings.status, n: count() }).from(listings).where(listingScope(user)).groupBy(listings.status),
    db.select({ n: count() }).from(leads).where(and(leadScope(user), gte(leads.createdAt, weekAgo))),
    db
      .select({ id: leads.id, kind: leads.kind, name: leads.name, status: leads.status, createdAt: leads.createdAt, listingId: leads.listingId, listingTitle: listings.titleEn })
      .from(leads)
      .leftJoin(listings, eq(listings.id, leads.listingId))
      .where(leadScope(user))
      .orderBy(desc(leads.createdAt))
      .limit(6),
    db
      .select({ id: activity.id, at: activity.at, summary: activity.summary, action: activity.action, actor: users.name })
      .from(activity)
      .leftJoin(users, eq(users.id, activity.actorId))
      .where(
        isAdmin(user)
          ? undefined
          : or(eq(activity.actorId, user.id), and(eq(activity.entity, 'lead'), inArray(activity.entityId, db.select({ id: leads.id }).from(leads).where(eq(leads.assigneeId, user.id))))),
      )
      .orderBy(desc(activity.at))
      .limit(10),
    isAdmin(user)
      ? db.select({ n: count() }).from(leads).where(and(sql`${leads.assigneeId} is null`, eq(leads.status, 'new')))
      : Promise.resolve([{ n: 0 }]),
  ]);

  const byLead = Object.fromEntries(leadCounts.map((r) => [r.status, r.n])) as Partial<Record<LeadStatus, number>>;
  const byListing = Object.fromEntries(listingCounts.map((r) => [r.status, r.n])) as Partial<Record<ListingStatus, number>>;
  return {
    leads: { new: byLead.new ?? 0, contacted: byLead.contacted ?? 0, closed: byLead.closed ?? 0, lastWeek: lastWeek.n, unassigned: unassigned[0].n },
    listings: { published: byListing.published ?? 0, draft: byListing.draft ?? 0, archived: byListing.archived ?? 0 },
    recentLeads,
    recentActivity,
  };
}

export async function countNewLeads(user: SessionUser): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(leads).where(and(leadScope(user), eq(leads.status, 'new')));
  return row.n;
}

// ---------- Listings ----------

export interface ListingFilters {
  q?: string;
  status?: ListingStatus;
}

export async function listListings(user: SessionUser, filters: ListingFilters = {}) {
  const db = await getDb();
  const conditions: (SQL | undefined)[] = [listingScope(user)];
  if (filters.status) conditions.push(eq(listings.status, filters.status));
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[%_]/g, '')}%`;
    conditions.push(or(like(listings.titleEn, pattern), like(listings.titleAr, pattern), like(listings.id, pattern), like(listings.areaEn, pattern)));
  }
  const cover = db
    .select({ listingId: listingPhotos.listingId, src: sql<string>`min(${listingPhotos.src})`.as('src') })
    .from(listingPhotos)
    .where(eq(listingPhotos.position, 0))
    .groupBy(listingPhotos.listingId)
    .as('cover');
  return db
    .select({
      id: listings.id,
      titleEn: listings.titleEn,
      status: listings.status,
      type: listings.type,
      deal: listings.deal,
      price: listings.price,
      areaEn: listings.areaEn,
      cityEn: listings.cityEn,
      featured: listings.featured,
      updatedAt: listings.updatedAt,
      advisorName: users.name,
      cover: cover.src,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.advisorId))
    .leftJoin(cover, eq(cover.listingId, listings.id))
    .where(and(...conditions))
    .orderBy(desc(listings.updatedAt));
}

export async function getListingForEdit(id: string) {
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, id));
  if (!listing) return null;
  const photos = await db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id)).orderBy(asc(listingPhotos.position));
  return { listing, photos };
}

/** Staff who can be put on a listing or a lead. */
export async function listAssignableStaff() {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name));
}

// ---------- Leads ----------

export interface LeadFilters {
  status?: LeadStatus;
  kind?: LeadKind;
  assignee?: string;
  page?: number;
}

export const LEADS_PAGE_SIZE = 25;

export async function listLeads(user: SessionUser, filters: LeadFilters = {}) {
  const db = await getDb();
  const conditions: (SQL | undefined)[] = [leadScope(user)];
  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.kind) conditions.push(eq(leads.kind, filters.kind));
  if (filters.assignee === 'none') conditions.push(sql`${leads.assigneeId} is null`);
  else if (filters.assignee) conditions.push(eq(leads.assigneeId, filters.assignee));
  const where = and(...conditions);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: leads.id,
        kind: leads.kind,
        status: leads.status,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        createdAt: leads.createdAt,
        listingId: leads.listingId,
        listingTitle: listings.titleEn,
        assigneeName: users.name,
        details: leads.details,
      })
      .from(leads)
      .leftJoin(listings, eq(listings.id, leads.listingId))
      .leftJoin(users, eq(users.id, leads.assigneeId))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(LEADS_PAGE_SIZE)
      .offset((page - 1) * LEADS_PAGE_SIZE),
    db.select({ n: count() }).from(leads).where(where),
  ]);
  return { rows, total: total.n, page, pages: Math.max(1, Math.ceil(total.n / LEADS_PAGE_SIZE)) };
}

export async function getLead(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({ lead: leads, listingTitle: listings.titleEn, assigneeName: users.name })
    .from(leads)
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .leftJoin(users, eq(users.id, leads.assigneeId))
    .where(eq(leads.id, id));
  if (!row) return null;
  const notes = await db
    .select({ id: leadNotes.id, body: leadNotes.body, createdAt: leadNotes.createdAt, author: users.name })
    .from(leadNotes)
    .leftJoin(users, eq(users.id, leadNotes.authorId))
    .where(eq(leadNotes.leadId, id))
    .orderBy(asc(leadNotes.createdAt));
  const history = await db
    .select({ id: activity.id, at: activity.at, summary: activity.summary, actor: users.name })
    .from(activity)
    .leftJoin(users, eq(users.id, activity.actorId))
    .where(and(eq(activity.entity, 'lead'), eq(activity.entityId, id)))
    .orderBy(asc(activity.at));
  return { ...row, notes, history };
}

// ---------- Team ----------

export async function listTeam() {
  const db = await getDb();
  const rows = await db
    .select({ user: users, profile: advisorProfiles })
    .from(users)
    .leftJoin(advisorProfiles, eq(advisorProfiles.userId, users.id))
    .orderBy(desc(users.active), asc(users.name));
  const listingCounts = await db
    .select({ advisorId: listings.advisorId, n: count() })
    .from(listings)
    .where(eq(listings.status, 'published'))
    .groupBy(listings.advisorId);
  const counts = new Map(listingCounts.map((r) => [r.advisorId, r.n]));
  return rows.map(({ user, profile }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    canSignIn: Boolean(user.passwordHash),
    lastLoginAt: user.lastLoginAt,
    profile,
    publishedListings: counts.get(user.id) ?? 0,
  }));
}

export async function getTeamMember(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({ user: users, profile: advisorProfiles })
    .from(users)
    .leftJoin(advisorProfiles, eq(advisorProfiles.userId, users.id))
    .where(eq(users.id, id));
  if (!row) return null;
  const { passwordHash, ...user } = row.user;
  return { user: { ...user, canSignIn: Boolean(passwordHash) }, profile: row.profile };
}

export async function countActiveAdmins(): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(users).where(and(eq(users.role, 'admin'), eq(users.active, true)));
  return row.n;
}
