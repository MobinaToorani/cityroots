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
        "group relative isolate flex aspect-[3/2] flex-col justify-end overflow-hidden rounded-card bg-primary p-3",
        className,
      )}
    >
      {image && (
        <Photo photo={image} alt="" sizes="(min-width: 1024px) 240px, 50vw" className="-z-20" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />
      <h3 className="text-card font-semibold tracking-tight text-white">
        <Link
          href={`/city/${city.slug}`}
          className="group-hover:underline after:absolute after:inset-0 after:rounded-card"
        >
          {city.name}
        </Link>
      </h3>
      <p className="text-meta text-white/90">{city.browseCount} places</p>
    </article>
  );
}
