import { readFile } from "node:fs/promises";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import Stripe from "stripe";
import { E2E_OUTBOX, E2E_WEBHOOK_SECRET } from "./constants";

export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function latestLinkFor(email: string): Promise<string | null> {
  let text = "";
  try {
    text = await readFile(E2E_OUTBOX, "utf8");
  } catch {
    return null;
  }
  const lines = text.trim().split("\n").reverse();
  for (const line of lines) {
    const entry = JSON.parse(line) as { to: string; text: string };
    if (entry.to === email) return /https?:\/\/\S+/.exec(entry.text)?.[0] ?? null;
  }
  return null;
}

/** Signs in through the real magic-link flow, reading the link from the test outbox. */
export async function signIn(page: Page, email: string, callbackUrl = "/account"): Promise<void> {
  await page.goto(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page).toHaveURL(/\/signin\/check-email/);
  let link: string | null = null;
  await expect.poll(async () => (link = await latestLinkFor(email))).not.toBeNull();
  await page.goto(link as unknown as string);
  await expect(page).not.toHaveURL(/\/signin/);
}

export async function currentUserId(page: Page): Promise<string> {
  const res = await page.request.get("/api/auth/session");
  const session = (await res.json()) as { user?: { id?: string } };
  const id = session.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

const stripe = new Stripe("sk_test_e2e_not_a_real_key");

type SubscriptionEventInput = {
  userId: string;
  status: "active" | "canceled" | "past_due";
  type?: string;
  eventId?: string;
  /** Unix seconds; defaults to now. */
  created?: number;
  customer?: string;
};

/** A subscription event as Stripe would send it, signed with the test secret. */
export async function postSubscriptionEvent(
  request: APIRequestContext,
  input: SubscriptionEventInput,
) {
  const created = input.created ?? Math.floor(Date.now() / 1000);
  const event = {
    id: input.eventId ?? `evt_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    object: "event",
    type: input.type ?? "customer.subscription.updated",
    created,
    data: {
      object: {
        id: `sub_e2e_${input.userId.slice(0, 8)}`,
        object: "subscription",
        customer: input.customer ?? `cus_e2e_${input.userId.slice(0, 8)}`,
        status: input.status,
        cancel_at_period_end: false,
        metadata: { userId: input.userId },
        items: {
          object: "list",
          data: [
            {
              current_period_end: created + 30 * 86_400,
              price: { id: "price_e2e", lookup_key: "cityroots_pro_monthly" },
            },
          ],
        },
      },
    },
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: E2E_WEBHOOK_SECRET,
  });
  const res = await request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
  return { res, event };
}

/** The first link in the latest test-outbox email to an address whose subject or text matches. */
export async function emailLinkFor(email: string, matching: RegExp): Promise<string | null> {
  let text = "";
  try {
    text = await readFile(E2E_OUTBOX, "utf8");
  } catch {
    return null;
  }
  for (const line of text.trim().split("\n").reverse()) {
    const entry = JSON.parse(line) as { to: string; text: string };
    if (entry.to === email && matching.test(entry.text)) {
      return /https?:\/\/\S+/.exec(entry.text)?.[0] ?? null;
    }
  }
  return null;
}
