import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Place } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortPlaces(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}

export function getCostLabel(cost: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    low: "Low Cost",
    moderate: "Moderate",
    varies: "Varies",
  };
  return labels[cost] ?? cost;
}
