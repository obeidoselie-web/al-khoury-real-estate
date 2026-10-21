import type { Role } from '@/db/schema';

/*
 * Who may do what. Admins manage everything; advisors manage their own listings and the leads
 * routed to them. Every Server Action checks these on the server — hiding a button is not security.
 */

export interface Actor {
  id: string;
  role: Role;
}

export const isAdmin = (actor: Actor) => actor.role === 'admin';

export function canEditListing(actor: Actor, listing: { advisorId: string | null }): boolean {
  return isAdmin(actor) || listing.advisorId === actor.id;
}

/** Only admins hand a listing to someone else; an advisor's new listing is always their own. */
export function canAssignListing(actor: Actor): boolean {
  return isAdmin(actor);
}

/** Featuring decides what the home page shows, so it is an admin call. */
export function canFeatureListing(actor: Actor): boolean {
  return isAdmin(actor);
}

export function canDeleteListing(actor: Actor): boolean {
  return isAdmin(actor);
}

export function canSeeLead(actor: Actor, lead: { assigneeId: string | null }): boolean {
  return isAdmin(actor) || lead.assigneeId === actor.id;
}

export function canAssignLead(actor: Actor): boolean {
  return isAdmin(actor);
}

export function canManageTeam(actor: Actor): boolean {
  return isAdmin(actor);
}
