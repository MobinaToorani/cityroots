import {
  Coffee,
  Flower2,
  Footprints,
  Music,
  Palette,
  PartyPopper,
  PiggyBank,
  Shirt,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug } from "@/lib/domain/categories";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export const CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  physical: Footprints,
  mental: Flower2,
  social: Users,
  financial: PiggyBank,
  arts: Palette,
  "dance-music": Music,
  food: Utensils,
  cafes: Coffee,
  thrifting: Shirt,
  events: PartyPopper,
};

/** A soft tile in the category's colour, so a list can be scanned by type at a glance. */
export function CategoryIcon({ slug, className }: { slug: CategorySlug; className?: string }) {
  const color = `var(--color-cat-${slug})`;
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl", className)}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <Icon icon={CATEGORY_ICONS[slug]} />
    </span>
  );
}
