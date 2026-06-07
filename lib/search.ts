import Fuse from "fuse.js";
import { Place } from "@/lib/types";

export function createSearch(places: Place[]): Fuse<Place> {
  return new Fuse(places, {
    keys: ["name", "description", "tags", "highlights", "neighborhood", "why"],
    threshold: 0.4,
    includeScore: true,
  });
}
