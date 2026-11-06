import { sql, type SQL } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Shared columns and types                                            */
/* ------------------------------------------------------------------ */

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/** Free-form opening hours as written by a curator, plus a structured week once parsed. */
export type PlaceHours = {
  text: string;
  /** Keyed by ISO weekday (1 = Monday). Each entry is a list of [open, close] in "HH:MM". */
  weekly?: Partial<Record<"1" | "2" | "3" | "4" | "5" | "6" | "7", [string, string][]>>;
};

export type PlaceAccessibility = {
  stepFree?: boolean;
  accessibleWashroom?: boolean;
  parking?: boolean;
  transitNearby?: boolean;
  notes?: string;
};

export type SubmissionPayload = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const cityStatus = pgEnum("city_status", ["live", "coming_soon"]);
export const costBand = pgEnum("cost_band", ["free", "low", "moderate", "varies"]);
export const placeKind = pgEnum("place_kind", ["place", "event", "program", "resource"]);
export const placeStatus = pgEnum("place_status", ["published", "pending", "rejected"]);
export const userRole = pgEnum("user_role", ["user", "curator", "admin"]);
export const claimStatus = pgEnum("claim_status", ["pending", "verified", "rejected"]);
export const submissionType = pgEnum("submission_type", ["new_place", "correction"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const tipStatus = pgEnum("tip_status", ["pending", "published", "rejected"]);
/** "month" means only the month is known ("usually in July"); never shown as a day. */
export const datePrecision = pgEnum("date_precision", ["day", "month"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

/* ------------------------------------------------------------------ */
/* Auth (shape required by @auth/drizzle-adapter, plus role)           */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text().notNull().unique(),
  name: text(),
  emailVerified: timestamp({ withTimezone: true, mode: "date" }),
  image: text(),
  role: userRole().notNull().default("user"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().$type<"oauth" | "oidc" | "email" | "webauthn">().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text(),
    id_token: text("id_token"),
    session_state: text("session_state"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  ...timestamps,
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const cities = pgTable("cities", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  province: text().notNull(),
  region: text().notNull(),
  tagline: text().notNull(),
  description: text().notNull(),
  curatorNote: text(),
  heroImage: text(),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
  status: cityStatus().notNull().default("live"),
  publishedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  shortName: text().notNull(),
  accentColor: text().notNull(),
  description: text().notNull(),
  position: integer().notNull(),
  ...timestamps,
});

export const places = pgTable(
  "places",
  {
    id: uuid().primaryKey().defaultRandom(),
    cityId: uuid()
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    kind: placeKind().notNull().default("place"),
    name: text().notNull(),
    slug: text().notNull(),
    summary: text().notNull(),
    description: text().notNull(),
    highlights: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tags: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    curatorNote: text(),
    neighborhood: text(),
    address: text(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    costBand: costBand().notNull(),
    priceNote: text(),
    hours: jsonb().$type<PlaceHours>(),
    seasonal: boolean().notNull().default(false),
    seasonNote: text(),
    phone: text(),
    sourceUrl: text(),
    image: text(),
    isPick: boolean().notNull().default(false),
    accessibility: jsonb().$type<PlaceAccessibility>(),
    status: placeStatus().notNull().default("pending"),
    lastVerifiedAt: date({ mode: "string" }),
    submittedBy: text().references(() => users.id, { onDelete: "set null" }),
    claimedBy: text().references(() => users.id, { onDelete: "set null" }),
    search: tsvector().generatedAlwaysAs(
      (): SQL =>
        sql`setweight(to_tsvector('english', coalesce(${places.name}, '')), 'A') || setweight(to_tsvector('english', coalesce(${places.summary}, '')), 'B')`,
    ),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("places_city_slug_idx").on(t.cityId, t.slug),
    index("places_city_category_idx").on(t.cityId, t.categoryId),
    index("places_status_city_idx").on(t.status, t.cityId),
    index("places_lat_lng_idx").on(t.lat, t.lng),
    index("places_search_idx").using("gin", t.search),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    placeId: uuid().references(() => places.id, { onDelete: "set null" }),
    cityId: uuid()
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text().notNull(),
    startAt: timestamp({ withTimezone: true }).notNull(),
    endAt: timestamp({ withTimezone: true }),
    datePrecision: datePrecision().notNull().default("day"),
    /** Every known showing (ISO), when the source lists them. startAt is the first. */
    occurrences: jsonb().$type<string[]>(),
    costBand: costBand().notNull(),
    url: text(),
    recurrenceRule: text(),
    ...timestamps,
  },
  (t) => [index("events_city_start_idx").on(t.cityId, t.startAt)],
);

/* ------------------------------------------------------------------ */
/* Community and accounts                                              */
/* ------------------------------------------------------------------ */

export const collections = pgTable(
  "collections",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    slug: text().notNull(),
    isPublic: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("collections_user_slug_idx").on(t.userId, t.slug)],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: uuid()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    note: text(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.placeId] }),
    index("collection_items_place_idx").on(t.placeId),
  ],
);

/** What a claimant asks a curator to confirm or change. */
export type ClaimProposal = {
  hoursText?: string;
  costBand?: "free" | "low" | "moderate" | "varies";
  priceNote?: string;
  sourceUrl?: string;
  accessibility?: PlaceAccessibility;
  message?: string;
};

export const claims = pgTable(
  "claims",
  {
    id: uuid().primaryKey().defaultRandom(),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: claimStatus().notNull().default("pending"),
    /** owner, manager, staff, or other. */
    relationship: text().notNull().default("owner"),
    proposal: jsonb().$type<ClaimProposal>().notNull().default({}),
    /** Fields a curator confirmed when approving. */
    verifiedFields: jsonb().$type<Record<string, unknown>>(),
    /** True when the claimant signed in with an email at the listing's website domain. */
    domainMatch: boolean().notNull().default(false),
    reviewerId: text().references(() => users.id, { onDelete: "set null" }),
    reviewNotes: text(),
    ...timestamps,
  },
  (t) => [
    index("claims_place_idx").on(t.placeId),
    index("claims_status_idx").on(t.status, t.createdAt),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: submissionType().notNull(),
    payload: jsonb().$type<SubmissionPayload>().notNull(),
    placeId: uuid().references(() => places.id, { onDelete: "set null" }),
    contactEmail: text(),
    status: reviewStatus().notNull().default("pending"),
    reviewerId: text().references(() => users.id, { onDelete: "set null" }),
    reviewNotes: text(),
    ...timestamps,
  },
  (t) => [index("submissions_status_idx").on(t.status, t.createdAt)],
);

export const tips = pgTable(
  "tips",
  {
    id: uuid().primaryKey().defaultRandom(),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: text().references(() => users.id, { onDelete: "set null" }),
    body: text().notNull(),
    status: tipStatus().notNull().default("pending"),
    ...timestamps,
  },
  (t) => [index("tips_place_status_idx").on(t.placeId, t.status)],
);

export const subscriptions = pgTable("subscriptions", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text().notNull().unique(),
  stripeSubscriptionId: text().unique(),
  status: subscriptionStatus().notNull(),
  priceLookupKey: text(),
  currentPeriodEnd: timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: boolean().notNull().default(false),
  /** Creation time of the Stripe event last applied, so late, older events never win. */
  stripeEventAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

/** One row per Stripe event handled. Makes webhook retries no-ops. */
export const stripeEvents = pgTable("stripe_events", {
  id: text().primaryKey(),
  type: text().notNull(),
  ...timestamps,
});

/** A stop in a saved day plan. Cost is an estimate in whole dollars. */
export type PlanStop = {
  placeId: string;
  slot: string;
  time: string;
  estimate: number;
};

export const plans = pgTable(
  "plans",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Short, unguessable id used in the public share link. */
    shareId: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: uuid()
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    title: text().notNull(),
    day: date({ mode: "string" }).notNull(),
    budget: integer().notNull(),
    interests: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    stops: jsonb().$type<PlanStop[]>().notNull(),
    ...timestamps,
  },
  (t) => [index("plans_user_idx").on(t.userId, t.createdAt)],
);

export const partnerKeys = pgTable("partner_keys", {
  id: uuid().primaryKey().defaultRandom(),
  orgName: text().notNull(),
  contactEmail: text(),
  /** First characters of the key, shown so admins can tell keys apart. */
  keyPrefix: text().notNull(),
  /** SHA-256 of the full key. The key itself is shown once and never stored. */
  keyHash: text().notNull().unique(),
  scopes: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  active: boolean().notNull().default(true),
  createdBy: text().references(() => users.id, { onDelete: "set null" }),
  lastUsedAt: timestamp({ withTimezone: true }),
  revokedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

/** Fixed-window counters for the sliding-window rate limiter (src/lib/rate-limit.ts). */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text().notNull(),
    windowStart: timestamp({ withTimezone: true }).notNull(),
    count: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
