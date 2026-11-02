import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | undefined;

/** Payments are optional in development. Pages show a clear state when this is false. */
export function stripeConfigured(): boolean {
  return Boolean(env().STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured: STRIPE_SECRET_KEY is missing");
  client ??= new Stripe(key, { appInfo: { name: "CityRoots" }, maxNetworkRetries: 2 });
  return client;
}
