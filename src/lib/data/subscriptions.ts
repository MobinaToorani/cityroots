import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, type Database } from "@/lib/db/client";
import { stripeEvents, subscriptions } from "@/lib/db/schema";
import {
  hasProAccess,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from "@/lib/domain/subscription";
import { DataError } from "@/lib/errors";

export type Membership = {
  pro: boolean;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  priceLookupKey: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

const NONE: Membership = {
  pro: false,
  status: null,
  stripeCustomerId: null,
  priceLookupKey: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

/** Read on every request that needs it: Pro is never decided in the browser. */
export async function getMembership(userId: string): Promise<Membership> {
  try {
    const [row] = await db().select().from(subscriptions).where(eq(subscriptions.userId, userId));
    if (!row) return NONE;
    return {
      pro: hasProAccess(row),
      status: row.status,
      stripeCustomerId: row.stripeCustomerId,
      priceLookupKey: row.priceLookupKey,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    };
  } catch (cause) {
    throw new DataError("Could not load membership", { cause });
  }
}

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Runs `apply` once per Stripe event id. The event is recorded in the same
 * transaction as its effects, so a failure rolls both back and Stripe's retry
 * runs it again, while a retry after success changes nothing.
 */
export async function applyStripeEventOnce(
  event: { id: string; type: string },
  apply: (tx: Tx) => Promise<void>,
): Promise<"applied" | "duplicate"> {
  return db().transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: stripeEvents.id });
    if (inserted.length === 0) return "duplicate";
    await apply(tx);
    return "applied";
  });
}

/**
 * Stores the latest state of a subscription. Events can arrive out of order,
 * so an update only lands if it is at least as new as the last one applied.
 */
export async function upsertSubscription(
  executor: Tx | Database,
  record: SubscriptionRecord & { userId: string },
  eventAt: Date,
): Promise<void> {
  const values = {
    userId: record.userId,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    status: record.status,
    priceLookupKey: record.priceLookupKey,
    currentPeriodEnd: record.currentPeriodEnd,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    stripeEventAt: eventAt,
  };
  const { userId, ...update } = values;
  void userId;
  await executor
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: update,
      setWhere: sql`${subscriptions.stripeEventAt} is null or ${subscriptions.stripeEventAt} <= ${eventAt}`,
    });
}

/**
 * Links a Stripe customer to a member after checkout. Leaves status alone if a
 * subscription event already set it; otherwise records the checkout as pending.
 */
export async function linkCustomer(
  executor: Tx | Database,
  link: { userId: string; stripeCustomerId: string; stripeSubscriptionId: string | null },
): Promise<void> {
  await executor
    .insert(subscriptions)
    .values({ ...link, status: "incomplete" })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: link.stripeCustomerId,
        stripeSubscriptionId: sql`coalesce(${subscriptions.stripeSubscriptionId}, ${link.stripeSubscriptionId})`,
      },
    });
}

/** Who owns a Stripe customer, for subscription events that carry no user id. */
export async function userForCustomer(
  executor: Tx | Database,
  stripeCustomerId: string,
): Promise<string | null> {
  const [row] = await executor
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
  return row?.userId ?? null;
}
