/**
 * Seeds cities, categories, and places from the legacy CityRoots dataset.
 * Idempotent: ids are derived from stable keys, and rows are upserted, so
 * re-running never duplicates data or breaks links.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { categories, cities, events, places } from "../src/lib/db/schema";
import { CATEGORIES, LEGACY_CATEGORY_MAP } from "../src/lib/domain/categories";
import { COST_BANDS } from "../src/lib/domain/cost";
import { cleanCopy, firstSentence, slugify } from "../src/lib/domain/copy";
import { deriveEventDates } from "../src/lib/domain/event-dates";
import { parseWeeklyHours } from "../src/lib/domain/hours";
import { describeTarget, scriptDatabase } from "./db-config";

const DATA_DIR = path.join(import.meta.dirname, "seed-data", "cities");

const legacyPlace = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["place", "event", "program", "resource"]),
  category: z.string().refine((c) => c in LEGACY_CATEGORY_MAP, "unknown category"),
  tags: z.array(z.string()).default([]),
  cost: z.enum(COST_BANDS),
  costNote: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  website: z.url().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  description: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  why: z.string().optional(),
  isRecommended: z.boolean().default(false),
  seasonal: z.boolean().optional(),
  seasonNote: z.string().optional(),
  /** Exact showings, from a feed that has them. Takes priority over parsing season notes. */
  occurrences: z.array(z.iso.datetime()).optional(),
  endsAt: z.iso.datetime().optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const legacyCity = z.object({
  cityId: z.string().min(1),
  cityName: z.string().min(1),
  province: z.string().min(1),
  tagline: z.string().min(1),
  heroDescription: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  places: z.array(legacyPlace),
});

type LegacyPlace = z.infer<typeof legacyPlace>;

const REGIONS: Record<string, string> = {
  newmarket: "York Region",
  "richmond-hill": "York Region",
  markham: "York Region",
  vaughan: "York Region",
  oakville: "Halton Region",
  burlington: "Halton Region",
  kitchener: "Waterloo Region",
  waterloo: "Waterloo Region",
  cambridge: "Waterloo Region",
  toronto: "City of Toronto",
};

/** `--city=toronto` seeds one city and leaves every other row untouched. */
const ONLY_CITY = process.argv.find((a) => a.startsWith("--city="))?.slice("--city=".length);

