import { Category } from "@/lib/types";
import {
  Dumbbell,
  Brain,
  Users,
  Wallet,
  Palette,
  Music,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  physical: Dumbbell,
  mental: Brain,
  social: Users,
  financial: Wallet,
  "arts-crafts": Palette,
  "dance-music": Music,
  "food-culture": UtensilsCrossed,
  "cafes-spaces": Coffee,
  thrifting: ShoppingBag,
  events: Calendar,
};

export function CategoryIcon({
  category,
  className,
  style,
}: {
  category: Category;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={cn("w-4 h-4", className)} style={style} aria-hidden />;
}
