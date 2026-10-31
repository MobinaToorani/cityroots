import type { CategorySlug } from "./categories";

// The shape of a day plan. Kept free of validation code so the plan editor in
// the browser can use it without shipping Zod.

export type Kind = "place" | "event" | "program" | "resource";

export const SLOT_KEYS = ["morning", "free", "lunch", "afternoon", "evening"] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export type PlanSlot = {
  key: SlotKey;
  label: string;
  /** "HH:MM", 24-hour. */
  time: string;
  categories: readonly CategorySlug[];
  kinds: readonly Kind[];
  freeOnly?: boolean;
};

/** The shape of a day out. Interests reorder the choices inside each slot. */
export const PLAN_SLOTS: readonly PlanSlot[] = [
  {
    key: "morning",
    label: "Morning coffee",
    time: "09:30",
    categories: ["cafes"],
    kinds: ["place"],
  },
  {
    key: "free",
    label: "Something free",
    time: "11:00",
    categories: ["physical", "mental", "arts", "thrifting", "social", "dance-music"],
    kinds: ["place", "program"],
    freeOnly: true,
  },
  { key: "lunch", label: "Lunch", time: "13:00", categories: ["food", "cafes"], kinds: ["place"] },
  {
    key: "afternoon",
    label: "Afternoon stop",
    time: "15:00",
    categories: ["arts", "thrifting", "mental", "physical", "dance-music", "social"],
    kinds: ["place", "program"],
  },
  {
    key: "evening",
    label: "Evening",
    time: "18:30",
    categories: ["events", "social", "dance-music", "arts"],
    kinds: ["event", "place", "program"],
  },
];

/** Times by position, so a reordered plan still reads top to bottom through the day. */
export const SLOT_TIMES = PLAN_SLOTS.map((s) => s.time);

export function slotLabel(key: SlotKey): string {
  return PLAN_SLOTS.find((s) => s.key === key)?.label ?? "Stop";
}

export function timeLabel(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}
