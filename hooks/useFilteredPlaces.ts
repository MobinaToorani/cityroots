import { useMemo } from "react";
import Fuse from "fuse.js";
import { Place, FilterState } from "@/lib/types";
import { sortPlaces } from "@/lib/utils";

export function useFilteredPlaces(places: Place[], filters: FilterState, fuse: Fuse<Place>): Place[] {
  return useMemo(() => {
    let result: Place[];

    if (filters.search.trim()) {
      result = fuse.search(filters.search.trim()).map((r) => r.item);
    } else {
      result = places;
    }

    if (filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters.cost !== "all") {
      result = result.filter((p) => p.cost === filters.cost);
    }
    if (filters.type !== "all") {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters.showRecommendedOnly) {
      result = result.filter((p) => p.isRecommended);
    }

    // Only sort when not searching (fuse score already orders results)
    return filters.search.trim() ? result : sortPlaces(result);
  }, [places, filters, fuse]);
}
