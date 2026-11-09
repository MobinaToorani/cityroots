import { cn } from "@/lib/cn";

/** Shared styling and aria wiring for form fields. */
export function fieldControlClasses(error?: string, extra?: string) {
  return cn(
    "peer w-full rounded-control border bg-surface-solid px-4 text-body text-text shadow-[var(--shadow-control)] transition-[border-color,box-shadow] duration-200 outline-none",
    "focus-visible:outline-none focus-visible:ring-4",
    error
      ? "border-danger focus-visible:ring-danger/15"
      : "border-divider hover:border-text-muted/60 focus-visible:border-primary focus-visible:ring-primary/15",
    extra,
  );
}

/** A bare input, such as a share link to copy. */
export const plainInputClasses =
  "h-11 rounded-control border border-divider bg-surface-solid px-4 text-body";

export const floatingLabelClasses =
  "pointer-events-none absolute top-3.5 left-4 text-[11px] font-semibold text-text-muted";

export function describedBy(id: string, description?: string, error?: string) {
  const ids = [description ? `${id}-description` : null, error ? `${id}-error` : null].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}
