"use client";

import { MapPin } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FilterDropdown, FilterOption } from "@/components/ui/filter-dropdown";
import { Icon } from "@/components/ui/icon";
import { homeCity } from "@/lib/client/stores";

type CityOption = { slug: string; name: string };

/** Where a city choice leads: the page in view if it is city-based, otherwise the city's page. */
function destination(slug: string | null): Route {
  const { pathname, search } = window.location;
  if (pathname === "/explore" || pathname === "/events" || pathname === "/planner") {
    const params = new URLSearchParams(search);
    if (slug) params.set("city", slug);
    else params.delete("city");
    params.delete("page");
    params.delete("bbox");
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}` as Route;
  }
  return (slug ? `/city/${slug}` : "/explore") as Route;
}

/** The visitor's city, always one tap away. The whole site follows it. */
export function CityPicker({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const current = homeCity.use();
  const name = cities.find((c) => c.slug === current)?.name;

  function choose(slug: string | null) {
    homeCity.write(slug);
    router.push(destination(slug));
  }

  return (
    <FilterDropdown
      label="Your city"
      summary={
        <>
          <Icon icon={MapPin} size={16} className="text-primary-text" />
          {name ?? "All cities"}
        </>
      }
    >
      <FilterOption mode="single" selected={!current} href="/explore" onSelect={() => choose(null)}>
        All cities
      </FilterOption>
      {cities.map((c) => (
        <FilterOption
          key={c.slug}
          mode="single"
          selected={current === c.slug}
          href={`/city/${c.slug}` as Route}
          onSelect={() => choose(c.slug)}
        >
          {c.name}
        </FilterOption>
      ))}
    </FilterDropdown>
  );
}

/**
 * Keeps the picker in step with the page. On list pages an empty city really
 * means "all cities", because the site's own links always carry the city.
 */
export function RememberCity({
  slug,
  clearWhenEmpty = false,
}: {
  slug: string | null;
  clearWhenEmpty?: boolean;
}) {
  useEffect(() => {
    if (slug || clearWhenEmpty) homeCity.write(slug);
  }, [slug, clearWhenEmpty]);
  return null;
}
