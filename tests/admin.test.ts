// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { internationalDigits, timeAgo } from '@/lib/admin/format';
import {
  parseListingForm,
  parseProfileForm,
  parseUserForm,
  safeAdminPath,
  slugify,
  toLines,
  toParagraphs,
} from '@/lib/admin/forms';
import {
  canAssignLead,
  canAssignListing,
  canDeleteListing,
  canEditListing,
  canFeatureListing,
  canManageTeam,
  canSeeLead,
} from '@/lib/admin/permissions';
import { generatePassword, hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

const COMPLETE = {
  status: 'published',
  type: 'apartment',
  deal: 'sale',
  region: 'beirut',
  price: '450,000',
  areaSqm: '180',
  bedrooms: '3',
  bathrooms: '2',
  titleEn: 'Sea-view flat in Ain El Mreisseh',
  titleAr: 'شقة مطلة على البحر في عين المريسة',
  areaEn: 'Ain El Mreisseh',
  areaAr: 'عين المريسة',
  cityEn: 'Beirut',
  cityAr: 'بيروت',
  summaryEn: 'Bright corner flat on the Corniche.',
  summaryAr: 'شقة زاوية مشرقة على الكورنيش.',
  descriptionEn: 'First paragraph.\n\nSecond paragraph\ncontinues here.',
  descriptionAr: 'الفقرة الأولى.',
  featuresEn: '- Sea view\n• Parking\n\nGenerator',
  featuresAr: 'إطلالة بحرية',
};

describe('listing form', () => {
  it('parses a complete listing, generating the slug from the English title', () => {
    const result = parseListingForm(form(COMPLETE), { today: new Date('2026-10-21T10:00:00Z') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe('sea-view-flat-in-ain-el-mreisseh');
    expect(result.data.price).toBe(450000);
    expect(result.data.listedAt).toBe('2026-10-21');
    expect(result.data.descriptionEn).toEqual(['First paragraph.', 'Second paragraph continues here.']);
    expect(result.data.featuresEn).toEqual(['Sea view', 'Parking', 'Generator']);
    expect(result.data.featured).toBe(false);
  });

  it('lets drafts be incomplete but requires both languages to publish', () => {
    const draft = parseListingForm(form({ ...COMPLETE, status: 'draft', titleAr: '', descriptionAr: '' }));
    expect(draft.ok).toBe(true);
    const published = parseListingForm(form({ ...COMPLETE, titleAr: '', descriptionAr: '' }));
    expect(published.ok).toBe(false);
    if (!published.ok) {
      expect(published.fieldErrors.titleAr).toMatch(/publish/);
      expect(published.fieldErrors.descriptionAr).toMatch(/publish/);
    }
  });

  it('rejects bad numbers, enums, dates and slugs', () => {
    const result = parseListingForm(
      form({ ...COMPLETE, id: 'Bad Slug!', price: '-5', type: 'castle', region: 'mars', bedrooms: '2.5', listedAt: '2026-13-45' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(['bedrooms', 'id', 'listedAt', 'price', 'region', 'type'].sort());
  });

  it('drops room counts and year for land, and strips markup from text', () => {
    const result = parseListingForm(form({ ...COMPLETE, type: 'land', yearBuilt: '2001', titleEn: '<b>Olive grove</b> plot' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.bedrooms).toBeNull();
    expect(result.data.yearBuilt).toBeNull();
    expect(result.data.titleEn).toBe('Olive grove plot');
  });

  it('text helpers', () => {
    expect(slugify('  Café & Villa — Batroun!! ')).toBe('cafe-villa-batroun');
    expect(toParagraphs('a\nb\n\n\nc')).toEqual(['a b', 'c']);
    expect(toLines('* one\n\n- two ')).toEqual(['one', 'two']);
  });
});

describe('team forms', () => {
  it('validates accounts', () => {
    expect(parseUserForm(form({ name: 'Rita', email: 'RITA@Example.com ', role: 'advisor' }))).toEqual({
      ok: true,
      data: { name: 'Rita', email: 'rita@example.com', role: 'advisor', active: true },
    });
    const bad = parseUserForm(form({ name: '', email: 'nope', role: 'owner' }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.fieldErrors).sort()).toEqual(['email', 'name', 'role']);
  });

  it('validates profiles and derives the dialling digits', () => {
    const ok = parseProfileForm(
      form({
        nameAr: 'ريتا',
        titleEn: 'Advisor',
        titleAr: 'مستشارة',
        languagesEn: 'Arabic, English',
        languagesAr: 'العربية والإنجليزية',
        phoneDisplay: '+961 3 123 456',
        regions: ['beirut', 'metn', 'atlantis', 'beirut'],
        visible: 'on',
        sortOrder: '2',
      }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.phoneDigits).toBe('9613123456');
      expect(ok.data.regions).toEqual(['beirut', 'metn']);
      expect(ok.data.visible).toBe(true);
    }
    const bad = parseProfileForm(form({ phoneDisplay: '123' }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.fieldErrors.phoneDisplay).toBeTruthy();
  });

  it('only redirects to admin paths after sign-in', () => {
    expect(safeAdminPath('/admin/leads?status=new')).toBe('/admin/leads?status=new');
    for (const evil of ['https://evil.example', '//evil.example', '/admin//evil.example', '/admin/../en', '/en', null]) {
      expect(safeAdminPath(evil)).toBe('/admin');
    }
  });
});

describe('permissions', () => {
  const admin = { id: 'a', role: 'admin' as const };
  const advisor = { id: 'b', role: 'advisor' as const };

  it('admins manage everything; advisors only what is theirs', () => {
    expect(canEditListing(admin, { advisorId: 'z' })).toBe(true);
    expect(canEditListing(advisor, { advisorId: 'b' })).toBe(true);
    expect(canEditListing(advisor, { advisorId: 'z' })).toBe(false);
    expect(canEditListing(advisor, { advisorId: null })).toBe(false);
    expect(canSeeLead(advisor, { assigneeId: 'b' })).toBe(true);
    expect(canSeeLead(advisor, { assigneeId: null })).toBe(false);
    for (const check of [canAssignListing, canFeatureListing, canDeleteListing, canAssignLead, canManageTeam]) {
      expect(check(admin)).toBe(true);
      expect(check(advisor)).toBe(false);
    }
  });
});

describe('passwords', () => {
  it('hashes with a salt and verifies only the right password', async () => {
    const a = await hashPassword('correct horse battery');
    const b = await hashPassword('correct horse battery');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse battery', a)).toBe(true);
    expect(await verifyPassword('Correct horse battery', a)).toBe(false);
    expect(await verifyPassword('anything', null)).toBe(false);
    expect(await verifyPassword('anything', 'md5$abc')).toBe(false);
  });

  it('enforces the policy and generates compliant passwords', () => {
    expect(passwordProblem('short')).toMatch(/12/);
    expect(passwordProblem('aaaaaaaaaaaaaaaa')).toBeTruthy();
    expect(passwordProblem('a long enough phrase')).toBeNull();
    const generated = generatePassword();
    expect(generated).toMatch(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);
    expect(passwordProblem(generated)).toBeNull();
  });
});

describe('admin formatting', () => {
  it('turns local Lebanese numbers into international digits', () => {
    expect(internationalDigits('03 123 456')).toBe('9613123456');
    expect(internationalDigits('+961 3 123 456')).toBe('9613123456');
    expect(internationalDigits('00961 3 123456')).toBe('9613123456');
  });

  it('describes recent times in words', () => {
    const now = Date.parse('2026-10-21T12:00:00Z');
    expect(timeAgo('2026-10-21T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-10-21T11:15:00Z', now)).toBe('45 min ago');
    expect(timeAgo('2026-10-20T10:00:00Z', now)).toBe('yesterday');
    expect(timeAgo('2026-09-01T10:00:00Z', now)).toBe('1 Sept 2026');
  });
});
