import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = {
  as?: T;
  /** Frosted surface. Only for cards that sit on top of a photo or map. */
  overPhoto?: boolean;
  /** Answers to hover. Use when the whole card is a link. */
  interactive?: boolean;
} & Omit<ComponentProps<T>, "as">;

export function Card<T extends ElementType = "div">({
  as,
  overPhoto = false,
  interactive = false,
  className,
  ...props
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        overPhoto ? "glass-strong" : "card",
        "rounded-card",
        interactive && "motion-lift hover:border-text-muted/30",
        className,
      )}
      {...props}
    />
  );
}
