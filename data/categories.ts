import { Category, CostLevel } from "@/lib/types";

export const CATEGORIES: Record<
  Category,
  {
    label: string;
    shortLabel: string;
    emoji: string;
    color: string;
    description: string;
    icon: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  physical: {
    label: "Physical Wellbeing",
    shortLabel: "Physical",
    emoji: "💪",
    color: "emerald",
    description: "Gyms, trails, pools, yoga, sports",
    icon: "Dumbbell",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-300",
  },
  mental: {
    label: "Mental & Emotional",
    shortLabel: "Mental",
    emoji: "🧘",
    color: "violet",
    description: "Libraries, quiet spaces, support, mindfulness",
    icon: "Brain",
    bgClass: "bg-violet-100",
    textClass: "text-violet-700",
    borderClass: "border-violet-300",
  },
  social: {
    label: "Social Wellbeing",
    shortLabel: "Social",
    emoji: "🤝",
    color: "sky",
    description: "Community events, hubs, and connections",
    icon: "Users",
    bgClass: "bg-sky-100",
    textClass: "text-sky-700",
    borderClass: "border-sky-300",
  },
  financial: {
    label: "Financial Wellbeing",
    shortLabel: "Financial",
    emoji: "💰",
    color: "amber",
    description: "Free workshops, resources, and smart money tools",
    icon: "Wallet",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
  },
  "arts-crafts": {
    label: "Arts & Crafts",
    shortLabel: "Arts",
    emoji: "🎨",
    color: "purple",
    description: "Galleries, studios, pottery, and making things",
    icon: "Palette",
    bgClass: "bg-purple-100",
    textClass: "text-purple-700",
    borderClass: "border-purple-300",
  },
  "dance-music": {
    label: "Dance & Music",
    shortLabel: "Dance & Music",
    emoji: "🎵",
    color: "rose",
    description: "Studios, singing, instruments, and performing arts",
    icon: "Music",
    bgClass: "bg-rose-100",
    textClass: "text-rose-700",
    borderClass: "border-rose-300",
  },
  "food-culture": {
    label: "Food & Culture",
    shortLabel: "Food",
    emoji: "🌍",
    color: "orange",
    description: "Multicultural restaurants and cultural experiences",
    icon: "UtensilsCrossed",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    borderClass: "border-orange-300",
  },
  "cafes-spaces": {
    label: "Cafes & Third Spaces",
    shortLabel: "Cafes",
    emoji: "☕",
    color: "stone",
    description: "Coffee shops, reading nooks, and hangout spots",
    icon: "Coffee",
    bgClass: "bg-stone-100",
    textClass: "text-stone-700",
    borderClass: "border-stone-300",
  },
  thrifting: {
    label: "Thrifting & Markets",
    shortLabel: "Thrifting",
    emoji: "🛍️",
    color: "teal",
    description: "Thrift stores, vintage, pop-ups, and markets",
    icon: "ShoppingBag",
    bgClass: "bg-teal-100",
    textClass: "text-teal-700",
    borderClass: "border-teal-300",
  },
  events: {
    label: "Events & Pop-Ups",
    shortLabel: "Events",
    emoji: "📅",
    color: "pink",
    description: "Seasonal, free, and community events",
    icon: "Calendar",
    bgClass: "bg-pink-100",
    textClass: "text-pink-700",
    borderClass: "border-pink-300",
  },
};

export const COST_FILTERS: {
  value: CostLevel | "all";
  label: string;
  color: string;
}[] = [
  { value: "all", label: "All Costs", color: "zinc" },
  { value: "free", label: "Free", color: "green" },
  { value: "low", label: "Low Cost", color: "blue" },
  { value: "moderate", label: "Moderate", color: "amber" },
  { value: "varies", label: "Varies", color: "gray" },
];

// CSS var references — only valid in inline `style` CSS properties, NOT in SVG presentation attributes
export const CATEGORY_CSS_VARS: Record<Category, string> = {
  physical: "var(--color-category-physical)",
  mental: "var(--color-category-mental)",
  social: "var(--color-category-social)",
  financial: "var(--color-category-financial)",
  "arts-crafts": "var(--color-category-arts-crafts)",
  "dance-music": "var(--color-category-dance-music)",
  "food-culture": "var(--color-category-food-culture)",
  "cafes-spaces": "var(--color-category-cafes-spaces)",
  thrifting: "var(--color-category-thrifting)",
  events: "var(--color-category-events)",
};

// Actual hex values — use in SVG fill attributes and Leaflet pathOptions where CSS vars don't resolve
export const CATEGORY_COLORS: Record<Category, string> = {
  physical: "#059669",
  mental: "#7c3aed",
  social: "#0284c7",
  financial: "#d97706",
  "arts-crafts": "#9333ea",
  "dance-music": "#e11d48",
  "food-culture": "#ea580c",
  "cafes-spaces": "#57534e",
  thrifting: "#0d9488",
  events: "#db2777",
};
