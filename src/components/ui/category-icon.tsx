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

/** The category's line icon in its colour, so a list can be scanned by type at a glance. */
export function CategoryIcon({
  slug,
  size = 20,
  className,
}: {
  slug: CategorySlug;
  size?: 16 | 20;
  className?: string;
}) {
  return (
    <Icon
      icon={CATEGORY_ICONS[slug]}
      size={size}
      className={cn("shrink-0", className)}
      style={{ color: `var(--color-cat-${slug})` }}
    />
  );
}
