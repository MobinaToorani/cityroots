"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "./nav-items";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

type Variant = "rail" | "tab" | "header";

const styles: Record<Variant, { base: string; active: string; idle: string }> = {
  rail: {
    base: "flex h-11 items-center gap-3 rounded-full px-4 text-body font-medium transition-colors duration-200",
    active: "bg-ink text-on-ink",
    idle: "text-text-muted hover:bg-surface-strong hover:text-text",
  },
  tab: {
    base: "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-colors duration-200",
    active: "text-text",
    idle: "text-text-muted hover:text-text",
  },
  header: {
    base: "inline-flex h-9 items-center rounded-full px-3.5 text-meta font-semibold transition-colors duration-200",
    active: "bg-ink text-on-ink",
    idle: "text-text hover:bg-surface-strong",
  },
};

/** Renders the primary navigation in one of three shapes. */
export function PrimaryNavLinks({ variant, skip = [] }: { variant: Variant; skip?: string[] }) {
  const pathname = usePathname();
  const s = styles[variant];
  return PRIMARY_NAV.filter((item) => !skip.includes(item.href)).map((item) => {
    const active = item.match(pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(s.base, active ? s.active : s.idle)}
      >
        {variant !== "header" && (
          <span
            className={cn(
              "grid place-items-center",
              variant === "tab" && "h-7 w-12 rounded-full",
              variant === "tab" && active && "bg-ink text-on-ink",
            )}
          >
            <Icon icon={item.icon} size={20} />
          </span>
        )}
        {item.label}
      </Link>
    );
  });
}
