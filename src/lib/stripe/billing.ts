import "server-only";
import { db } from "@/lib/db/client";
import { linkCustomer, upsertSubscription } from "@/lib/data/subscriptions";
import {
  PRO_PLANS,
  stripeCheckoutSessionSchema,
  toSubscriptionRecord,
  type ProPeriod,
} from "@/lib/domain/subscription";
import { absoluteUrl } from "@/lib/site";
import { stripe } from "./client";

const priceIds = new Map<string, string>();

async function priceIdFor(period: ProPeriod): Promise<string> {
  const lookupKey = PRO_PLANS[period].lookupKey;
  const cached = priceIds.get(lookupKey);
  if (cached) return cached;
  const { data } = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const price = data[0];
  if (!price) throw new Error(`No active Stripe price with lookup key ${lookupKey}`);
  priceIds.set(lookupKey, price.id);
  return price.id;
}

/** A hosted Stripe Checkout page for Pro. Returns its URL. */
export async function createCheckoutUrl(input: {
  userId: string;
  email: string;
  period: ProPeriod;
  stripeCustomerId: string | null;
}): Promise<string> {
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: await priceIdFor(input.period), quantity: 1 }],
    ...(input.stripeCustomerId
      ? { customer: input.stripeCustomerId }
      : { customer_email: input.email }),
    client_reference_id: input.userId,
    subscription_data: { metadata: { userId: input.userId } },
    allow_promotion_codes: true,
    success_url: absoluteUrl("/api/stripe/checkout-return?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: absoluteUrl("/pricing?checkout=canceled"),
  });
  if (!session.url) throw new Error("Stripe returned a checkout session without a URL");
  return session.url;
}

/** The Stripe customer portal, where members change plan, card, or cancel. */
export async function createPortalUrl(stripeCustomerId: string): Promise<string> {
  const session = await stripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: absoluteUrl("/account"),
  });
  return session.url;
}

/**
 * Applies a finished checkout straight away, so Pro is on when the member
 * lands back on the site even if the webhook is still on its way.
 */
export async function syncCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<"synced" | "not_yours" | "pending"> {
  const raw = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  const session = stripeCheckoutSessionSchema.parse(raw);
  if (session.client_reference_id !== userId) return "not_yours";
  if (!session.customer) return "pending";
  await linkCustomer(db(), {
    userId,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription.id,
  });
  if (!session.subscription.full) return "pending";
  const record = toSubscriptionRecord(session.subscription.full);
  await upsertSubscription(db(), { ...record, userId }, new Date());
  return "synced";
}
