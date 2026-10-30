import { Compass, House, Info, UserRound, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

/** Only routes that exist are listed. New sections are added as they ship. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Home", icon: House, match: (p) => p === "/" || p.startsWith("/city/") },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (p) => p.startsWith("/explore") || p.startsWith("/places/"),
  },
  { href: "/about", label: "About", icon: Info, match: (p) => p.startsWith("/about") },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
    match: (p) => p.startsWith("/account") || p.startsWith("/signin"),
  },
];
