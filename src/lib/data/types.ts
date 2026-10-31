import type { PlaceAccessibility, PlaceHours } from "@/lib/db/schema";
import type { CategorySlug } from "@/lib/domain/categories";
import type { CostBand } from "@/lib/domain/cost";

export type PlaceKind = "place" | "event" | "program" | "resource";

export type CitySummary = {
  id: string;
  slug: string;
  name: string;
  region: string;
  tagline: string;
  heroImage: string | null;
  placeCount: number;
  freeCount: number;
};

export type CityDetail = CitySummary & {
  province: string;
  description: string;
  curatorNote: string | null;
  lat: number;
  lng: number;
};

export type CategoryCount = { slug: CategorySlug; count: number; freeCount: number };

export type PlaceCard = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  kind: PlaceKind;
  category: CategorySlug;
  costBand: CostBand;
  priceNote: string | null;
  neighborhood: string | null;
  citySlug: string;
  cityName: string;
  isPick: boolean;
  image: string | null;
  seasonNote: string | null;
};

export type PlaceDetail = PlaceCard & {
  description: string;
  highlights: string[];
  tags: string[];
  curatorNote: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours: PlaceHours | null;
  phone: string | null;
  sourceUrl: string | null;
  accessibility: PlaceAccessibility | null;
  lastVerifiedAt: string | null;
  /** The people who run the place confirmed its details. Display only; never ranked. */
  ownerConfirmed: boolean;
  tips: { id: string; body: string; createdAt: Date }[];
};

export type SiteStats = { cities: number; places: number; freeShare: number };
