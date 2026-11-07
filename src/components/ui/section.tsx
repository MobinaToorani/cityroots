import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("page-frame", className)}>{children}</div>;
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
    <div
      className={cn(
        "mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-meta font-semibold text-primary-text">{eyebrow}</p>}
        <h2 id={id} className="font-display text-section font-medium tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-2 text-body text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** One band of a page: the same spacing, edges, and heading every time. */
export function PageSection({
  children,
  ...heading
}: Omit<SectionHeadingProps, "className"> & { children: ReactNode }) {
  return (
    <section aria-labelledby={heading.id} className="pt-16 sm:pt-24">
      <Container>
        <SectionHeading {...heading} />
        {children}
      </Container>
    </section>
  );
}
