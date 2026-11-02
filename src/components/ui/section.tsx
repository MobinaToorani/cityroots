import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>
  );
}

type SectionHeadingProps = {
  id: string;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  id,
  title,
  eyebrow,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-meta font-semibold text-primary-text">{eyebrow}</p>}
        <h2 id={id} className="text-section font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-2 text-body text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
