import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/lib/stripe/webhooks";

/** Stripe calls this for subscription changes. The signature is checked before anything else. */
export async function POST(request: Request) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const payload = await request.text();

  let event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.warn("Rejected a Stripe webhook with a bad signature", { error });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    logger.info("Stripe webhook", { id: event.id, type: event.type, outcome });
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    logger.error("Stripe webhook failed", { error, id: event.id, type: event.type });
    return NextResponse.json({ error: "Could not apply event" }, { status: 500 });
  }
}
