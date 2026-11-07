/**
 * Keeps every city except Toronto current (Toronto has scripts/aggregate-toronto.ts).
 * Writes scripts/seed-data/cities/<city>.json from:
 *   - scripts/seed-data/curated/<city>.json, the hand-checked listings
 *   - live event calendars: public libraries, Explore Waterloo, and town and city sites
 *   - Statistics Canada's open facility databases, kept only when the city's own site
 *     still names the facility
 *
 *   npm run data:cities
 *
 * Downloads are cached in .data/cities-cache for a day. Delete it to force a refresh.
 * Event text is written here from the facts; descriptions are not copied from the source.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { LEGACY_CATEGORY_MAP } from "../src/lib/domain/categories";

const CACHE = ".data/cities-cache";
const CURATED = "scripts/seed-data/curated";
const OUT = "scripts/seed-data/cities";
const DAY = 86_400_000;
const USER_AGENT = "CityRootsData/1.0 (weekly community listings refresh)";
const today = new Date().toISOString().slice(0, 10);
/** Events further ahead than this wait for a later refresh. */
const WINDOW_DAYS = 60;
/** Keeps a big library system from burying everything else on the calendar. */
const MAX_LIBRARY_EVENTS = 70;
const MAX_FAMILY_EVENTS = 15;
const FAMILY =
  /storytime|stories|rhyme|toddler|bab(y|ies)|\btots?\b|totstime|kinder|earlyon|homeschool|\bkids?\b|child|preschool|\d\s*(-|\u2013)\s*\d+ yrs|playdate|stay & play/i;
const MAX_TICKET = 50;

const LICENCE_NOTES = {
  statcan: "Statistics Canada Open Licence",
  libraries: "Public library calendars",
};

type Cost = "free" | "low" | "moderate" | "varies";
type Place = {
  id: string;
  name: string;
  type: "place" | "event" | "program" | "resource";
  category: string;
  tags: string[];
  cost: Cost;
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
  occurrences?: string[];
  endsAt?: string;
};
type CityFile = Record<string, unknown> & {
  cityId: string;
  cityName: string;
  contributors: string[];
  lastUpdated: string;
  places: Place[];
};

/** One showing, before showings of the same thing are grouped into one listing. */
type Showing = {
  title: string;
  venue: string;
  startsAt: string;
  url: string;
  audience?: string;
  cost?: Cost;
  costNote?: string;
  address?: string;
  /** The source's own topic labels, when it has them. */
  topics?: string;
  source: string;
};

type Config = {
  name: string;
  /** How the city is spelled in Statistics Canada's data. */
  csd: string;
  /** Town and city pages that name its facilities. A facility has to appear on one. */
  hubs: string[];
  /** Facility pages on york.ca for the four York Region cities. */
  york?: string[];
  feeds: ((city: Config) => Promise<Showing[]>)[];
};

async function cachedText(key: string, url: string, init?: RequestInit): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, key);
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < DAY) {
    return readFileSync(file, "utf8");
  }
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...init?.headers },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const text = await res.text();
  writeFileSync(file, text);
  return text;
}

