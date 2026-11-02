import { describe, expect, it } from "vitest";
import {
  hasProAccess,
  stripeCheckoutSessionSchema,
  stripeSubscriptionSchema,
  toSubscriptionRecord,
  yearlySavingPercent,
} from "@/lib/domain/subscription";

const now = new Date("2026-10-30T12:00:00Z");
const later = new Date("2026-11-30T12:00:00Z");

describe("hasProAccess", () => {
  it("is on for active, trialing, and past due", () => {
    for (const status of ["active", "trialing", "past_due"] as const) {
      expect(hasProAccess({ status, currentPeriodEnd: later }, now)).toBe(true);
    }
  });
  it("is off for canceled, unpaid, and no subscription", () => {
    expect(hasProAccess({ status: "canceled", currentPeriodEnd: later }, now)).toBe(false);
    expect(hasProAccess({ status: "unpaid", currentPeriodEnd: later }, now)).toBe(false);
    expect(hasProAccess(null, now)).toBe(false);
  });
  it("ends a few days after the paid period if no update ever arrives", () => {
    const ended = new Date("2026-10-20T12:00:00Z");
    expect(hasProAccess({ status: "active", currentPeriodEnd: ended }, now)).toBe(false);
  });
});

describe("Stripe payloads", () => {
  const subscription = {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    metadata: { userId: "user-1" },
    items: {
      object: "list",
      data: [
        {
          current_period_end: 1_795_000_000,
          price: { id: "price_1", lookup_key: "cityroots_pro_yearly" },
        },
      ],
    },
  };

  it("turns a subscription into the stored record", () => {
    const record = toSubscriptionRecord(stripeSubscriptionSchema.parse(subscription));
    expect(record).toEqual({
      userId: "user-1",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      status: "active",
      priceLookupKey: "cityroots_pro_yearly",
      currentPeriodEnd: new Date(1_795_000_000_000),
      cancelAtPeriodEnd: false,
    });
  });

  it("rejects statuses Stripe does not send", () => {
    expect(stripeSubscriptionSchema.safeParse({ ...subscription, status: "gold" }).success).toBe(
      false,
    );
  });

  it("reads checkout sessions with or without the subscription expanded", () => {
    const base = {
      id: "cs_1",
      mode: "subscription",
      client_reference_id: "user-1",
      customer: "cus_123",
    };
    expect(
      stripeCheckoutSessionSchema.parse({ ...base, subscription: "sub_123" }).subscription,
    ).toEqual({ id: "sub_123", full: null });
    const expanded = stripeCheckoutSessionSchema.parse({ ...base, subscription });
    expect(expanded.subscription.id).toBe("sub_123");
    expect(expanded.subscription.full?.status).toBe("active");
  });

  it("prices the yearly plan below twelve months", () => {
    expect(yearlySavingPercent()).toBe(34);
  });
});
