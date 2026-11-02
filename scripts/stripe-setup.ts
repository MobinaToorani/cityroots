/**
 * Creates the CityRoots Pro product, its two prices, and a customer portal
 * configuration in Stripe. Safe to run again: existing prices are kept.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 */
import Stripe from "stripe";
import { PRO_PLANS } from "../src/lib/domain/subscription";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_")) {
  console.error(
    "Set STRIPE_SECRET_KEY to a test mode key (sk_test_...). Live setup is done by hand.",
  );
  process.exit(1);
}
const stripe = new Stripe(key);

async function main() {
  const lookupKeys = Object.values(PRO_PLANS).map((p) => p.lookupKey);
  const existing = await stripe.prices.list({ lookup_keys: lookupKeys, active: true });
  const found = new Set(existing.data.map((p) => p.lookup_key));

  let productId = existing.data[0]
    ? typeof existing.data[0].product === "string"
      ? existing.data[0].product
      : existing.data[0].product.id
    : null;
  if (!productId) {
    const product = await stripe.products.create({
      name: "CityRoots Pro",
      description: "The Day Planner, unlimited collections, and shareable plans.",
    });
    productId = product.id;
    console.log(`Created product ${product.id}`);
  }

  const prices: string[] = [];
  for (const plan of Object.values(PRO_PLANS)) {
    if (found.has(plan.lookupKey)) {
      console.log(`Price ${plan.lookupKey} already exists`);
      const id = existing.data.find((p) => p.lookup_key === plan.lookupKey)?.id;
      if (id) prices.push(id);
      continue;
    }
    const price = await stripe.prices.create({
      product: productId,
      currency: "cad",
      unit_amount: Math.round(plan.amount * 100),
      recurring: { interval: plan.interval },
      lookup_key: plan.lookupKey,
    });
    prices.push(price.id);
    console.log(`Created price ${plan.lookupKey} (${price.id})`);
  }

  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (configs.data.length === 0) {
    await stripe.billingPortal.configurations.create({
      business_profile: { headline: "Manage your CityRoots Pro plan" },
      features: {
        customer_update: { enabled: true, allowed_updates: ["email", "address"] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price"],
          products: [{ product: productId, prices }],
        },
      },
    });
    console.log("Created customer portal configuration");
  }

  console.log(
    "\nNext: forward webhooks while developing with\n  stripe listen --forward-to localhost:3000/api/stripe/webhook\nand set STRIPE_WEBHOOK_SECRET to the whsec_ value it prints.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
