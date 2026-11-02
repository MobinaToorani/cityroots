import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { syncCheckoutSession } from "@/lib/stripe/billing";
import { stripeConfigured } from "@/lib/stripe/client";

/** Stripe Checkout sends members here after paying. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=%2Faccount");
  if (!sessionId?.startsWith("cs_") || !stripeConfigured()) redirect("/account");

  let outcome: Awaited<ReturnType<typeof syncCheckoutSession>> = "pending";
  try {
    outcome = await syncCheckoutSession(sessionId, user.id);
  } catch (error) {
    // The webhook will still apply it; the account page says so.
    logger.error("Could not sync checkout session", { error, sessionId });
  }
  redirect(outcome === "synced" ? "/account?welcome=pro" : "/account?welcome=pending");
}
