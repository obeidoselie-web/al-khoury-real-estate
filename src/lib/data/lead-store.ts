import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { activity, advisorProfiles, leads, listings, users, type LeadKind } from '@/db/schema';

import { REGIONS } from '../types';

export interface NewLead {
  kind: LeadKind;
  locale: string;
  propertyId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  details?: Record<string, string | number | null>;
}

/**
 * Saves a website lead for the inbox and routes it: a property lead goes to that listing's advisor,
 * a valuation to whoever covers its region; anything else is left for an admin to assign.
 * Returns the new lead id.
 */
export async function recordLead(lead: NewLead): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();

  let listingId: string | null = null;
  let listingTitle: string | null = null;
  let assigneeId: string | null = null;

  if (lead.propertyId) {
    const [listing] = await db
      .select({ id: listings.id, advisorId: listings.advisorId, title: listings.titleEn })
      .from(listings)
      .where(eq(listings.id, lead.propertyId));
    if (listing) {
      listingId = listing.id;
      listingTitle = listing.title;
      assigneeId = listing.advisorId;
    }
  }

  const region = lead.details?.region;
  if (!assigneeId && typeof region === 'string' && (REGIONS as readonly string[]).includes(region)) {
    const advisors = await db
      .select({ id: users.id, regions: advisorProfiles.regions })
      .from(advisorProfiles)
      .innerJoin(users, eq(users.id, advisorProfiles.userId))
      .where(eq(users.active, true))
      .orderBy(asc(advisorProfiles.sortOrder));
    assigneeId = advisors.find((advisor) => advisor.regions.includes(region))?.id ?? null;
  }

  await db.insert(leads).values({
    id,
    kind: lead.kind,
    locale: lead.locale,
    listingId,
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone || null,
    message: lead.message || null,
    details: lead.details ?? {},
    assigneeId,
  });

  const label = lead.kind === 'enquiry' ? 'Enquiry' : lead.kind === 'viewing' ? 'Viewing request' : 'Valuation request';
  await db.insert(activity).values({
    id: crypto.randomUUID(),
    actorId: null,
    action: 'lead.received',
    entity: 'lead',
    entityId: id,
    summary: `${label} from ${lead.name}${listingTitle ? ` about “${listingTitle}”` : ''}`,
  });

  return id;
}
