'use server';

import { and, asc, eq, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { listingPhotos, listings } from '@/db/schema';
import { logActivity, refreshPublicSite } from '@/lib/admin/activity';
import { parseListingForm, type FieldErrors } from '@/lib/admin/forms';
import { canAssignListing, canDeleteListing, canEditListing, canFeatureListing } from '@/lib/admin/permissions';
import { requireUser, type SessionUser } from '@/lib/auth/session';
import { sanitizeText } from '@/lib/contact';
import { getPhotoStorage, storeListingPhoto, UploadError } from '@/lib/storage';

export interface ListingFormState {
  status: 'idle' | 'error' | 'saved';
  message?: string;
  fieldErrors?: FieldErrors;
  /** Bumped on every save so the client can re-show the confirmation. */
  savedAt?: number;
  /** The submitted text values, echoed back so nothing typed is lost. */
  values?: Record<string, string>;
}

function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string' && !key.startsWith('$ACTION')) values[key] = value;
  return values;
}

async function loadEditable(user: SessionUser, id: string) {
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, id));
  if (!listing || !canEditListing(user, listing)) return null;
  return listing;
}

async function photoCount(id: string): Promise<number> {
  const db = await getDb();
  return (await db.select({ id: listingPhotos.id }).from(listingPhotos).where(eq(listingPhotos.listingId, id))).length;
}

/** Creates (no `existingId`) or updates a listing. */
export async function saveListing(existingId: string | null, _prev: ListingFormState, form: FormData): Promise<ListingFormState> {
  const user = await requireUser();
  const parsed = parseListingForm(form);
  if (!parsed.ok) return { status: 'error', message: 'Check the highlighted fields.', fieldErrors: parsed.fieldErrors, values: echo(form) };
  const input = parsed.data;
  const db = await getDb();

  if (existingId === null) {
    const [taken] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, input.id));
    if (taken) return { status: 'error', message: 'Check the highlighted fields.', fieldErrors: { id: 'Another listing already uses this address.' }, values: echo(form) };
    if (input.status === 'published') {
      return { status: 'error', message: 'Save it as a draft first, then add photos and publish.', fieldErrors: { status: 'A listing needs photos before it can be published.' }, values: echo(form) };
    }
    await db.insert(listings).values({
      ...input,
      advisorId: canAssignListing(user) ? input.advisorId : user.id,
      featured: canFeatureListing(user) ? input.featured : false,
    });
    await logActivity(user.id, 'listing.created', 'listing', input.id, `${user.name} created “${input.titleEn}”`);
    refreshPublicSite();
    redirect(`/admin/listings/${input.id}?created=1`);
  }

  const current = await loadEditable(user, existingId);
  if (!current) return { status: 'error', message: 'You can no longer edit this listing.' };
  if (input.status === 'published' && (await photoCount(existingId)) === 0) {
    return { status: 'error', message: 'Add at least one photo before publishing.', fieldErrors: { status: 'Needs a photo first.' }, values: echo(form) };
  }

  const { id: _ignoredId, ...changes } = input;
  await db
    .update(listings)
    .set({
      ...changes,
      advisorId: canAssignListing(user) ? input.advisorId : current.advisorId,
      featured: canFeatureListing(user) ? input.featured : current.featured,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(listings.id, existingId));

  const verb =
    current.status !== input.status
      ? input.status === 'published'
        ? 'published'
        : input.status === 'archived'
          ? 'archived'
          : 'unpublished'
      : 'updated';
  await logActivity(user.id, `listing.${verb}`, 'listing', existingId, `${user.name} ${verb} “${input.titleEn}”`);
  refreshPublicSite();
  revalidatePath('/admin/listings');
  return { status: 'saved', message: verb === 'updated' ? 'Changes saved.' : `Listing ${verb}.`, savedAt: Date.now() };
}

export async function deleteListing(id: string): Promise<void> {
  const user = await requireUser();
  if (!canDeleteListing(user)) redirect(`/admin/listings/${id}`);
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, id));
  if (!listing) redirect('/admin/listings');
  const photos = await db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id));
  await db.delete(listings).where(eq(listings.id, id));
  const storage = getPhotoStorage();
  await Promise.all(photos.filter((p) => p.storageKey).map((p) => storage.delete(p.storageKey!)));
  await logActivity(user.id, 'listing.deleted', 'listing', id, `${user.name} deleted “${listing.titleEn}”`);
  refreshPublicSite();
  redirect('/admin/listings?deleted=1');
}

// ---------- Photos ----------

export interface PhotoUploadState {
  error?: string;
  uploaded?: number;
  at?: number;
}