function decode(value: string): string {
  return value
    .replace(/&#8217;|&#039;|&rsquo;|&apos;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Local wall-clock time in Ontario, as a UTC instant. */
function torontoInstant(local: string): string {
  const naive = new Date(`${local.replace(" ", "T").slice(0, 16)}:00Z`);
  const shown = new Date(naive.toLocaleString("en-US", { timeZone: "America/Toronto" }));
  const utc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(naive.getTime() + (utc.getTime() - shown.getTime())).toISOString();
}

const dayOffset = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

/** Not for the public, or not somewhere to go. */
const SKIP =
  /cancel+ed|postponed|closed|private|staff|class visit|board meeting|council|committee|\bonline\b|virtual|zoom|outreach|holiday hours/i;

/** Libraries run a lot of the same few things; this sorts them by what people came for. */
function categoryFor(title: string, fallback = "social"): string {
  const t = title.toLowerCase();
  if (
    /\b(yoga|tai chi|walks?|walking|fitness|exercise|hikes?|hiking|skat(e|ing)|swim|sports?|runs?|running|pickleball|zumba|hockey|basketball)\b/.test(
      t,
    )
  )
    return "physical";
  if (
    /\b(mindful\w*|meditat\w*|wellness|mental health|grief|calm|relax\w*|sound bath|hospice)\b/.test(
      t,
    )
  )
    return "mental";
  if (
    /\b(tax|taxes|resume|resumes|jobs?|careers?|money|financ\w*|budget\w*|employment|legal|benefits?|newcomers?|settlement|citizenship|housing)\b/.test(
      t,
    )
  )
    return "financial";
  if (
    /\b(music|musical|concerts?|singing|sing|choir|bands?|dance|dancing|jazz|ukulele|guitar|piano|drums?|symphony|orchestra|candlelight)\b/.test(
      t,
    )
  )
    return "dance-music";
  if (/\b(cook\w*|bak(e|ing)|food|recipes?|markets?|tea|chef|culinary|drink|beer|wine)\b/.test(t))
    return "food";
  if (
    /\b(art|arts|crafts?|paint\w*|draw\w*|doodle|sketch\w*|knit\w*|crochet|sew\w*|embroider\w*|pottery|makers?|3d|lego|exhibit\w*|gallery|film|movie|theatre|photo\w*|cricut|weaving|fibre|beaded|comedy)\b/.test(
      t,
    )
  )
    return "arts";
  if (/\b(thrift|swap|book sale|rummage|vintage)\b/.test(t)) return "thrifting";
  if (/\b(festival|parade|fair|celebrat\w*|carnival|holiday|santa)\b/.test(t)) return "events";
  return fallback;
}

const paidText = /\$\s?\d|\bfee\b|ticket|cost:/i;

/** Burlington, Oakville, Waterloo, and Cambridge libraries publish on one platform. */
function communico(host: string, library: string) {
  return async (): Promise<Showing[]> => {
    const req = JSON.stringify({
      private: false,
      date: today,
      days: WINDOW_DAYS,
      locations: [],
      ages: [],
      types: [],
    });
    const url = `https://${host}/eeventcaldata?event_type=0&req=${encodeURIComponent(req)}`;
    const rows = JSON.parse(await cachedText(`${host}.json`, url)) as {
      id: string;
      title: string;
      raw_start_time: string;
      location?: string;
      library?: string;
      ages?: string;
      url?: string;
      event_type?: string;
      description?: string;
      long_description?: string;
    }[];
    return rows
      .filter((r) => r.event_type !== "ONLINE")
      .map((r) => ({
        title: decode(r.title),
        venue: decode(r.library || r.location || library),
        startsAt: torontoInstant(r.raw_start_time),
        url: r.url || `https://${host}/event/${r.id}`,
        audience: r.ages ? decode(r.ages) : undefined,
        cost: paidText.test(`${r.description} ${r.long_description}`)
          ? ("varies" as const)
          : ("free" as const),
        source: library,
      }));
  };
}

/** Markham and Richmond Hill libraries. */
function bibliocommons(site: string, library: string) {
  return async (): Promise<Showing[]> => {
    const out: Showing[] = [];
    const horizon = dayOffset(WINDOW_DAYS);
    for (let page = 1; page <= 12; page++) {
      const url = `https://gateway.bibliocommons.com/v2/libraries/${site}/events?limit=100&page=${page}&locale=en-CA`;
      const data = JSON.parse(await cachedText(`${site}-${page}.json`, url)) as {
        entities: {
          events?: Record<
            string,
            {
              id: string;
              definition: {
                title: string;
                start: string;
                isCancelled?: boolean;
                isVirtual?: boolean;
                description?: string;
                branchLocationId?: string;
                audienceIds?: string[];
              };
            }
          >;
          locations?: Record<string, { name: string }>;
          eventAudiences?: Record<string, { name: string }>;
        };
        events: { pagination: { pages: number } };
      };
      const rows = Object.values(data.entities.events ?? {});
      for (const { id, definition: d } of rows) {
        if (
          d.isCancelled ||
          d.isVirtual ||
          d.start.slice(0, 10) < today ||
          d.start.slice(0, 10) > horizon
        )
          continue;
        const audience = (d.audienceIds ?? [])
          .map((a) => data.entities.eventAudiences?.[a]?.name)
          .filter(Boolean)
          .join(", ");
        out.push({
          title: decode(d.title),
          venue: data.entities.locations?.[d.branchLocationId ?? ""]?.name ?? library,
          startsAt: torontoInstant(d.start),
          url: `https://${site}.bibliocommons.com/events/${id}`,
          audience: audience || undefined,
          cost: paidText.test(d.description ?? "") ? "varies" : "free",
          source: library,
        });
      }
      if (page >= data.events.pagination.pages) break;
    }
    return out;
  };
}

/** Explore Waterloo covers Kitchener, Waterloo, and Cambridge, with venues and prices. */
function exploreWaterloo(cityName: string) {
  return async (): Promise<Showing[]> => {
    const out: Showing[] = [];
    for (let page = 1; page <= 10; page++) {
      const url = `https://explorewaterloo.ca/wp-json/tribe/events/v1/events?per_page=50&page=${page}&start_date=${today}&end_date=${dayOffset(WINDOW_DAYS)}`;
      let body: string;
      try {
        body = await cachedText(`explore-waterloo-${page}.json`, url);
      } catch {
        break;
      }
      const data = JSON.parse(body) as {
        events?: {
          title: string;
          url: string;
          start_date: string;
          all_day: boolean;
          cost?: string;
          categories?: { name: string }[];
          venue?: { venue?: string; address?: string; city?: string };
        }[];
        total_pages?: number;
      };
      for (const e of data.events ?? []) {
        if (e.venue?.city?.trim().toLowerCase() !== cityName.toLowerCase()) continue;
        const price = e.cost?.trim() ?? "";
        const top = Math.max(0, ...[...price.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])));
        if (top > MAX_TICKET) continue;
        const cost: Cost = /free/i.test(price)
          ? "free"
          : top === 0
            ? "varies"
            : top < 20
              ? "low"
              : "moderate";
        out.push({
          title: decode(e.title),
          venue: decode(e.venue?.venue ?? cityName),
          address: e.venue?.address ? `${decode(e.venue.address)}, ${cityName}` : undefined,
          startsAt: torontoInstant(e.start_date),
          url: e.url,
          cost,
          costNote: cost === "free" ? undefined : price || "Check the event page for prices.",
          topics: e.categories?.map((c) => c.name).join(" "),
          source: "Explore Waterloo",
        });
      }
      if (page >= (data.total_pages ?? 1)) break;
    }
    return out;
  };
}

