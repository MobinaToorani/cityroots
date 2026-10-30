import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { categoryMeta, type CategorySlug } from "@/lib/domain/categories";

type CategoryTileProps = { slug: CategorySlug; count: number; freeCount: number; href: Route };

export function CategoryTile({ slug, count, freeCount, href }: CategoryTileProps) {
  const meta = categoryMeta(slug);
  return (
    <GlassCard interactive className="group relative flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full"
          style={{ backgroundColor: `var(--color-cat-${slug})` }}
        />
        <Icon
          icon={ArrowUpRight}
          size={16}
          className="text-text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
      <h3 className="text-card font-semibold tracking-tight">
        <Link
          href={href}
          className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
        >
          {meta.name}
        </Link>
      </h3>
      <p className="text-meta text-text-muted">
        {count} {count === 1 ? "place" : "places"}
        {freeCount > 0 && (
          <>
            , <span className="font-semibold text-free">{freeCount} free</span>
          </>
        )}
      </p>
    </GlassCard>
  );
}
