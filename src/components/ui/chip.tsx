import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Route } from "next";
import { cn } from "@/lib/cn";

const chipBase =
  "motion-press relative touch-target inline-flex h-9 shrink-0 items-center gap-2 rounded-control px-3.5 text-meta font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] active:translate-y-px";

export function chipClasses(active: boolean, className?: string) {
  return cn(
    chipBase,
    active
      ? "bg-ink text-on-ink shadow-[var(--shadow-control)]"
      : "border border-divider bg-surface-solid text-text hover:border-text-muted/40 hover:bg-sand/60",
    className,
  );
}

type ChipLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
  active: boolean;
  children: ReactNode;
};

/** A filter chip that works without JavaScript: each state is a URL. */
export function ChipLink({ href, active, className, children, ...props }: ChipLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={chipClasses(active, className)}
      scroll={false}
      {...props}
    >
      {children}
    </Link>
  );
}