/** Newmarket Public Library puts its calendar in the page as data. */
async function newmarketLibrary(): Promise<Showing[]> {
  const html = await cachedText(
    "newmarket-library.html",
    "https://www.newmarketpl.ca/programs-and-activities/library-program-calendar",
  );
  const raw = /calendar_options":"(.*?)(?<!\\)"/s.exec(html)?.[1];
  if (!raw) return [];
  const options = JSON.parse(JSON.parse(`"${raw}"`) as string) as {
    events: { title: string; url: string; start: string }[];
  };
  const horizon = Date.now() + WINDOW_DAYS * DAY;
  return options.events.flatMap((e) => {
    const at = Number(e.start) * 1000;
    if (!at || at < Date.now() || at > horizon) return [];
    return [
      {
        title: decode(e.title),
        venue: "Newmarket Public Library",
        address: "438 Park Ave, Newmarket",
        startsAt: new Date(at).toISOString(),
        url: new URL(e.url, "https://www.newmarketpl.ca").href,
        cost: "free" as const,
        source: "Newmarket Public Library",
      },
    ];
  });
}

/** Town events, from the month grid on newmarket.ca. */
async function newmarketTown(): Promise<Showing[]> {
  const html = await cachedText(
    "newmarket-town.html",
    "https://www.newmarket.ca/community-and-culture/events-meetings",
  );
  const out: Showing[] = [];
  const row =
    /<li title="([^"]*?) from (\d+)\/(\d+)\/(\d+) - (\d+):(\d+)(am|pm)[^"]*"[\s\S]*?href="(\/community-and-culture\/events-meetings\/[^"]+)"/g;
  for (const m of html.matchAll(row)) {
    const [, title, month, day, year, h, min, ap, href] = m as unknown as string[];
    const hour = (Number(h) % 12) + (ap === "pm" ? 12 : 0);
    const local = `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${min}`;
    if (local.slice(0, 10) < today) continue;
    out.push({
      title: decode(title as string),
      venue: "Newmarket",
      startsAt: torontoInstant(local),
      url: `https://www.newmarket.ca${href}`,
      cost: "varies",
      costNote: "Check the Town's page for prices.",
      source: "Town of Newmarket",
    });
  }
  return out;
}

