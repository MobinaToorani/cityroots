import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  /** Every empty state offers a next step. */
  action: ReactNode;
  /** Use "h1" when the empty state is the whole page. */
  headingLevel?: "h1" | "h2";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  children,
  action,
  headingLevel = "h2",
  className,
}: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "mx-auto grid max-w-md justify-items-center gap-3 rounded-[var(--radius-card)] px-6 py-10 text-center glass",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-free-soft text-free">
        <Icon icon={icon} />
      </span>
      <Heading className="text-card font-semibold">{title}</Heading>
      <div className="text-body text-text-muted">{children}</div>
      <div className="mt-2">{action}</div>
    </div>
  );
}
