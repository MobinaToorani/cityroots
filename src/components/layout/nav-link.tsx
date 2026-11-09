"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "./nav-items";
import { Icon } from "@/components/ui/icon";
import { homeCity, savedPlaces } from "@/lib/client/stores";
import { cn } from "@/lib/cn";

/** The saved count, shown on the Saved tab once there is something to count. */
function SavedCount() {
  const count = savedPlaces.use().length;
  if (count === 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
      {count}
      <span className="sr-only"> saved</span>
    </span>
  );
}

/** Primary navigation as header links on desktop or as a tab bar on phones. */
export function PrimaryNavLinks({ variant }: { variant: "tab" | "header" }) {
  const pathname = usePathname();
  const city = homeCity.use();
  return PRIMARY_NAV.map((item) => {
    const active = item.match(pathname);
    const href = (item.followsCity && city ? `${item.href}?city=${city}` : item.href) as Route;
    if (variant === "tab") {
      return (
        <Link
          key={item.href}
          href={href}
          prefetch={item.prefetch ?? undefined}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors duration-200",
            active ? "text-primary-text" : "text-text-muted hover:text-text",
          )}
        >
          <Icon
            icon={item.icon}
            fill={active && item.href === "/saved" ? "currentColor" : "none"}
          />
          {item.label}
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={href}
        prefetch={item.prefetch ?? undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex h-10 items-center rounded-control px-3.5 text-meta font-semibold transition-colors duration-200",
          active ? "bg-ink text-on-ink shadow-[var(--shadow-control)]" : "text-text hover:bg-sand",
        )}
      >
        {item.label}
        {item.href === "/saved" && <SavedCount />}
      </Link>
    );
  });
}
