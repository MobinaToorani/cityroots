/**
 * Builds scripts/seed-data/cities/toronto.json from City of Toronto open data
 * (Open Government Licence - Toronto) plus the hand-checked layer in
 * scripts/seed-data/toronto-curated.json. Every source is normalized to the
 * city file format, de-duplicated by name and distance, placed in an official
 * neighbourhood, and link-checked.
 *
 *   npm run data:toronto
 *
 * Downloads are cached in .data/toronto-cache for a day. Delete it to force a refresh.
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { z } from "zod";

const CACHE = ".data/toronto-cache";
const OUT = "scripts/seed-data/cities/toronto.json";
const CURATED = "scripts/seed-data/toronto-curated.json";
const CKAN = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
const DAY = 86_400_000;
const today = new Date().toISOString().slice(0, 10);
/** Events more than this far ahead are left for a later refresh. */
const EVENT_WINDOW_DAYS = 90;
/** Keeps the list to what the product promises: free and affordable. */
const MAX_TICKET_LOW = 50;

const SOURCES = {
  festivals:
    "/dataset/9201059e-43ed-4369-885e-0b867652feac/resource/8900fdb2-7f6c-4f50-8581-b463311ff05d/download/file.json",
  museums:
    "/dataset/29d28f67-6b5f-4d9c-803f-eb4ae890d825/resource/910d0a01-21a6-4408-be7c-0b93ec4d86bf/download/museums-and-cultural-centres.json",
  poi: "/dataset/965247c0-c72e-49b4-bb1a-879cf98e1a32/resource/d3e9668a-1c2b-4250-8aba-32a80bb2266d/download/places-of-interest-and-attractions-4326.geojson",
  music:
    "/dataset/c52cdef8-7b21-40f9-9404-a8c1b20f4a7e/resource/497b8565-b775-4eaa-bd23-0ae8d7603161/download/music-locations-4326.geojson",
  hotspot:
    "/dataset/c7be2ee7-d317-4a28-8cbe-bff1ce116b46/resource/a169dc01-c584-418e-9fa9-66d85ce437ca/download/points-of-interest-4326.geojson",
  libraries:
    "/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/resource/5f4950b4-c727-4e54-8d0d-972e198268d6/download/tpl-branch-general-information-4326.geojson",
  parks:
    "/dataset/cbea3a67-9168-4c6d-8186-16ac1a795b5b/resource/f6cdcd50-da7b-4ede-8e60-c3cdba70b559/download/parks-and-recreation-facilities-4326.geojson",
  hoods:
    "/dataset/fc443770-ef0a-4025-9c2c-2cb558bfab00/resource/0719053b-28b7-48ea-b863-068823a93aaa/download/neighbourhoods-4326.geojson",
  rec_locations: "/datastore/dump/f23ac1ad-6f46-4b59-811f-eb34be9b1f7a",
  rec_dropins: "/datastore/dump/c99ec04f-4540-482c-9ee4-efb38774eab4",
  addresses:
    "/dataset/abedd8bc-e3dd-4d45-8e69-79165a76e4fa/resource/64d4e54b-738f-4cd9-a9e7-8050fac8a52f/download/address-points-4326.csv",
} as const;

const OGL = "Open Government Licence - Toronto";

export type OutPlace = {
  id: string;
  name: string;
  type: "place" | "event" | "program" | "resource";
  category: string;
  tags: string[];
  cost: "free" | "low" | "moderate" | "varies";
  costNote?: string;
  address?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  website?: string;
  phone?: string;
  hours?: string;
  description: string;
  highlights: string[];
  isRecommended: boolean;
  seasonal?: boolean;
  seasonNote?: string;
  lastVerified: string;
  /** Exact dates from the City's feed: every showing still to come. */
  occurrences?: string[];
  endsAt?: string;
};

