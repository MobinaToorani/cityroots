"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { chipClasses } from "@/components/ui/chip";

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
            className={chipClasses(current)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
