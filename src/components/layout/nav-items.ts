import {
  CalendarDays,
  Compass,
  Heart,
  Route as RouteIcon,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
  /** The link carries the visitor's city, so a tap lands on the right results. */
  followsCity?: boolean;
  /** Personal pages are rarely the next click, so their code loads when asked for. */
  prefetch?: false;
};

/** The four things the site does, plus the account. Every other page is reached from these. */
export const PRIMARY_NAV: readonly NavItem[] = [
  {
    href: "/explore",
    label: "Things to do",
    icon: Compass,
    match: (p) => p.startsWith("/explore") || p.startsWith("/places/") || p.startsWith("/city/"),
    followsCity: true,
  },
  {
    href: "/events",
    label: "What's on",
    icon: CalendarDays,
    match: (p) => p.startsWith("/events"),
    followsCity: true,
  },
  {
    href: "/planner",
    label: "Plan a day",
    icon: RouteIcon,
    match: (p) => p.startsWith("/planner") || p.startsWith("/plans/"),
    followsCity: true,
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Heart,
    match: (p) => p.startsWith("/saved") || p.startsWith("/collections"),
    prefetch: false,
  },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
    match: (p) => p.startsWith("/account") || p.startsWith("/signin"),
    prefetch: false,
  },
];
