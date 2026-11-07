import type { Route } from "next";
import { CategoryIcon } from "@/components/ui/category-icon";
import { categoryMeta, type CategorySlug } from "@/lib/domain/categories";
import { CityLink } from "./city-link";

type CategoryTileProps = { slug: CategorySlug; count?: number; href: Route };

/** One entry in the index of categories: a ruled line, not another box. */
export function CategoryTile({ slug, count, href }: CategoryTileProps) {
  const meta = categoryMeta(slug);
  return (
    <div className="group relative flex items-start gap-2.5 border-t border-divider py-3">
      <CategoryIcon slug={slug} className="mt-0.5" />
      <div className="min-w-0">
        <h3 className="leading-snug font-semibold tracking-tight">
          <CityLink href={href} className="group-hover:underline after:absolute after:inset-0">
            {meta.name}
          </CityLink>
        </h3>
        {count !== undefined && (
          <p className="text-meta text-text-muted">{count === 1 ? "1 place" : `${count} places`}</p>
        )}
      </div>
    </div>
  );
}