async function cached(key: keyof typeof SOURCES, ext: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${key}.${ext}`);
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < DAY) return file;
  console.log(`  downloading ${key}`);
  const res = await fetch(`${CKAN}${SOURCES[key]}`);
  if (!res.ok || !res.body) throw new Error(`${key}: HTTP ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function loadJson<T>(key: keyof typeof SOURCES, ext = "json"): Promise<T> {
  return JSON.parse(readFileSync(await cached(key, ext), "utf8")) as T;
}

type Feature<P> = {
  properties: P;
  geometry: { type: string; coordinates: unknown };
};

/** Parses one CSV line, honouring quotes. Records may not span lines here. */
function csvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Full CSV parser for files whose records span several lines. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

/* ------------------------------ text helpers ----------------------------- */

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

function clean(value: string | null | undefined): string {
  if (!value || value === "None") return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&[a-z]+;/g, " ")
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts at a sentence end, so long source text stays readable. */
function excerpt(text: string, max = 420): string {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 80 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

const SMALL = new Set(["and", "of", "the", "at", "in", "on", "for", "de"]);
function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => {
      if (i > 0 && SMALL.has(w)) return w;
      return w.replace(/(^|[-'(/])([a-z])/g, (_, p: string, l: string) => p + l.toUpperCase());
    })
    .join(" ")
    .replace(/\bSt\b(?!\.)/g, "St.")
    .replace(/'S\b/g, "'s")
    .replace(/\b(Nw|Ne|Sw|Se)\b/g, (m) => m.toUpperCase());
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Comparable name: no case, punctuation, or generic words. */
function nameKey(value: string): string {
  return slug(value)
    .replace(
      /\b(the|toronto|park|parks|and|gardens?|centre|center|community|recreation|beach|museum)\b/g,
      "",
    )
    .replace(/-+/g, "")
    .trim();
}

function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function firstPoint(geometry: Feature<unknown>["geometry"]): [number, number] | null {
  const c = geometry.coordinates as number[] | number[][];
  const point = Array.isArray(c[0]) ? (c[0] as number[]) : (c as number[]);
  const [lng, lat] = point;
  return typeof lat === "number" && typeof lng === "number" ? [lng, lat] : null;
}

function normalizeHours(raw: string | null | undefined): string | undefined {
  const text = clean(raw);
  if (!text) return undefined;
  return text
    .replace(/(\d)\s*a\.m\./g, "$1am")
    .replace(/(\d)\s*p\.m\./g, "$1pm")
    .replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) Closed;?\s*/g, "")
    .replace(/;\s*$/, "");
}

/* ----------------------------- neighbourhoods ---------------------------- */

type Ring = [number, number][];
type Hood = { name: string; rings: Ring[] };

function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function metres(a: [number, number], b: [number, number]): number {
  const dx = (a[0] - b[0]) * 111_320 * Math.cos((a[1] * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110_540;
  return Math.hypot(dx, dy);
}

/* ---------------------------------- run ---------------------------------- */

const curatedFile = z
  .object({
    city: z.object({
      tagline: z.string(),
      heroDescription: z.string(),
      lat: z.number(),
      lng: z.number(),
    }),
    poiOverrides: z.object({
      drop: z.array(z.string()),
      rename: z.record(z.string(), z.string()),
      cost: z.record(z.string(), z.tuple([z.string(), z.string().nullable()])),
    }),
    places: z.array(z.looseObject({ id: z.string(), name: z.string() })),
  })
  .parse(JSON.parse(readFileSync(CURATED, "utf8")));

async function main() {
  console.log("Loading sources");
  const hoodFeatures = (
    await loadJson<{ features: Feature<{ AREA_NAME: string }>[] }>("hoods", "geojson")
  ).features;
  const hoods: Hood[] = hoodFeatures.map((f) => {
    const c = f.geometry.coordinates as number[][][][] | number[][][];
    const polys = f.geometry.type === "MultiPolygon" ? (c as number[][][][]) : [c as number[][][]];
    return { name: f.properties.AREA_NAME, rings: polys.map((p) => p[0] as Ring) };
  });
  const hoodOf = (lng?: number, lat?: number) => {
    if (lng === undefined || lat === undefined) return undefined;
    return hoods.find((h) => h.rings.some((r) => inRing([lng, lat], r)))?.name;
  };

  const all: OutPlace[] = [];
  const counts: Record<string, number> = {};
  const seen: { key: string; at?: [number, number] }[] = [];

  /** Keeps the first record for a place. Later sources never overwrite curated data. */
  function add(
    source: string,
    place: Omit<OutPlace, "isRecommended" | "lastVerified" | "id"> & {
      id?: string;
      isRecommended?: boolean;
    },
  ) {
    const key = nameKey(place.name);
    const at =
      place.lng !== undefined && place.lat !== undefined
        ? ([place.lng, place.lat] as [number, number])
        : undefined;
    const dupe = seen.some((s) => {
      if (s.key === key && key.length > 0) return true;
      return Boolean(
        s.at &&
        at &&
        s.key.length > 3 &&
        key.length > 3 &&
        metres(s.at, at) < 120 &&
        (s.key.includes(key) || key.includes(s.key)),
      );
    });
    if (dupe && place.type !== "event") return false;
    seen.push({ key, at });
    all.push({
      isRecommended: false,
      lastVerified: today,
      ...place,
      id: place.id ?? `toronto-${slug(place.name)}`,
      neighborhood: place.neighborhood ?? hoodOf(place.lng, place.lat),
      description: clean(place.description),
    });
    counts[source] = (counts[source] ?? 0) + 1;
    return true;
  }

  /* 1. Curated: wins every duplicate check. Missing coordinates come from address points. */
  for (const raw of curatedFile.places) add("curated", raw as unknown as OutPlace);

  /* 2. City museums, which have reliable weekly hours. */
  const museums =
    await loadJson<{ "Museums and Cultural Centres": string; Address: string; Hours: string }[]>(
      "museums",
    );
  const museumHours = new Map(
    museums.map((m) => [nameKey(m["Museums and Cultural Centres"]), normalizeHours(m.Hours)]),
  );

  /* 3. Places of interest. */
  const poi = (
    await loadJson<{ features: Feature<Record<string, string | number | null>>[] }>(
      "poi",
      "geojson",
    )
  ).features;
  const POI_CATEGORY: Record<string, { category: string; cost: OutPlace["cost"]; tag: string }> = {
    Museum: { category: "arts", cost: "free", tag: "museum" },
    Gallery: { category: "arts", cost: "free", tag: "gallery" },
    Landmark: { category: "arts", cost: "free", tag: "landmark" },
    "Nature/ Park": { category: "physical", cost: "free", tag: "outdoors" },
    "Garden / Conservatory": { category: "mental", cost: "free", tag: "garden" },
    "Featured Park": { category: "arts", cost: "free", tag: "public art" },
    Attraction: { category: "events", cost: "varies", tag: "attraction" },
    "Performing Arts": { category: "dance-music", cost: "varies", tag: "performing arts" },
  };
  const drop = new Set(curatedFile.poiOverrides.drop);
  for (const f of poi) {
    const p = f.properties;
    const original = clean(String(p.NAME ?? ""));
    const meta = POI_CATEGORY[String(p.CATEGORY)];
    if (!meta || drop.has(original)) continue;
    const name = curatedFile.poiOverrides.rename[original] ?? original;
    const override = curatedFile.poiOverrides.cost[name];
    const pt = firstPoint(f.geometry);
    const website = clean(String(p.WEBSITE ?? ""));
    // The feed sometimes drops the period between sentences after a year.
    const description = excerpt(
      String(p.ATTRACTION ?? "").replace(/(\d{4}) (The|It|This) /g, "$1. $2 "),
    );
    if (description.length < 30) continue;
    const isCityMuseum = museumHours.has(nameKey(name));
    add("poi", {
      name,
      type: "place",
      category: meta.category,
      tags: [meta.tag],
      cost: (override?.[0] as OutPlace["cost"]) ?? meta.cost,
      costNote:
        override?.[1] ?? (meta.category === "dance-music" ? "Tickets vary by show." : undefined),
      address: clean(String(p.ADDRESS_FULL ?? "")) || undefined,
      lng: pt?.[0],
      lat: pt?.[1],
      website: /^https?:/.test(website) && !website.includes("g.co") ? website : undefined,
      phone: clean(String(p.PHONE ?? "")) || undefined,
      hours: isCityMuseum ? museumHours.get(nameKey(name)) : undefined,
      description,
      highlights: isCityMuseum ? ["Free general admission", "Run by the City"] : [],
    });
  }

  /* 4. Libraries: research and district branches plus digital hubs, not all 100. */
  const libraries = (
    await loadJson<{ features: Feature<Record<string, string | number | null>>[] }>(
      "libraries",
      "geojson",
    )
  ).features;
  for (const f of libraries) {
    const p = f.properties;
    const tier = String(p["Service Tier"]);
    if (Number(p.PhysicalBranch) !== 1) continue;
    if (!(tier === "DL" || tier === "RR" || Number(p.DIH) === 1)) continue;
    const pt = firstPoint(f.geometry);
    const branch = clean(String(p.BranchName));
    const features = [
      Number(p.DIH) === 1 && "Digital Innovation Hub",
      Number(p.KidsStop) === 1 && "KidsStop early-literacy space",
      Number(p.YouthHub) === 1 && "Youth Hub",
      "Free wifi and study space",
    ].filter(Boolean) as string[];
    add("libraries", {
      name: /library|collection/i.test(branch) ? branch : `${branch} Library`,
      type: "place",
      category: "mental",
      tags: ["library", "free wifi", "study", "rainy day"],
      cost: "free",
      address: clean(String(p.Address)).replace(/, Toronto, ON.*$/, ""),
      lng: pt?.[0],
      lat: pt?.[1],
      website: clean(String(p.Website)) || undefined,
      phone: clean(String(p.Telephone)) || undefined,
      hours: normalizeHours(String(p.Hours)),
      neighborhood: clean(String(p.NBHDName)) || undefined,
      description: `A Toronto Public Library branch with ${listPhrase(features.map((x) => x.toLowerCase().replace("digital innovation hub", "a Digital Innovation Hub").replace("kidsstop", "a KidsStop").replace("youth hub", "a Youth Hub")))}.`,
      highlights: features,
    });
  }

  /* 5. Parks and community centres, ranked by what you can do there, one per neighbourhood. */
  const locationRows = parseCsv(readFileSync(await cached("rec_locations", "csv"), "utf8"));
  const locationById = new Map(locationRows.map((r) => [r["Location ID"], r]));
  const dropinRows = parseCsv(readFileSync(await cached("rec_dropins", "csv"), "utf8"));
  const dropins = new Map<string, Set<string>>();
  for (const r of dropinRows) {
    const id = r["Location ID"] ?? "";
    const title = clean(r["Course Title"]);
    if (!title) continue;
    if (!dropins.has(id)) dropins.set(id, new Set());
    dropins.get(id)?.add(title);
  }

  const parks = (
    await loadJson<{ features: Feature<Record<string, string | null>>[] }>("parks", "geojson")
  ).features;
  const WEIGHT: Record<string, number> = {
    Beach: 6,
    "Outdoor Track": 2,
    "Disc Golf": 3,
    Firepit: 3,
    "Picnic Site": 2,
    Skateboarding: 2,
    "Dog Off-Leash Area": 2,
    "Outdoor Fitness Equipment": 1,
    "Outdoor Ping Pong/Table Tennis": 1,
    Washroom: 1,
    "Wi-Fi": 1,
    Playground: 1,
    "Tennis Court": 1,
    "Basketball Court": 1,
    "Pickleball Court": 1,
    "Ball Diamond": 1,
    "Sports Field": 1,
    "Cricket Pitch Field": 1,
    "Outdoor Dry Pad": 1,
  };
  const amenitiesOf = (f: Feature<Record<string, string | null>>) =>
    clean(f.properties.AMENITIES)
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a && a !== "None");
  const score = (f: Feature<Record<string, string | null>>) =>
    amenitiesOf(f).reduce((n, a) => n + (WEIGHT[a] ?? 0), 0);
  const AMENITY_WORD: Record<string, string> = {
    "Outdoor Ping Pong/Table Tennis": "ping pong tables",
    "Outdoor Fitness Equipment": "outdoor fitness equipment",
    "Dog Off-Leash Area": "an off-leash dog area",
    "Picnic Site": "picnic sites",
    "Wi-Fi": "free wifi",
    Firepit: "a firepit",
    Beach: "a beach",
    Playground: "a playground",
    "Tennis Court": "tennis courts",
    "Pickleball Court": "pickleball courts",
    "Basketball Court": "a basketball court",
    "Ball Diamond": "a ball diamond",
    "Sports Field": "a sports field",
    Skateboarding: "a skatepark",
    "Disc Golf": "disc golf",
    Washroom: "washrooms",
    "Outdoor Track": "a running track",
    "Cricket Pitch Field": "a cricket pitch",
    "Outdoor Dry Pad": "an outdoor pad",
  };

  const takeHood = new Set<string>();
  const rankedParks = parks
    .filter((f) => f.properties.TYPE === "Park")
    .sort((a, b) => score(b) - score(a));
  let parksTaken = 0;
  for (const f of rankedParks) {
    if (parksTaken >= 70) break;
    const pt = firstPoint(f.geometry);
    const hood = hoodOf(pt?.[0], pt?.[1]);
    if (!pt || !hood || takeHood.has(hood) || score(f) < 3) continue;
    // Most distinctive first, so a beach is named before a ball diamond.
    const amenities = amenitiesOf(f).sort((a, b) => (WEIGHT[b] ?? 0) - (WEIGHT[a] ?? 0));
    const name = titleCase(clean(f.properties.ASSET_NAME));
    const words = amenities.map((a) => AMENITY_WORD[a]).filter(Boolean) as string[];
    const added = add("parks", {
      name,
      type: "place",
      category: "physical",
      tags: ["park", "outdoors", ...amenities.slice(0, 5).map((a) => a.toLowerCase())],
      cost: "free",
      address: titleCase(clean(f.properties.ADDRESS)) || undefined,
      lng: pt[0],
      lat: pt[1],
      website: clean(f.properties.URL) || undefined,
      description: `Neighbourhood park with ${listPhrase(words.slice(0, 4))}.`,
      highlights: amenities.slice(0, 5),
      neighborhood: hood,
    });
    if (added) {
      takeHood.add(hood);
      parksTaken++;
    }
  }

  const centres = parks
    .filter((f) => f.properties.TYPE === "Community Centre")
    .map((f) => ({ f, programs: [...(dropins.get(String(f.properties.LOCATIONID)) ?? [])] }))
    .sort((a, b) => b.programs.length - a.programs.length);
  const centreHoods = new Set<string>();
  let centresTaken = 0;
  for (const { f, programs } of centres) {
    if (centresTaken >= 40 || programs.length < 8) break;
    const pt = firstPoint(f.geometry);
    const hood = hoodOf(pt?.[0], pt?.[1]);
    if (!pt || !hood || centreHoods.has(hood)) continue;
    const location = locationById.get(String(f.properties.LOCATIONID));
    const name = titleCase(clean(f.properties.ASSET_NAME));
    const names = programs.filter((t) => t.length < 28).slice(0, 5);
    const added = add("centres", {
      name,
      type: "program",
      category: "physical",
      tags: ["community centre", "drop-in", "family", ...names.map((n) => n.toLowerCase())],
      cost: "low",
      costNote:
        "Leisure swims and skating are free. Other drop-ins cost a few dollars, or nothing at free centres.",
      address: titleCase(clean(f.properties.ADDRESS)) || undefined,
      lng: pt[0],
      lat: pt[1],
      phone: clean(f.properties.PHONE) || undefined,
      website: clean(f.properties.URL) || undefined,
      description:
        excerpt(location?.Description ?? "", 300) ||
        `A City of Toronto community centre with ${programs.length} drop-in programs a week.`,
      highlights: [`${programs.length} drop-in programs`, ...names.slice(0, 4)],
      neighborhood: hood,
    });
    if (added) {
      centreHoods.add(hood);
      centresTaken++;
    }
  }

  /* 6. Music: venues and record stores, kept only if their website still answers (checked below). */
  const music = (
    await loadJson<{ features: Feature<Record<string, string | null>>[] }>("music", "geojson")
  ).features;
  const musicCandidates = music.filter((f) => {
    const site = clean(f.properties.WEBSITE);
    return (
      /^https?:/.test(site) &&
      ["Music Venues", "Record Stores"].includes(String(f.properties.CATEGORY))
    );
  });
  const liveMusic = new Set(
    await checkLinks(musicCandidates.map((f) => clean(f.properties.WEBSITE))),
  );
  let venueCount = 0;
  let recordCount = 0;
  for (const f of musicCandidates) {
    const p = f.properties;
    const site = clean(p.WEBSITE);
    if (!liveMusic.has(site)) continue;
    const isVenue = p.CATEGORY === "Music Venues";
    if (isVenue ? venueCount >= 40 : recordCount >= 20) continue;
    const pt = firstPoint(f.geometry);
    const hood = hoodOf(pt?.[0], pt?.[1]);
    const name = clean(p.NAME);
    const capacity = Number(p.CAPACITY);
    const added = add("music", {
      name,
      type: "place",
      category: isVenue ? "dance-music" : "thrifting",
      tags: isVenue ? ["live music", "venue"] : ["records", "vinyl", "music", "browse"],
      cost: isVenue ? "varies" : "free",
      costNote: isVenue ? "Tickets vary by show." : "Free to browse.",
      address: clean(p.ADDRESS) || undefined,
      lng: pt?.[0],
      lat: pt?.[1],
      website: site,
      phone: clean(p.PHONE) || undefined,
      description: isVenue
        ? `Live music venue${hood ? ` in ${hood}` : ""}${capacity > 0 ? `, holding about ${capacity} people` : ""}.`
        : `Record store${hood ? ` in ${hood}` : ""}. Good for an hour of digging through the bins.`,
      highlights: [],
    });
    if (added) {
      if (isVenue) venueCount++;
      else recordCount++;
    }
  }

  /* 7. Cultural Hotspot: murals and nature spots the City documents. */
  const hotspot = (
    await loadJson<{ features: Feature<Record<string, string | null>>[] }>("hotspot", "geojson")
  ).features;
  const hotspotHoods = new Map<string, number>();
  let hotspotTaken = 0;
  for (const f of hotspot) {
    if (hotspotTaken >= 25) break;
    const p = f.properties;
    const interests = clean(p.Interests);
    const description = excerpt(String(p.Description ?? ""), 320);
    if (!String(p.EntryType).startsWith("Destination") || description.length < 100) continue;
    const mural = /mural/i.test(interests);
    const nature = /nature/i.test(interests);
    if (!mural && !nature) continue;
    if (/will be|is proposed|under construction/i.test(description)) continue;
    const name = clean(p.SiteName).replace(/\s*\(\d{4}\)$/, "");
    if (name.length < 4 || /\bpark\b/i.test(name)) continue;
    const pt = firstPoint(f.geometry);
    if (!pt) continue;
    const hood = hoodOf(pt[0], pt[1]) ?? clean(p.Neighbourhood);
    if ((hotspotHoods.get(hood) ?? 0) >= 2) continue;
    const added = add("hotspot", {
      name,
      type: "place",
      category: mural ? "arts" : "physical",
      tags: mural ? ["street art", "mural", "outdoors", "walk"] : ["nature", "outdoors", "walk"],
      cost: "free",
      address: clean(p.Address) || undefined,
      lng: pt[0],
      lat: pt[1],
      description,
      highlights: [],
      neighborhood: hood,
    });
    if (added) {
      hotspotHoods.set(hood, (hotspotHoods.get(hood) ?? 0) + 1);
      hotspotTaken++;
    }
  }

  /* 8. Events: one listing per event, with every showing inside the window. */
  const feed = await loadJson<{ value: FeedEvent[] }>("festivals");
  const windowEnd = Date.now() + EVENT_WINDOW_DAYS * DAY;
  const groups = new Map<string, FeedEvent>();
  for (const e of feed.value) {
    const key = e.submission_id ?? e.event_name ?? e.id;
    if (!groups.has(key)) groups.set(key, e);
  }
  let skippedEvents = 0;
  for (const e of groups.values()) {
    const occurrences = (e.event_dates ?? [])
      .map((d) => d.date)
      .filter((t) => t >= Date.now() - DAY / 2 && t <= windowEnd)
      .sort((a, b) => a - b);
    const categories = e.event_category ?? [];
    const name = eventTitle(clean(e.event_name), e.event_description);
    if (occurrences.length === 0 || !name || e.event_status !== "Approved") {
      skippedEvents++;
      continue;
    }
    if (
      categories.some((c) => /virtual|consumer show|trivia/i.test(c)) ||
      /virtual|online only/i.test(name)
    ) {
      skippedEvents++;
      continue;
    }
    const free = e.free_event === "Yes";
    const low = priceNumber(e.event_price_low);
    const high = priceNumber(e.event_price_high);
    if (!free && low !== null && low > MAX_TICKET_LOW) {
      skippedEvents++;
      continue;
    }
    const location = e.event_locations?.[0];
    const gps = parseGps(location?.location_gps);
    const costNote = free
      ? undefined
      : low !== null
        ? high !== null && high !== low
          ? `$${low} to $${high}`
          : `From $${low}`
        : (shortNote(e.cost_notes) ?? "Ticketed. Check the event website.");
    const venue = clean(location?.location_name);
    const address = clean(location?.location_address).replace(
      /, (Toronto|North York|Scarborough|Etobicoke|York|East York), ON.*$/,
      "",
    );
    add("events", {
      id: `toronto-event-${slug(name).slice(0, 60)}-${(e.submission_id ?? e.id).slice(0, 8)}`,
      name,
      type: "event",
      category: eventCategory(categories),
      tags: [...categories, ...(e.event_theme ?? [])].map((t) => t.toLowerCase()).slice(0, 8),
      cost: free
        ? "free"
        : low !== null && low < 20
          ? "low"
          : low !== null && low <= 50
            ? "moderate"
            : "varies",
      costNote,
      address:
        address && address !== venue
          ? `${venue ? `${venue}, ` : ""}${address}`
          : venue || undefined,
      lng: gps?.[0],
      lat: gps?.[1],
      website: validUrl(e.event_website) ?? validUrl(e.ticket_website),
      phone: clean(e.event_telephone) || undefined,
      description: excerpt(
        // The feed cuts short descriptions off mid-word, so a whole one is preferred.
        (/[.!?]$/.test(e.short_description?.trim() ?? "") && e.short_description) ||
          e.event_description ||
          e.short_description ||
          name,
        420,
      ),
      highlights: [],
      occurrences: occurrences.slice(0, 120).map((t) => new Date(t).toISOString()),
      endsAt: new Date(occurrences[occurrences.length - 1] as number).toISOString(),
    });
  }

  /* 9. Fill in curated coordinates from the City's address points. */
  await fillCoordinates(all, hoodOf);

  /* 10. Link check: a dead link loses its link, never its listing, unless it was its only source. */
  const urls = [...new Set(all.flatMap((p) => (p.website ? [p.website] : [])))];
  const alive = new Set(await checkLinks(urls));
  let removed = 0;
  for (const p of all) {
    if (p.website && !alive.has(p.website)) {
      delete p.website;
      removed++;
    }
  }

  const output = {
    cityId: "toronto",
    cityName: "Toronto",
    province: "Ontario",
    country: "Canada",
    tagline: curatedFile.city.tagline,
    heroDescription: curatedFile.city.heroDescription,
    lat: curatedFile.city.lat,
    lng: curatedFile.city.lng,
    contributors: ["CityRoots curators", `City of Toronto (${OGL})`],
    lastUpdated: today,
    places: all,
  };
  writeFileSync(OUT, `${JSON.stringify(output, null, 1)}\n`);

  const byCost = Object.groupBy(all, (p) => p.cost);
  const byCat = Object.groupBy(all, (p) => p.category);
  console.log(`\n${all.length} listings written to ${OUT}`);
  console.log("by source", counts);
  console.log(
    "by cost",
    Object.fromEntries(Object.entries(byCost).map(([k, v]) => [k, v?.length])),
  );
  console.log(
    "by category",
    Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v?.length])),
  );
  console.log(`events skipped: ${skippedEvents}. Dead links removed: ${removed}.`);
  console.log(
    `no coordinates: ${all
      .filter((p) => p.lat === undefined)
      .map((p) => p.name)
      .join("; ")}`,
  );
}

/* ------------------------------ feed helpers ----------------------------- */

type FeedEvent = {
  id: string;
  submission_id?: string | null;
  event_name?: string | null;
  event_status?: string | null;
  free_event?: string | null;
  event_category?: string[] | null;
  event_theme?: string[] | null;
  event_dates?: { date: number }[] | null;
  event_locations?:
    { location_name?: string; location_address?: string; location_gps?: string }[] | null;
  event_price_low?: string | number | null;
  event_price_high?: string | number | null;
  cost_notes?: string | null;
  event_website?: string | null;
  ticket_website?: string | null;
  event_telephone?: string | null;
  short_description?: string | null;
  event_description?: string | null;
};

function priceNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function parseGps(raw: string | undefined): [number, number] | null {
  if (!raw) return null;
  try {
    const first = (
      JSON.parse(raw) as { gps_lat?: number | string; gps_lng?: number | string }[]
    )[0];
    const lat = Number(first?.gps_lat);
    const lng = Number(first?.gps_lng);
    return lat && lng ? [lng, lat] : null;
  } catch {
    return null;
  }
}

/** Organizer notes are sometimes paragraphs; only short ones work as a price. */
/** Pop-up programs are titled by location and time alone; lead with what they are. */
function eventTitle(name: string, description: string | null | undefined): string {
  const place = /^(.+?) - [\d:]+.*[ap]\.m\.$/.exec(name)?.[1];
  if (!place) return name;
  const series = /play mobile/i.test(description ?? "") ? "Play Mobile" : "Drop-in";
  return `${series} at ${place}`;
}

function shortNote(value: string | null | undefined): string | undefined {
  const note = clean(value);
  return note && note.length <= 70 ? note : undefined;
}

function validUrl(value: string | null | undefined): string | undefined {
  const v = clean(value);
  return /^https?:\/\/\S+$/.test(v) ? v : undefined;
}

const EVENT_CATEGORY_ORDER: [RegExp, string][] = [
  [/farmers|food|culinary/i, "food"],
  [/dance|music|live perf|theatre|comedy/i, "dance-music"],
  [/arts|museum|history|film|literary|artisan|exhibit/i, "arts"],
  [/sports|run|walk|environmental/i, "physical"],
  [/seminar|talks|2slgbt/i, "social"],
];

function eventCategory(categories: string[]): string {
  for (const [re, slugValue] of EVENT_CATEGORY_ORDER) {
    if (categories.some((c) => re.test(c))) return slugValue;
  }
  return "events";
}

/* ---------------------------------- misc --------------------------------- */

/** Returns the URLs that answer. Servers that refuse robots still count as alive. */
async function checkLinks(urls: string[]): Promise<string[]> {
  const unique = [...new Set(urls)];
  console.log(`  checking ${unique.length} links`);
  const alive: string[] = [];
  let next = 0;
  async function worker() {
    while (next < unique.length) {
      const url = unique[next++] as string;
      if (url.includes("toronto.ca/")) {
        // The City's site rejects automated checks; these URLs come from its own data.
        alive.push(url);
        continue;
      }
      try {
        const res = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
          headers: { "user-agent": "Mozilla/5.0 (compatible; CityRootsLinkCheck/1.0)" },
        });
        if (res.status < 400 || [401, 403, 405, 406, 429, 503].includes(res.status))
          alive.push(url);
        await res.body?.cancel();
      } catch (error) {
        // Unreachable: treated as dead, and reported with the other dead links.
        console.log(`  link failed: ${url} (${String(error).slice(0, 60)})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker));
  return alive;
}

function addressKey(address: string): string {
  return address
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\bWEST\b/g, "W")
    .replace(/\bEAST\b/g, "E")
    .replace(/\s+/g, " ")
    .trim();
}

async function fillCoordinates(
  all: OutPlace[],
  hoodOf: (lng?: number, lat?: number) => string | undefined,
) {
  const missing = all.filter((p) => p.address && p.lat === undefined);
  const wanted = new Set(missing.map((p) => addressKey(p.address ?? "")));
  // Curated places also get their typed coordinates corrected to the City's point.
  const curatedIds = new Set(curatedFile.places.map((p) => p.id));
  const curated = all.filter((p) => curatedIds.has(p.id) && p.address);
  for (const p of curated) wanted.add(addressKey(p.address ?? ""));

  const found = new Map<string, [number, number]>();
  const stream = createReadStream(await cached("addresses", "csv"));
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  let header: string[] | null = null;
  let addressColumn = -1;
  let geometryColumn = -1;
  for await (const line of lines) {
    const cells = csvLine(line);
    if (!header) {
      header = cells;
      addressColumn = header.indexOf("ADDRESS_FULL");
      geometryColumn = header.indexOf("geometry");
      continue;
    }
    const key = addressKey(cells[addressColumn] ?? "");
    if (!wanted.has(key) || found.has(key)) continue;
    const m = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/.exec(cells[geometryColumn] ?? "");
    if (m) found.set(key, [Number(m[1]), Number(m[2])]);
  }
  for (const p of [...missing, ...curated]) {
    const point = found.get(addressKey(p.address ?? ""));
    if (!point) continue;
    p.lng = point[0];
    p.lat = point[1];
  }
  for (const p of all) {
    p.neighborhood ??= hoodOf(p.lng, p.lat);
  }
  console.log(`  address points matched ${found.size} of ${wanted.size}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
