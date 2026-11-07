import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ink" | "quiet" | "photo" | "photo-outline";
type Size = "sm" | "md" | "lg";

const base =
  "motion-press relative touch-target inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-divider bg-surface-solid text-text hover:border-text-muted/50",
  ink: "bg-ink text-on-ink hover:opacity-90",
  quiet: "quiet-link rounded-none px-0 text-primary-text active:translate-y-0",
  // On a darkened photo, in both themes.
  photo: "bg-white text-[#141412] hover:bg-white/90",
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
    "motion-press touch-target relative grid size-10 shrink-0 place-items-center rounded-control text-text-muted transition-colors hover:bg-divider/60 hover:text-text disabled:opacity-35",
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
