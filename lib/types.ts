export type CostLevel = "free" | "low" | "moderate" | "varies";

export type Category =
  | "physical"
  | "mental"
  | "social"
  | "financial"
  | "arts-crafts"
  | "dance-music"
  | "food-culture"
  | "cafes-spaces"
  | "thrifting"
  | "events";

export type PlaceType = "place" | "event" | "resource" | "program";

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  category: Category;
  tags: string[];
  cost: CostLevel;
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
  why?: string;
  isRecommended?: boolean;
  isFree?: boolean;
  imageUrl?: string;
  seasonal?: boolean;
  seasonNote?: string;
  lastVerified?: string;
}

export interface CityGuide {
  cityId: string;
  cityName: string;
  province: string;
  country: string;
  tagline: string;
  heroDescription: string;
  coverImage?: string;
  lat: number;
  lng: number;
  contributors?: string[];
  lastUpdated: string;
  places: Place[];
}

export interface FilterState {
  search: string;
  category: Category | "all";
  cost: CostLevel | "all";
  type: PlaceType | "all";
  view: "grid" | "list" | "map";
  showRecommendedOnly: boolean;
}

export const defaultFilters: FilterState = {
  search: "",
  category: "all",
  cost: "all",
  type: "all",
  view: "grid",
  showRecommendedOnly: false,
};
