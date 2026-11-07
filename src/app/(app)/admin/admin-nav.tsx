"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Item = { href: Route; label: string };

export function AdminNav({ items }: { items: readonly Item[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const current = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-control border px-3.5 text-meta font-medium",
              current
                ? "border-ink bg-ink text-on-ink"
                : "border-divider bg-surface-solid hover:border-text-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
