import { z } from "zod";

/** CityRoots Pro prices, in Canadian dollars. Stripe prices are found by lookup key. */
export const PRO_PLANS = {
  monthly: { lookupKey: "cityroots_pro_monthly", amount: 4.99, interval: "month" },
  yearly: { lookupKey: "cityroots_pro_yearly", amount: 39, interval: "year" },
} as const;

export type ProPeriod = keyof typeof PRO_PLANS;

export function isProPeriod(value: unknown): value is ProPeriod {
  return value === "monthly" || value === "yearly";
}

/** Whole-percent saving of the yearly plan over twelve monthly payments. */
export function yearlySavingPercent(): number {
  const monthlyYear = PRO_PLANS.monthly.amount * 12;
  return Math.floor(((monthlyYear - PRO_PLANS.yearly.amount) / monthlyYear) * 100);
}

/** Free members can keep this many collections. Pro has no limit. */
export const FREE_COLLECTION_LIMIT = 3;

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Statuses that keep Pro on. `past_due` stays on while Stripe retries the
 * card, so a failed renewal never locks someone out mid-plan.
 */
const PRO_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing", "past_due"]);

/** If webhooks stop arriving, Pro still ends a few days after the paid period. */
const GRACE_MS = 3 * 86_400_000;

export function hasProAccess(
  sub: { status: SubscriptionStatus; currentPeriodEnd: Date | null } | null,
  now: Date = new Date(),
): boolean {
  if (!sub || !PRO_STATUSES.has(sub.status)) return false;
  if (sub.currentPeriodEnd && now.getTime() > sub.currentPeriodEnd.getTime() + GRACE_MS) {
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Stripe payloads, parsed at the boundary                             */
/* ------------------------------------------------------------------ */

const idOrObject = z
  .union([z.string(), z.object({ id: z.string() })])
  .transform((v) => (typeof v === "string" ? v : v.id));

export const stripeSubscriptionSchema = z.object({
  id: z.string().startsWith("sub_"),
  customer: idOrObject,
  status: z.enum(SUBSCRIPTION_STATUSES),
  cancel_at_period_end: z.boolean().default(false),
  metadata: z.record(z.string(), z.string()).default({}),
  items: z.object({
    data: z.array(
      z.object({
        current_period_end: z.number().int().optional(),
        price: z.object({ lookup_key: z.string().nullable().optional() }),
      }),
    ),
  }),
});

export const stripeCheckoutSessionSchema = z.object({
  id: z.string().startsWith("cs_"),
  mode: z.string(),
  client_reference_id: z.string().nullable(),
  customer: idOrObject.nullable(),
  subscription: z
    .union([z.string(), stripeSubscriptionSchema])
    .nullable()
    .transform((v) =>
      v === null || typeof v === "string" ? { id: v, full: null } : { id: v.id, full: v },
    ),
});

export type SubscriptionRecord = {
  userId: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  priceLookupKey: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

/** What we store about a Stripe subscription. */
export function toSubscriptionRecord(
  sub: z.infer<typeof stripeSubscriptionSchema>,
): SubscriptionRecord {
  const ends = sub.items.data
    .map((i) => i.current_period_end)
    .filter((n): n is number => typeof n === "number");
  return {
    userId: sub.metadata.userId ?? null,
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    priceLookupKey: sub.items.data[0]?.price.lookup_key ?? null,
    currentPeriodEnd: ends.length > 0 ? new Date(Math.max(...ends) * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

export function periodForLookupKey(key: string | null): ProPeriod | null {
  if (key === PRO_PLANS.monthly.lookupKey) return "monthly";
  if (key === PRO_PLANS.yearly.lookupKey) return "yearly";
  return null;
}
