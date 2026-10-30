import type { LucideIcon, LucideProps } from "lucide-react";

type IconProps = Omit<LucideProps, "size" | "ref"> & {
  icon: LucideIcon;
  /** The product uses exactly two icon sizes. */
  size?: 16 | 20;
  /** Give a label only when the icon carries meaning on its own. */
  label?: string;
};

export function Icon({ icon: Glyph, size = 20, label, ...props }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={size === 16 ? 2 : 1.75}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...props}
    />
  );
}
