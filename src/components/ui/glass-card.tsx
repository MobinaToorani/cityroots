import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type GlassCardProps<T extends ElementType> = {
  as?: T;
  /** Use "strong" whenever the card carries text over photography. */
  strength?: "default" | "strong";
  interactive?: boolean;
} & Omit<ComponentProps<T>, "as">;

export function GlassCard<T extends ElementType = "div">({
  as,
  strength = "default",
  interactive = false,
  className,
  ...props
}: GlassCardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        strength === "strong" ? "glass-strong" : "glass",
        "rounded-[var(--radius-card)]",
        interactive &&
          "motion-lift transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    />
  );
}