/** Vaughan Public Libraries prints a month at a time. */
async function vaughanLibrary(): Promise<Showing[]> {
  const out: Showing[] = [];
  const horizon = dayOffset(WINDOW_DAYS);
  for (const offset of [0, 1, 2]) {
    const when = new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1);
    const month = when.toLocaleString("en-US", { month: "long" });
    const year = when.getFullYear();
    const html = await cachedText(
      `vaughan-${year}-${month}.html`,
      `https://www.vaughanpl.info/events_calendars/calendar_printable/${year}/${month}`,
    );
    const monthIndex = String(when.getMonth() + 1).padStart(2, "0");
    for (const cell of html.split('<div class="cell-number">').slice(1)) {
      const day = /^(\d{1,2})</.exec(cell)?.[1];
      if (!day) continue;
      const date = `${year}-${monthIndex}-${day.padStart(2, "0")}`;
      if (date < today || date > horizon) continue;
      for (const m of cell.matchAll(
        /<a href="(\/programs\/view\/\d+)" title="(\d{1,2}):(\d{2}) ([AP])M\s+to\s+\S+\s+[AP]M\s+([^"]+)"[^>]*>([^<]+)<\/a>/g,
      )) {
        const hour = (Number(m[2]) % 12) + (m[4] === "P" ? 12 : 0);
        out.push({
          title: decode(m[6] ?? ""),
          venue: decode(m[5] ?? ""),
          startsAt: torontoInstant(`${date} ${String(hour).padStart(2, "0")}:${m[3]}`),
          url: `https://www.vaughanpl.info${m[1]}`,
          cost: "free",
          source: "Vaughan Public Libraries",
        });
      }
    }
  }
  return out;
}

