import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/cn";

type SegmentedLinksProps = {
  label: string;
  items: readonly { href: Route; label: string; active: boolean }[];
  className?: string;
};

/** Server-rendered segmented control where each segment is a URL. Works without JavaScript. */
export function SegmentedLinks({ label, items, className }: SegmentedLinksProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "inline-flex rounded-control border border-divider bg-surface-solid p-0.5",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          scroll={false}
          className={cn(
            "touch-target relative inline-flex h-8 items-center rounded-control px-4 text-meta font-semibold transition-colors duration-200",
            item.active ? "bg-ink text-on-ink" : "text-text-muted hover:text-text",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
