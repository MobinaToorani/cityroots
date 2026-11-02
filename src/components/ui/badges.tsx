import { Sparkles } from "lucide-react";
import type { CategorySlug } from "@/lib/domain/categories";
import { categoryMeta } from "@/lib/domain/categories";
import { COST_LABELS, type CostBand } from "@/lib/domain/cost";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export function CostBadge({ band, className }: { band: CostBand; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-meta font-semibold",
        band === "free" ? "bg-free-soft text-free" : "bg-divider/70 text-text",
        className,
      )}
    >
      {COST_LABELS[band]}
    </span>
  );
}

export function CategoryTag({ slug, className }: { slug: CategorySlug; className?: string }) {
  const meta = categoryMeta(slug);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-meta text-text-muted", className)}>
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--color-cat-${slug})` }}
      />
      {meta.shortName}
    </span>
  );
}

export function PickBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full bg-pick-soft px-2.5 text-meta font-semibold text-pick",
        className,
      )}
    >
      <Icon icon={Sparkles} size={16} />
      Pick
    </span>
  );
}

/** Quiet numeric badge. The product never uses pulsing or "ping" indicators. */
export function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-on-ink"
      aria-label={label}
    >
      {count}
    </span>
  );
}
