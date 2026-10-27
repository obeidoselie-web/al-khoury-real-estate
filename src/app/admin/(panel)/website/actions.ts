'use server';

import { revalidatePath } from 'next/cache';

import { getDictionary } from '@/i18n/dictionaries';
import { logActivity, refreshPublicSite } from '@/lib/admin/activity';
import { parseSettings, parseTexts } from '@/lib/admin/website-form';
import { requireUser } from '@/lib/auth/session';
import { getSiteSettings, saveOverrides, saveSiteSettings } from '@/lib/data/site-store';
import { DEFAULT_SITE } from '@/lib/site';
import { getPhotoStorage, isValidKey, storeSitePhoto, UploadError } from '@/lib/storage';

export interface WebsiteFormState {
  status: 'idle' | 'error' | 'saved';
  message?: string;
  fieldErrors?: Record<string, string>;
  at?: number;
}

/** Saves the settings and texts on one Website page. Admins only. */
export async function saveWebsite(_prev: WebsiteFormState, form: FormData): Promise<WebsiteFormState> {
  const user = await requireUser('admin');
  const page = String(form.get('__page') ?? 'website').slice(0, 40);
  const current = await getSiteSettings();
  const { settings, errors: settingErrors } = parseSettings(form, current);
  const { changes, errors: textErrors } = parseTexts(form, { en: getDictionary('en'), ar: getDictionary('ar') });
  const fieldErrors = { ...settingErrors, ...textErrors };
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Nothing was saved. Check the highlighted fields.', fieldErrors, at: Date.now() };
  }

  if (form.has('__settings')) await saveSiteSettings(settings);
  await saveOverrides(changes);
  await logActivity(user.id, 'website.updated', 'website', 'site', `${user.name} updated the website (${page})`);
  refreshPublicSite();
  revalidatePath('/admin/website', 'layout');
  return { status: 'saved', message: 'Saved. The website shows the changes now.', at: Date.now() };
}

export interface HeroState {
  error?: string;
  at?: number;
}

export async function uploadHeroImage(_prev: HeroState, form: FormData): Promise<HeroState> {
  const user = await requireUser('admin');
  const file = form.get('hero');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo first.', at: Date.now() };
  try {
    const stored = await storeSitePhoto(file);
    const current = await getSiteSettings();
    await saveSiteSettings({ ...current, hero: { ...current.hero, image: { src: stored.url, width: stored.width, height: stored.height } } });
    await removeOldHero(current.hero.image.src);
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message, at: Date.now() };
    throw error;
  }
  await logActivity(user.id, 'website.hero', 'website', 'site', `${user.name} changed the home page photo`);
  refreshPublicSite();
  revalidatePath('/admin/website', 'layout');
  return { at: Date.now() };
}

export async function resetHeroImage(): Promise<void> {
  const user = await requireUser('admin');
  const current = await getSiteSettings();
  await saveSiteSettings({ ...current, hero: { ...current.hero, image: DEFAULT_SITE.hero.image } });
  await removeOldHero(current.hero.image.src);
  await logActivity(user.id, 'website.hero', 'website', 'site', `${user.name} restored the original home page photo`);
  refreshPublicSite();
  revalidatePath('/admin/website', 'layout');
}

/** Deletes a previously uploaded hero photo (bundled images are left alone). */
async function removeOldHero(src: string) {
  const key = src.startsWith('/media/') ? src.slice('/media/'.length) : '';
  if (key && isValidKey(key)) await getPhotoStorage().delete(key);
}
