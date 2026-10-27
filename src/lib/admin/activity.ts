import 'server-only';

import { revalidatePath } from 'next/cache';

import { getDb } from '@/db';
import { activity } from '@/db/schema';

export async function logActivity(
  actorId: string | null,
  action: string,
  entity: 'listing' | 'lead' | 'user' | 'website',
  entityId: string,
  summary: string,
): Promise<void> {
  const db = await getDb();
  await db.insert(activity).values({ id: crypto.randomUUID(), actorId, action, entity, entityId, summary });
}

/** Rebuilds the public pages (home, listings, property pages) in both languages after a change. */
export function refreshPublicSite(): void {
  revalidatePath('/[locale]', 'layout');
}
