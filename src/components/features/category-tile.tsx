import type { Route } from "next";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { categoryMeta, type CategorySlug } from "@/lib/domain/categories";
import { CityLink } from "./city-link";

type CategoryTileProps = { slug: CategorySlug; count?: number; href: Route };

export function CategoryTile({ slug, count, href }: CategoryTileProps) {
  const meta = categoryMeta(slug);
  return (
    <Card interactive className="relative flex items-center gap-3 p-3">
      <CategoryIcon slug={slug} />
      <div className="min-w-0">
        <h3 className="leading-snug font-semibold tracking-tight">
          <CityLink
            href={href}
            className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
          >
            {meta.name}
          </CityLink>
        </h3>
        {count !== undefined && <p className="text-meta text-text-muted">{count} places</p>}
      </div>
    </Card>
  );
}
