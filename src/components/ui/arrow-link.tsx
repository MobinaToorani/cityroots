import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** The small round arrow that says "this goes somewhere". */
export function CircleArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border border-current/25 transition-[background-color,color,border-color,transform] duration-300 ease-[var(--ease-out-expo)] group-hover:rotate-45",
        className,
      )}
    >
      <Icon icon={ArrowUpRight} size={16} />
    </span>
  );
}

/** A quiet bordered link for "see all" moves at the end of a section. */
export function PillLink({
  href,
  children,
  className,
}: {
  href: Route;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "touch-target relative inline-flex h-9 items-center gap-1.5 rounded-full border border-divider bg-surface-solid px-4 text-meta font-semibold whitespace-nowrap shadow-[var(--shadow-control)] transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-on-ink",
        className,
      )}
    >
      {children}
      <Icon icon={ArrowUpRight} size={16} />
    </Link>
  );
}
