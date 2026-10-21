import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/*
 * Al Khoury Real Estate database (SQLite via libSQL). Written with Drizzle's SQLite dialect, so the
 * same schema runs on a local file or on Turso; moving to Postgres means switching the dialect import.
 * Timestamps are ISO 8601 strings in UTC.
 */

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const ROLES = ['admin', 'advisor'] as const;
export type Role = (typeof ROLES)[number];

export const LISTING_STATUSES = ['draft', 'published', 'archived'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LEAD_KINDS = ['enquiry', 'viewing', 'valuation'] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Staff accounts. `passwordHash` is null until an admin sets a password (the account cannot sign in). */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ROLES }).notNull().default('advisor'),
  passwordHash: text('password_hash'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(now),
  lastLoginAt: text('last_login_at'),
});

/** The public face of a staff member, shown on property pages. One per user, optional. */
export const advisorProfiles = sqliteTable('advisor_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  nameAr: text('name_ar').notNull(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  languagesEn: text('languages_en').notNull(),
  languagesAr: text('languages_ar').notNull(),
  phoneDisplay: text('phone_display').notNull(),
  /** International digits only (used for tel: and wa.me). */
  phoneDigits: text('phone_digits').notNull(),
  /** Region values this advisor covers (JSON array). */
  regions: text('regions', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** Signed-in sessions. The cookie holds a random token; only its SHA-256 is stored. */
export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const listings = sqliteTable(
  'listings',
  {
    /** URL slug, used in /listings/[id]. */
    id: text('id').primaryKey(),
    status: text('status', { enum: LISTING_STATUSES }).notNull().default('draft'),
    type: text('type').notNull(),
    deal: text('deal').notNull(),
    region: text('region').notNull(),
    price: integer('price').notNull(),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    areaSqm: integer('area_sqm').notNull(),
    plotSqm: integer('plot_sqm'),
    yearBuilt: integer('year_built'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    /** Date shown as "Listed on" (YYYY-MM-DD). */
    listedAt: text('listed_at').notNull(),
    advisorId: text('advisor_id').references(() => users.id, { onDelete: 'set null' }),
    titleEn: text('title_en').notNull(),
    titleAr: text('title_ar').notNull(),
    areaEn: text('area_en').notNull(),
    areaAr: text('area_ar').notNull(),
    cityEn: text('city_en').notNull(),
    cityAr: text('city_ar').notNull(),
    summaryEn: text('summary_en').notNull(),
    summaryAr: text('summary_ar').notNull(),
    /** JSON arrays: description paragraphs and feature bullets. */
    descriptionEn: text('description_en', { mode: 'json' }).$type<string[]>().notNull(),
    descriptionAr: text('description_ar', { mode: 'json' }).$type<string[]>().notNull(),
    featuresEn: text('features_en', { mode: 'json' }).$type<string[]>().notNull(),
    featuresAr: text('features_ar', { mode: 'json' }).$type<string[]>().notNull(),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (t) => [index('listings_status_idx').on(t.status), index('listings_advisor_idx').on(t.advisorId)],
);

/** Photos of a listing; position 0 is the cover. `storageKey` is set for uploaded files. */
export const listingPhotos = sqliteTable(
  'listing_photos',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    src: text('src').notNull(),
    storageKey: text('storage_key'),
    altEn: text('alt_en').notNull().default(''),
    altAr: text('alt_ar').notNull().default(''),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('photos_listing_idx').on(t.listingId, t.position)],
);

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: LEAD_KINDS }).notNull(),
    status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
    locale: text('locale').notNull(),
    listingId: text('listing_id').references(() => listings.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    message: text('message'),
    /** Kind-specific fields (viewing date/time, valuation intent/type/region/size). */
    details: text('details', { mode: 'json' })
      .$type<Record<string, string | number | null>>()
      .notNull()
      .default(sql`'{}'`),
    assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (t) => [index('leads_status_idx').on(t.status, t.createdAt), index('leads_assignee_idx').on(t.assigneeId)],
);

export const leadNotes = sqliteTable('lead_notes', {
  id: text('id').primaryKey(),
  leadId: text('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().default(now),
});

/** Audit trail shown on the dashboard ("Nadine published Pine-view villa"). */
export const activity = sqliteTable(
  'activity',
  {
    id: text('id').primaryKey(),
    at: text('at').notNull().default(now),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    summary: text('summary').notNull(),
  },
  (t) => [index('activity_at_idx').on(t.at)],
);

/** Failed sign-in attempts, for throttling (kept in the DB so limits survive restarts). */
export const loginAttempts = sqliteTable(
  'login_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull(),
    at: text('at').notNull().default(now),
  },
  (t) => [index('login_attempts_key_idx').on(t.key, t.at)],
);

export type UserRow = typeof users.$inferSelect;
export type ListingRow = typeof listings.$inferSelect;
export type ListingPhotoRow = typeof listingPhotos.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type AdvisorProfileRow = typeof advisorProfiles.$inferSelect;
