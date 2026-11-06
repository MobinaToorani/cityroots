import Link from "next/link";
import { Photo } from "./photo";
import type { CitySummary } from "@/lib/data/types";
import { photo } from "@/lib/photos";
import { cn } from "@/lib/cn";

export function CityCard({ city, className }: { city: CitySummary; className?: string }) {
  const image = photo(city.heroImage);
  return (
    <article
      className={cn(
        "motion-lift group relative isolate flex aspect-[3/2] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-primary p-3 transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      {image && (
        <Photo
          photo={image}
          alt=""
          sizes="(min-width: 1024px) 240px, 50vw"
          className="-z-20 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />
      <h3 className="text-card font-semibold tracking-tight text-white">
        <Link
          href={`/city/${city.slug}`}
          className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
        >
          {city.name}
        </Link>
      </h3>
      <p className="text-meta text-white/90">{city.placeCount} places</p>
    </article>
  );
}
