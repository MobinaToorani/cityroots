"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/data/subscriptions";
import { isProPeriod } from "@/lib/domain/subscription";
import { logger } from "@/lib/logger";
import { createCheckoutUrl, createPortalUrl } from "@/lib/stripe/billing";
import { stripeConfigured } from "@/lib/stripe/client";

/** Sends the member to Stripe Checkout for the chosen period. */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const period = formData.get("period");
  const user = await requireUser(`/pricing?period=${isProPeriod(period) ? period : "monthly"}`);
  if (!isProPeriod(period)) redirect("/pricing");
  if (!stripeConfigured()) redirect("/pricing?checkout=unavailable");
  const membership = await getMembership(user.id);
  if (membership.pro) redirect("/account");

  let url: string;
  try {
    url = await createCheckoutUrl({
      userId: user.id,
      email: user.email,
      period,
      stripeCustomerId: membership.stripeCustomerId,
    });
  } catch (error) {
    logger.error("Could not start checkout", { error, period });
    redirect(`/pricing?period=${period}&checkout=error`);
  }
  redirect(url as Route);
}

/** Opens the Stripe customer portal to change the card or plan, or cancel. */
export async function openPortalAction(): Promise<void> {
  const user = await requireUser("/account");
  const membership = await getMembership(user.id);
  if (!membership.stripeCustomerId || !stripeConfigured()) redirect("/pricing");

  let url: string;
  try {
    url = await createPortalUrl(membership.stripeCustomerId);
  } catch (error) {
    logger.error("Could not open the billing portal", { error });
    redirect("/account?billing=error");
  }
  redirect(url as Route);
}
