import {
  Bookmark,
  CalendarDays,
  Compass,
  House,
  Info,
  NotebookText,
  Route as RouteIcon,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

export type NavSurface = "rail" | "tab" | "header";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
  /** Where the item shows. The phone tab bar holds five at most. */
  on: readonly NavSurface[];
};

const ALL: readonly NavSurface[] = ["rail", "tab", "header"];

/** Only routes that exist are listed. New sections are added as they ship. */
export const PRIMARY_NAV: readonly NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (p) => p === "/" || p.startsWith("/city/"),
    on: ["rail"],
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (p) => p.startsWith("/explore") || p.startsWith("/places/"),
    on: ALL,
  },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    match: (p) => p.startsWith("/events"),
    on: ALL,
  },
  {
    href: "/guides",
    label: "Guides",
    icon: NotebookText,
    match: (p) => p.startsWith("/guides"),
    on: ["rail", "header"],
  },
  {
    href: "/planner",
    label: "Planner",
    icon: RouteIcon,
    match: (p) => p.startsWith("/planner") || p.startsWith("/plans/"),
    on: ALL,
  },
  {
    href: "/collections",
    label: "Saved",
    icon: Bookmark,
    match: (p) => p.startsWith("/collections"),
    on: ["rail", "tab"],
  },
  {
    href: "/about",
    label: "About",
    icon: Info,
    match: (p) => p.startsWith("/about") || p.startsWith("/pricing"),
    on: ["rail"],
  },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
    match: (p) => p.startsWith("/account") || p.startsWith("/signin"),
    on: ALL,
  },
];