/** City events, from markham.ca's listing. */
async function markhamCity(): Promise<Showing[]> {
  const out: Showing[] = [];
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  for (const page of [0, 1, 2]) {
    const html = await cachedText(
      `markham-city-${page}.html`,
      `https://www.markham.ca/about-city-markham/events/event-listings?page=${page}`,
    );
    let month = "";
    let year = "";
    const tokens =
      /<h2 class="heading"[^>]*>\s*([A-Za-z]+) (\d{4})\s*<\/h2>|<div class="event-day">\s*[A-Za-z]+ (\d{1,2})[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a><\/div>\s*<p class="event-venue">\s*([^<]*)<\/p>\s*<p class="event-access-times">\s*([^<]*)</g;
    for (const m of html.matchAll(tokens)) {
      if (m[1]) {
        month = String(months.indexOf(m[1].toLowerCase()) + 1).padStart(2, "0");
        year = m[2] ?? "";
        continue;
      }
      if (!month || !m[4]?.includes("/events/")) continue;
      const date = `${year}-${month}-${(m[3] ?? "").padStart(2, "0")}`;
      if (date < today) continue;
      const time = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m/i.exec(m[7] ?? "");
      const hour = time ? (Number(time[1]) % 12) + (time[3]?.toLowerCase() === "p" ? 12 : 0) : 12;
      const title = decode(m[5] ?? "");
      out.push({
        title,
        venue: decode(m[6] ?? "Markham"),
        startsAt: torontoInstant(`${date} ${String(hour).padStart(2, "0")}:${time?.[2] ?? "00"}`),
        url: `https://www.markham.ca${m[4]}`,
        cost: /^free\b/i.test(title) ? "free" : "varies",
        costNote: /^free\b/i.test(title) ? undefined : "Check the City's page for prices.",
        source: "City of Markham",
      });
    }
  }
  return out;
}

const CITIES: Record<string, Config> = {
  burlington: {
    name: "Burlington",
    csd: "Burlington",
    hubs: [
      "https://www.burlington.ca/en/parks-facilities-and-rentals/community-centres.aspx",
      "https://www.bpl.on.ca",
    ],
    feeds: [communico("attend.bpl.on.ca", "Burlington Public Library")],
  },
  oakville: {
    name: "Oakville",
    csd: "Oakville",
    hubs: [
      "https://www.oakville.ca/parks-recreation-culture/facilities-rentals/facility-locations/community-centres/",
      "https://www.oakville.ca/parks-recreation-culture/facilities-rentals/facility-locations/arenas-ice/",
      "https://www.opl.ca",
    ],
    feeds: [communico("opl.libnet.info", "Oakville Public Library")],
  },
  waterloo: {
    name: "Waterloo",
    csd: "Waterloo",
    hubs: [
      "https://www.waterloo.ca/recreation-and-sports/find-a-community-or-rec-centre/",
      "https://www.waterloo.ca/recreation-and-sports/skating-rinks-and-arenas/",
      "https://www.waterloo.ca/recreation-and-sports/swimming-and-pools/",
      "https://www.wpl.ca",
    ],
    feeds: [communico("calendar.wpl.ca", "Waterloo Public Library"), exploreWaterloo("Waterloo")],
  },
  cambridge: {
    name: "Cambridge",
    csd: "Cambridge",
    hubs: [
      "https://www.cambridge.ca/recreation-culture/facilities/",
      "https://www.cambridge.ca/recreation-culture/pools-aquatics/",
      "https://www.cambridge.ca/recreation-culture/sports/public-skating/",
      "https://cambridgepl.ca",
    ],
    feeds: [
      communico("events.cambridgepl.ca", "Cambridge Public Library"),
      exploreWaterloo("Cambridge"),
    ],
  },
  kitchener: {
    name: "Kitchener",
    csd: "Kitchener",
    hubs: [
      "https://www.kitchener.ca/recreation-and-sports/community-centres/",
      "https://www.kitchener.ca/recreation-and-sports/arenas/",
    ],
    feeds: [exploreWaterloo("Kitchener")],
  },
  markham: {
    name: "Markham",
    csd: "Markham",
    hubs: ["https://markhampubliclibrary.ca"],
    york: [
      "angus-glen-community-centre",
      "armadale-community-centre",
      "centennial-community-centre",
      "crosby-community-centre",
      "main-street-markham-farmers-market",
      "markham-village-community-centre",
      "mount-joy-community-centre",
      "rj-clatworthy-arena",
      "thornhill-community-centre",
      "victoria-square-community-centre",
    ],
    feeds: [bibliocommons("markham", "Markham Public Library"), markhamCity],
  },
  "richmond-hill": {
    name: "Richmond Hill",
    csd: "Richmond Hill",
    hubs: ["https://www.richmondhill.ca/en/things-to-do/Get-Active.aspx", "https://www.rhpl.ca"],
    york: [
      "bayview-hill-community-centre",
      "bond-lake-arena",
      "centennial-pool",
      "ed-sackfield-arena",
      "elgin-barrow-arena",
      "elgin-west-community-centre",
      "elvis-stojko-arena",
      "langstaff-community-centre",
      "oak-ridges-community-centre",
      "richvale-community-centre",
      "rouge-woods-community-centre",
      "tom-graham-arena",
      "wave-pool",
    ],
    feeds: [bibliocommons("rhpl", "Richmond Hill Public Library")],
  },
  newmarket: {
    name: "Newmarket",
    csd: "Newmarket",
    hubs: [
      "https://www.newmarket.ca/recreation-parks/recreation-facilities",
      "https://www.newmarketpl.ca",
    ],
    york: [
      "magna-centre",
      "newmarket-community-centre-and-lions-hall",
      "newmarket-seniors-meeting-place",
      "ray-twinney-recreation-complex",
    ],
    feeds: [newmarketLibrary, newmarketTown],
  },
  vaughan: {
    name: "Vaughan",
    csd: "Vaughan",
    hubs: ["https://www.vaughanpl.info/events_calendars/calendar_printable"],
    feeds: [vaughanLibrary],
  },
};

/** Groups repeat showings of one thing at one venue, and writes its listing. */
function eventListings(cityId: string, cityName: string, showings: Showing[]): Place[] {
  const groups = new Map<string, Showing[]>();
  for (const s of showings) {
    if (!s.title || SKIP.test(s.title) || SKIP.test(s.venue)) continue;
    const key = `${slug(s.title)}|${slug(s.venue)}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const places: Place[] = [...groups.entries()].map(([key, group]) => {
    const sorted = group.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const first = sorted[0] as Showing;
    const occurrences = [...new Set(sorted.map((s) => s.startsAt))].slice(0, 60);
    const library = /librar/i.test(first.source);
    const who = first.audience ? ` Ages: ${first.audience}.` : "";
    const at = first.venue === first.source ? first.source : `${first.venue}`;
    const cost = first.cost ?? "varies";
    const paid = cost !== "free";
    const lead = library
      ? `${paid ? "A program" : "A free program"} at ${at}, ${first.source === at ? "" : `part of ${first.source}, `}`.replace(
          /, $/,
          ". ",
        )
      : `At ${at}. `;
    const close = library
      ? "Some programs ask you to register, so check first."
      : "Details and any changes are on the event page.";
    return {
      id: `${cityId}-event-${slug(key).slice(0, 70)}`,
      name: first.title,
      type: "event" as const,
      category: categoryFor(`${first.title} ${first.topics ?? ""}`),
      tags: [first.source],
      cost,
      costNote:
        first.costNote ?? (library && paid ? "May have a fee. Check the listing." : undefined),
      address:
        first.address ??
        (library
          ? `${first.venue}${/librar/i.test(first.venue) ? "" : " Library"}, ${cityName}`
          : first.venue === cityName
            ? undefined
            : `${first.venue}, ${cityName}`),
      website: first.url,
      description: `${lead}${who} ${close}`.replace(/\s+/g, " ").trim(),
      highlights: [],
      isRecommended: false,
      lastVerified: today,
      occurrences,
      endsAt: occurrences[occurrences.length - 1],
    };
  });
  // Variety first: the same storytime at nine branches should not fill the calendar.
  const seen = new Map<string, number>();
  const ranked = places
    .sort((a, b) => (a.occurrences?.[0] ?? "").localeCompare(b.occurrences?.[0] ?? ""))
    .map((p) => {
      const key = slug(p.name);
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      return { p, n };
    })
    .sort((a, b) => a.n - b.n);
  // Family programs are welcome, but they should not be nearly all a city shows.
  let family = 0;
  return ranked
    .filter(({ p }) => {
      if (!FAMILY.test(`${p.name} ${p.description}`)) return true;
      family++;
      return family <= MAX_FAMILY_EVENTS;
    })
    .slice(0, MAX_LIBRARY_EVENTS)
    .map((r) => r.p);
}

type Facility = {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  address?: string;
  postal?: string;
};

const STATCAN = {
  culture: {
    url: "https://www150.statcan.gc.ca/n1/pub/21-26-0001/2020001/ODCAF_V1.0.zip",
    member: "ODCAF_V1.0/ODCAF_v1.0.csv",
    kind: "ODCAF_Facility_Type",
  },
  recreation: {
    url: "https://www150.statcan.gc.ca/n1/pub/21-26-0002/2021001/ODRSF_v1.0.zip",
    member: "ODRSF_V1.0/ODRSF_v1.0.csv",
    kind: "ODRSF_facility_type",
  },
};
const KINDS: Record<string, { category: string; label: string; cost: Cost; note?: string }> = {
  "library or archives": { category: "cafes", label: "A public library branch", cost: "free" },
  museum: { category: "arts", label: "A museum", cost: "varies", note: "Check for admission." },
  gallery: {
    category: "arts",
    label: "An art gallery",
    cost: "varies",
    note: "Check for admission.",
  },
  "art or cultural centre": {
    category: "arts",
    label: "An arts and cultural centre",
    cost: "varies",
    note: "Check for fees.",
  },
  "theatre/performance and concert hall": {
    category: "dance-music",
    label: "A performance venue",
    cost: "varies",
    note: "Ticketed. Check the show.",
  },
  "heritage or historic site": {
    category: "arts",
    label: "A heritage site",
    cost: "varies",
    note: "Check for admission.",
  },
  "community centre": {
    category: "physical",
    label: "A community centre",
    cost: "varies",
    note: "Free to visit. Programs vary.",
  },
  pool: {
    category: "physical",
    label: "A public pool",
    cost: "low",
    note: "Drop-in fee. Check the schedule.",
  },
  arena: {
    category: "physical",
    label: "An arena with public skating",
    cost: "low",
    note: "Check the skating schedule.",
  },
  "splash pad": { category: "physical", label: "A free splash pad", cost: "free" },
  beach: { category: "physical", label: "A public beach", cost: "free" },
};

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [[]];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      rows[rows.length - 1]?.push(field);
      field = "";
    } else if (c === "\n") {
      rows[rows.length - 1]?.push(field.replace(/\r$/, ""));
      rows.push([]);
      field = "";
    } else field += c;
  }
  const [head, ...body] = rows;
  const names = (head ?? []).map((h) => h.replace(/^﻿/, ""));
  return body.map((r) => Object.fromEntries(names.map((n, i) => [n, r[i] ?? ""])));
}

async function statcanFacilities(): Promise<Map<string, Facility[]>> {
  mkdirSync(CACHE, { recursive: true });
  const out = new Map<string, Facility[]>();
  for (const [key, source] of Object.entries(STATCAN)) {
    const zip = path.join(CACHE, `${key}.zip`);
    if (!existsSync(zip)) {
      const res = await fetch(source.url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`${source.url} returned ${res.status}`);
      writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
    }
    const csv = execFileSync("unzip", ["-p", zip, source.member], { maxBuffer: 1 << 28 }).toString(
      "utf8",
    );
    for (const row of parseCsv(csv)) {
      if (row.Prov_Terr?.toLowerCase() !== "on" && row.Prov_Terr?.toLowerCase() !== "ontario")
        continue;
      const kind = row[source.kind] ?? "";
      if (!KINDS[kind]) continue;
      const lat = Number(row.Latitude);
      const lng = Number(row.Longitude);
      const name = (row.Facility_Name ?? "").trim();
      if (!name || !lat || !lng) continue;
      const city = (row.CSD_Name || row.City || "").trim().toLowerCase();
      // The source pads empty fields with dots and leaves street names in lower case.
      const street = [row.Street_No, row.Street_Name, row.Street_Type, row.Street_Direction]
        .filter((part) => part && !/^\.+$/.test(part))
        .join(" ")
        .replace(/\s*\.\.+/g, "")
        .trim();
      out.set(city, [
        ...(out.get(city) ?? []),
        { name, kind, lat, lng, address: street || undefined },
      ]);
    }
  }
  return out;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

function properCase(value: string): string {
  const cased =
    value === value.toUpperCase()
      ? value
          .toLowerCase()
          .replace(/(^|[\s\-/(.])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())
      : value;
  return cased.replace(/\bMc([a-z])/g, (_, a: string) => `Mc${a.toUpperCase()}`);
}

const nameKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(
      /\b(the|of|and|at|branch|public|resource|library|community|centre|center|complex|recreation|arenas?|pool)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Keeps a facility only if the city's own pages still name it, and links to that page. */
async function facilityListings(
  cityId: string,
  config: Config,
  all: Map<string, Facility[]>,
): Promise<Place[]> {
  const pages: { url: string; text: string }[] = [];
  for (const [i, url] of config.hubs.entries()) {
    try {
      pages.push({
        url,
        text: textOf(await cachedText(`hub-${cityId}-${i}.html`, url)).toLowerCase(),
      });
    } catch (error) {
      console.warn(`  could not read ${url}: ${String(error)}`);
    }
  }
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const f of all.get(config.csd.toLowerCase()) ?? []) {
    const name = properCase(f.name);
    const key = nameKey(name);
    // A facility called only "Kitchener" is the library system, and would match any page.
    if (key.length < 4 || seen.has(key) || key === config.name.toLowerCase() || RENAMED.test(name))
      continue;
    // One remaining word ("central") is too common to count as the page naming this place,
    // and a library belongs on the library's site, not a rink page that mentions its street.
    const words = name.toLowerCase().replace(/['’.]/g, "");
    const needle = key.includes(" ") ? key : words;
    const named = new RegExp(`\\b${needle.replace(/[^a-z0-9 ]/g, "")}\\b`);
    const isLibrary = f.kind === "library or archives";
    const ordered = isLibrary
      ? [...pages.filter((p) => LIBRARY_SITE.test(p.url)), ...pages]
      : pages.filter((p) => !LIBRARY_SITE.test(p.url));
    const hub = ordered.find((p) => named.test(p.text.replace(/['’.]/g, "")));
    if (!hub) continue;
    seen.add(key);
    const kind = KINDS[f.kind] as (typeof KINDS)[string];
    out.push({
      id: `${cityId}-facility-${slug(name)}`,
      name,
      type: "place",
      category: kind.category,
      tags: [f.kind],
      cost: kind.cost,
      costNote: kind.note,
      address: f.address ? `${titleCase(f.address)}, ${config.name}` : undefined,
      lat: f.lat,
      lng: f.lng,
      website: hub.url,
      description: `${kind.label} in ${config.name}. Hours and programs are on the linked page.`,
      highlights: [],
      isRecommended: false,
      lastVerified: today,
    });
  }
  return out;
}

const LIBRARY_SITE =
  /bpl\.on\.ca|opl\.ca|wpl\.ca|cambridgepl\.ca|markhampubliclibrary|rhpl\.ca|newmarketpl\.ca|vaughanpl/;

/** The data is from 2020 and 2021. These names have since gone out of use. */
const RENAMED = /^idea exchange$/i;

/** York Region's directory gives each facility's own page, address, and phone number. */
async function yorkListings(
  cityId: string,
  config: Config,
  all: Map<string, Facility[]>,
): Promise<Place[]> {
  const out: Place[] = [];
  const located = new Map(
    (all.get(config.csd.toLowerCase()) ?? []).map((f) => [nameKey(f.name), f]),
  );
  for (const page of config.york ?? []) {
    const url = `https://www.york.ca/yorkregion/facilities/${page}`;
    let html: string;
    try {
      html = await cachedText(`york-${page}.html`, url);
    } catch (error) {
      console.warn(`  could not read ${url}: ${String(error)}`);
      continue;
    }
    const field = (re: RegExp) => {
      const hit = re.exec(html)?.[1];
      return hit ? decode(hit) : undefined;
    };
    const name = field(/<h1 class="page-title"><span[^>]*>([^<]+)</);
    const street = field(/class="address-line1">([^<]+)</);
    const locality = field(/class="locality">([^<]+)</);
    if (!name) continue;
    const kind = /market/i.test(name)
      ? {
          category: "food",
          label: "A farmers' market",
          cost: "varies" as Cost,
          note: "Free to browse.",
        }
      : /senior/i.test(name)
        ? {
            category: "social",
            label: "A drop-in centre for older adults",
            cost: "varies" as Cost,
            note: "Check for membership fees.",
          }
        : /pool/i.test(name)
          ? (KINDS.pool as (typeof KINDS)[string])
          : /arena/i.test(name)
            ? (KINDS.arena as (typeof KINDS)[string])
            : (KINDS["community centre"] as (typeof KINDS)[string]);
    const place = located.get(nameKey(name));
    out.push({
      id: `${cityId}-facility-${page}`,
      name,
      type: "place",
      category: kind.category,
      tags: ["York Region facility directory"],
      cost: kind.cost,
      costNote: kind.note,
      address: street ? `${street}, ${locality ?? config.name}` : undefined,
      lat: place?.lat,
      lng: place?.lng,
      website: url,
      phone: field(/fa-phone"><\/i>\s*([^<]+)</),
      description: `${kind.label} in ${config.name}. The linked page has its address and phone number; call ahead for hours.`,
      highlights: [],
      isRecommended: false,
      lastVerified: today,
    });
  }
  return out;
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--city="))?.slice("--city=".length);
  const facilities = await statcanFacilities();
  for (const [cityId, config] of Object.entries(CITIES)) {
    if (only && only !== cityId) continue;
    const city = JSON.parse(readFileSync(path.join(CURATED, `${cityId}.json`), "utf8")) as CityFile;
    for (const p of city.places) {
      if (!LEGACY_CATEGORY_MAP[p.category])
        throw new Error(`${p.id}: unknown category ${p.category}`);
    }
    const showings: Showing[] = [];
    for (const feed of config.feeds) {
      try {
        showings.push(...(await feed(config)));
      } catch (error) {
        // One calendar being down should not empty the others.
        console.warn(`  ${cityId}: a calendar failed: ${String(error)}`);
      }
    }
    const events = eventListings(cityId, config.name, showings);
    const halls = [
      ...(await yorkListings(cityId, config, facilities)),
      ...(await facilityListings(cityId, config, facilities)),
    ];
    const taken = new Set(city.places.map((p) => nameKey(p.name)));
    const fresh = [...halls, ...events].filter((p) => {
      const key = nameKey(p.name);
      if (p.type !== "event" && taken.has(key)) return false;
      taken.add(p.type === "event" ? `${key}-${p.id}` : key);
      return true;
    });
    const places = [...city.places, ...fresh];
    const out = {
      ...city,
      lastUpdated: today,
      contributors: [
        ...new Set([...city.contributors, "Public library calendars", LICENCE_NOTES.statcan]),
      ],
      places,
    };
    writeFileSync(path.join(OUT, `${cityId}.json`), `${JSON.stringify(out, null, 2)}\n`);
    console.log(
      `  ${cityId}: ${city.places.length} curated, ${halls.length} facilities, ${events.length} events (${showings.length} showings)`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
