import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ink" | "quiet" | "photo" | "photo-outline";
type Size = "sm" | "md" | "lg";

const base =
  "motion-press relative touch-target inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[var(--shadow-control)] hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_8px_20px_-6px_rgba(23,69,110,0.5)]",
  secondary:
    "border border-divider bg-surface-solid text-text shadow-[var(--shadow-control)] hover:border-text-muted/40 hover:bg-sand/60",
  ink: "bg-ink text-on-ink shadow-[var(--shadow-control)] hover:-translate-y-px hover:bg-deep hover:shadow-[var(--shadow-lift)]",
  quiet: "quiet-link rounded-none px-0 text-primary-text active:translate-y-0",
  // On a darkened photo.
  photo: "bg-white text-text hover:-translate-y-px hover:bg-sand",
  "photo-outline": "border border-white/70 bg-black/30 text-white hover:bg-black/50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-meta",
  md: "h-11 px-5 text-body",
  lg: "h-13 px-7 text-base",
};

/** A control that is only an icon, such as Close. Needs an aria-label. */
export function iconButtonClasses(className?: string) {
  return cn(
    "motion-press touch-target relative grid size-10 shrink-0 place-items-center rounded-control text-text-muted transition-colors duration-200 hover:bg-sand hover:text-text disabled:opacity-35",
    className,
  );
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], variant !== "quiet" && sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
