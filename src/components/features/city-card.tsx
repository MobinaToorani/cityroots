import Link from "next/link";
import { Photo } from "./photo";
import type { CitySummary } from "@/lib/data/types";
import { photo } from "@/lib/photos";
import { cn } from "@/lib/cn";

export function CityCard({ city, className }: { city: CitySummary; className?: string }) {
  const image = photo(city.heroImage);
  const freeShare = city.placeCount > 0 ? Math.round((city.freeCount / city.placeCount) * 100) : 0;
  return (
    <article
      className={cn(
        "motion-lift group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-primary p-3 shadow-[var(--shadow-glass)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      {image && (
        <Photo
          photo={image}
          alt=""
          sizes="(min-width: 1024px) 280px, 70vw"
          className="-z-10 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
        />
      )}
      <div className="rounded-2xl p-4 glass-strong">
        <p className="text-meta text-text-muted">{city.region}</p>
        <h3 className="text-card font-semibold tracking-tight">
          <Link
            href={`/city/${city.slug}`}
            className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
          >
            {city.name}
          </Link>
        </h3>
        <p className="mt-1 text-meta text-text-muted">
          {city.placeCount} places,{" "}
          <span className="font-semibold text-free">{freeShare}% free</span>
        </p>
      </div>
    </article>
  );
}
