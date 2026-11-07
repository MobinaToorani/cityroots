import { Star } from "lucide-react";
import type { CategorySlug } from "@/lib/domain/categories";
import { categoryMeta } from "@/lib/domain/categories";
import { COST_LABELS, type CostBand } from "@/lib/domain/cost";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "./category-icon";
import { Icon } from "./icon";

/** Cost as plain text. Free is the one coloured label on the site. */
export function CostBadge({ band, className }: { band: CostBand; className?: string }) {
  return (
    <span
      className={cn(
        "text-meta whitespace-nowrap",
        band === "free" ? "font-semibold text-free" : "font-medium text-text-muted",
        className,
      )}
    >
      {COST_LABELS[band]}
    </span>
  );
}

export function CategoryTag({ slug, className }: { slug: CategorySlug; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-meta text-text-muted", className)}>
      <CategoryIcon slug={slug} size={16} />
      {categoryMeta(slug).name}
    </span>
  );
}

export function PickBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-meta font-semibold text-pick", className)}
    >
      <Icon icon={Star} size={16} fill="currentColor" />
      Local pick
    </span>
  );
}
