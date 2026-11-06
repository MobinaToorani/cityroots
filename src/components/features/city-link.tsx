"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { homeCity } from "@/lib/client/stores";

/** A link that lands on the visitor's own city, once we know it. */
export function CityLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: Route }) {
  const city = homeCity.use();
  const target = (
    city && !href.includes("city=") ? `${href}${href.includes("?") ? "&" : "?"}city=${city}` : href
  ) as Route;
  return <Link href={target} {...props} />;
}