export async function uploadPhotos(listingId: string, _prev: PhotoUploadState, form: FormData): Promise<PhotoUploadState> {
  const user = await requireUser();
  const listing = await loadEditable(user, listingId);
  if (!listing) return { error: 'You can no longer edit this listing.' };

  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'Choose one or more photos.' };
  if (files.length > 8) return { error: 'Upload up to 8 photos at a time.' };

  const db = await getDb();
  const [{ last }] = await db.select({ last: max(listingPhotos.position) }).from(listingPhotos).where(eq(listingPhotos.listingId, listingId));
  let position = (last ?? -1) + 1;
  const failures: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    try {
      const stored = await storeListingPhoto(listingId, file);
      await db.insert(listingPhotos).values({
        id: crypto.randomUUID(),
        listingId,
        src: stored.url,
        storageKey: stored.key,
        altEn: listing.titleEn,
        altAr: listing.titleAr,
        width: stored.width,
        height: stored.height,
        position: position++,
      });
      uploaded++;
    } catch (error) {
      failures.push(`${sanitizeText(file.name, { maxLength: 80 })}: ${error instanceof UploadError ? error.message : 'upload failed'}`);
      if (!(error instanceof UploadError)) console.error('[admin] photo upload failed:', error);
    }
  }

  if (uploaded > 0) {
    await db.update(listings).set({ updatedAt: new Date().toISOString() }).where(eq(listings.id, listingId));
    await logActivity(user.id, 'listing.photos', 'listing', listingId, `${user.name} added ${uploaded} photo${uploaded === 1 ? '' : 's'} to “${listing.titleEn}”`);
    refreshPublicSite();
    revalidatePath(`/admin/listings/${listingId}`);
  }
  return { uploaded, error: failures.length ? failures.join(' · ') : undefined, at: Date.now() };
}

async function orderedPhotos(listingId: string) {
  const db = await getDb();
  return db.select().from(listingPhotos).where(eq(listingPhotos.listingId, listingId)).orderBy(asc(listingPhotos.position));
}

async function writeOrder(ids: string[], listingId: string) {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.batch(
    ids.map((id, position) =>
      db.update(listingPhotos).set({ position }).where(and(eq(listingPhotos.id, id), eq(listingPhotos.listingId, listingId))),
    ) as [never, ...never[]],
  );
}

/** Moves a photo one place earlier/later, or to the front ("cover"). */
export async function movePhoto(listingId: string, photoId: string, direction: 'up' | 'down' | 'cover'): Promise<void> {
  const user = await requireUser();
  if (!(await loadEditable(user, listingId))) return;
  const ids = (await orderedPhotos(listingId)).map((p) => p.id);
  const from = ids.indexOf(photoId);
  if (from === -1) return;
  const to = direction === 'cover' ? 0 : direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length || to === from) return;
  ids.splice(from, 1);
  ids.splice(to, 0, photoId);
  await writeOrder(ids, listingId);
  refreshPublicSite();
  revalidatePath(`/admin/listings/${listingId}`);
}

export async function updatePhotoAlt(listingId: string, photoId: string, form: FormData): Promise<void> {
  const user = await requireUser();
  if (!(await loadEditable(user, listingId))) return;
  const db = await getDb();
  await db
    .update(listingPhotos)
    .set({
      altEn: sanitizeText(form.get('altEn'), { maxLength: 200 }),
      altAr: sanitizeText(form.get('altAr'), { maxLength: 200 }),
    })
    .where(and(eq(listingPhotos.id, photoId), eq(listingPhotos.listingId, listingId)));
  refreshPublicSite();
  revalidatePath(`/admin/listings/${listingId}`);
}

export async function deletePhoto(listingId: string, photoId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const listing = await loadEditable(user, listingId);
  if (!listing) return { error: 'You can no longer edit this listing.' };
  const photos = await orderedPhotos(listingId);
  const target = photos.find((p) => p.id === photoId);
  if (!target) return {};
  if (listing.status === 'published' && photos.length === 1) {
    return { error: 'A published listing needs at least one photo. Upload another first, or unpublish it.' };
  }
  const db = await getDb();
  await db.delete(listingPhotos).where(eq(listingPhotos.id, photoId));
  if (target.storageKey) await getPhotoStorage().delete(target.storageKey);
  await writeOrder(photos.filter((p) => p.id !== photoId).map((p) => p.id), listingId);
  await logActivity(user.id, 'listing.photos', 'listing', listingId, `${user.name} removed a photo from “${listing.titleEn}”`);
  refreshPublicSite();
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}
