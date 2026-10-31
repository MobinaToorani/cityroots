import "server-only";
import type Stripe from "stripe";
import {
  applyStripeEventOnce,
  linkCustomer,
  upsertSubscription,
  userForCustomer,
} from "@/lib/data/subscriptions";
import {
  stripeCheckoutSessionSchema,
  stripeSubscriptionSchema,
  toSubscriptionRecord,
} from "@/lib/domain/subscription";
import { logger } from "@/lib/logger";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export type WebhookOutcome = "applied" | "duplicate" | "ignored";

/** Applies one verified Stripe event. Throws on failure so Stripe retries. */
export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  const eventAt = new Date(event.created * 1000);

  if (event.type === "checkout.session.completed") {
    const session = stripeCheckoutSessionSchema.parse(event.data.object);
    if (session.mode !== "subscription" || !session.client_reference_id || !session.customer) {
      return "ignored";
    }
    const userId = session.client_reference_id;
    const customer = session.customer;
    return applyStripeEventOnce(event, async (tx) => {
      await linkCustomer(tx, {
        userId,
        stripeCustomerId: customer,
        stripeSubscriptionId: session.subscription.id,
      });
      if (session.subscription.full) {
        const record = toSubscriptionRecord(session.subscription.full);
        await upsertSubscription(tx, { ...record, userId }, eventAt);
      }
    });
  }

  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    const record = toSubscriptionRecord(stripeSubscriptionSchema.parse(event.data.object));
    return applyStripeEventOnce(event, async (tx) => {
      const userId = record.userId ?? (await userForCustomer(tx, record.stripeCustomerId));
      if (!userId) {
        logger.warn("Stripe subscription with no matching member", {
          eventId: event.id,
          customer: record.stripeCustomerId,
        });
        return;
      }
      await upsertSubscription(tx, { ...record, userId }, eventAt);
    });
  }

  return "ignored";
}