/** RFC 4122 version 5 UUID, so the same input always yields the same id. */
function stableId(key: string): string {
  const hash = createHash("sha1").update(`cityroots:${key}`).digest();
  hash[6] = ((hash[6] ?? 0) & 0x0f) | 0x50;
  hash[8] = ((hash[8] ?? 0) & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Keeps the most recently verified record when the legacy data lists a place twice. */
function dedupe(list: LegacyPlace[]): { kept: LegacyPlace[]; dropped: string[] } {
  const byId = new Map<string, LegacyPlace>();
  const dropped: string[] = [];
  for (const p of list) {
    const existing = byId.get(p.id);
    if (!existing) byId.set(p.id, p);
    else {
      dropped.push(p.id);
      if (p.lastVerified > existing.lastVerified) byId.set(p.id, p);
    }
  }
  return { kept: [...byId.values()], dropped };
}

function hoursFromText(text: string) {
  const weekly = parseWeeklyHours(text);
  return weekly ? { text, weekly } : { text };
}

function optionalClean(value: string | undefined): string | null {
  return value ? cleanCopy(value) : null;
}

const retired = JSON.parse(
  readFileSync(path.join("scripts", "seed-data", "retired.json"), "utf8"),
) as { city: string; id: string }[];

async function main() {
  const db = scriptDatabase();
  console.log(`Seeding ${describeTarget()}`);

  const categoryIds = new Map<string, string>();
  for (const [position, c] of CATEGORIES.entries()) {
    const id = stableId(`category/${c.slug}`);
    categoryIds.set(c.slug, id);
    const row = {
      id,
      slug: c.slug,
      name: c.name,
      shortName: c.shortName,
      accentColor: c.accent,
      description: c.description,
      position,
    };
    await db.insert(categories).values(row).onConflictDoUpdate({ target: categories.id, set: row });
  }

  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const expected = { total: 0, events: 0, byCost: { free: 0, low: 0, moderate: 0, varies: 0 } };

  for (const file of files) {
    const city = legacyCity.parse(JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")));
    const citySlug = city.cityId;
    if (ONLY_CITY && citySlug !== ONLY_CITY) continue;
    const cityId = stableId(`city/${citySlug}`);
    const heroPath = `/cities/${citySlug}/hero.jpg`;
    const cityRow = {
      id: cityId,
      slug: citySlug,
      name: city.cityName,
      province: city.province,
      region: REGIONS[citySlug] ?? "Ontario",
      tagline: cleanCopy(city.tagline),
      description: cleanCopy(city.heroDescription),
      heroImage: existsSync(path.join("public", heroPath)) ? heroPath : null,
      lat: city.lat,
      lng: city.lng,
      status: "live" as const,
      publishedAt: new Date("2026-06-01T00:00:00Z"),
    };
    await db.insert(cities).values(cityRow).onConflictDoUpdate({ target: cities.id, set: cityRow });

    const { kept, dropped } = dedupe(city.places);
    if (dropped.length > 0)
      console.log(`  ${citySlug}: merged duplicate ids ${dropped.join(", ")}`);

    // Runs before the inserts, because a real place can take over a retired listing's name.
    const listed = new Set(kept.map((p) => stableId(`place/${citySlug}/${p.id}`)));
    // Listings that failed verification. Hidden rather than deleted, so anyone who saved one
    // keeps the record, and their slug is freed for a real place of the same name.
    const retiring = retired
      .filter((r) => r.city === citySlug)
      .map((r) => stableId(`place/${citySlug}/${r.id}`))
      .filter((id) => !listed.has(id));
    for (const id of retiring) {
      await db.delete(events).where(eq(events.placeId, id));
      await db
        .update(places)
        .set({ status: "rejected", slug: `retired-${id}` })
        .where(eq(places.id, id));
    }
    if (retiring.length > 0) console.log(`  ${citySlug}: retired ${retiring.length} listings`);
    const usedSlugs = new Set<string>();
    const keptIds = new Set<string>();
    for (const p of kept) {
      // Feed events come and go, so a counter would hand their slugs from one row to another
      // between runs and break the unique index. Their ids never change.
      let slug = slugify(p.occurrences ? p.id : p.name);
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(p.name)}-${n}`;
      usedSlugs.add(slug);

      const categorySlug = LEGACY_CATEGORY_MAP[p.category];
      const categoryId = categorySlug ? categoryIds.get(categorySlug) : undefined;
      if (!categoryId) throw new Error(`No category for ${p.id} (${p.category})`);

      const description = cleanCopy(p.description);
      const imagePath = `/cities/${citySlug}/places/${slug}.jpg`;
      const row = {
        id: stableId(`place/${citySlug}/${p.id}`),
        cityId,
        categoryId,
        kind: p.type,
        name: cleanCopy(p.name),
        slug,
        summary: firstSentence(description),
        description,
        highlights: p.highlights.map(cleanCopy),
        tags: p.tags.map(cleanCopy),
        curatorNote: optionalClean(p.why),
        neighborhood: optionalClean(p.neighborhood),
        address: optionalClean(p.address),
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        costBand: p.cost,
        priceNote: optionalClean(p.costNote),
        hours: p.hours ? hoursFromText(cleanCopy(p.hours)) : null,
        seasonal: p.seasonal ?? false,
        seasonNote: optionalClean(p.seasonNote),
        phone: p.phone ?? null,
        sourceUrl: p.website ?? null,
        image: existsSync(path.join("public", imagePath)) ? imagePath : null,
        isPick: p.isRecommended,
        status: "published" as const,
        lastVerifiedAt: p.lastVerified,
        createdAt: new Date(`${p.lastVerified}T12:00:00Z`),
      };
      await db.insert(places).values(row).onConflictDoUpdate({ target: places.id, set: row });
      keptIds.add(row.id);

      // Recurring events with a named month go on the calendar.
      if (p.type === "event") {
        const exact = p.occurrences?.[0]
          ? {
              startAt: new Date(p.occurrences[0]),
              endAt: new Date(
                p.endsAt ?? p.occurrences[p.occurrences.length - 1] ?? p.occurrences[0],
              ),
              precision: "day" as const,
            }
          : null;
        const dates =
          exact ??
          deriveEventDates([p.seasonNote, p.hours].filter(Boolean).join(" | "), new Date());
        if (dates) {
          const event = {
            id: stableId(`event/${citySlug}/${p.id}`),
            placeId: row.id,
            cityId,
            title: row.name,
            description: row.summary,
            startAt: dates.startAt,
            endAt: dates.endAt,
            datePrecision: dates.precision,
            costBand: p.cost,
            url: p.website ?? null,
            occurrences: p.occurrences ?? null,
            recurrenceRule: exact ? null : "FREQ=YEARLY",
          };
          await db
            .insert(events)
            .values(event)
            .onConflictDoUpdate({ target: events.id, set: event });
          expected.events++;
        }
      }
      expected.total++;
      expected.byCost[p.cost]++;
    }
    // Feed events that have dropped out of the source are over or cancelled.
    if (city.places.some((p) => p.occurrences)) {
      const stale = await db
        .select({ id: places.id })
        .from(places)
        .where(
          and(
            eq(places.cityId, cityId),
            eq(places.kind, "event"),
            eq(places.status, "published"),
            notInArray(places.id, [...keptIds]),
          ),
        );
      for (const { id } of stale) {
        await db.delete(events).where(eq(events.placeId, id));
        await db.update(places).set({ status: "rejected" }).where(eq(places.id, id));
      }
      if (stale.length > 0) console.log(`  ${citySlug}: retired ${stale.length} finished events`);
    }
    console.log(`  ${citySlug}: ${kept.length} places`);
  }

  // Verify the database matches the source data exactly.
  const counts = await db
    .select({ cost: places.costBand, n: sql<number>`count(*)::int` })
    .from(places)
    .where(sql`${places.status} = 'published'`)
    .groupBy(places.costBand);
  const actual = Object.fromEntries(counts.map((c) => [c.cost, c.n]));
  for (const band of COST_BANDS) {
    if ((actual[band] ?? 0) < expected.byCost[band]) {
      throw new Error(
        `Cost band ${band}: expected ${expected.byCost[band]}, found ${actual[band] ?? 0}`,
      );
    }
  }
  console.log(
    `Seeded ${files.length} cities, ${CATEGORIES.length} categories, ${expected.total} places`,
  );
  console.log(`  by cost: ${JSON.stringify(expected.byCost)}`);
  console.log(`  ${expected.events} calendar events`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
