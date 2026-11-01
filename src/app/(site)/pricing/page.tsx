import { Check } from "lucide-react";
import { GOALS, goal } from "@/lib/analytics";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { currentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/data/subscriptions";
import { FREE_COLLECTION_LIMIT, PRO_PLANS, yearlySavingPercent } from "@/lib/domain/subscription";
import { stripeConfigured } from "@/lib/stripe/client";
import { openPortalAction, startCheckoutAction } from "./actions";

export const metadata: Metadata = {
  title: "CityRoots Pro",
  description:
    "Browsing CityRoots is free. Pro adds the Day Planner, unlimited collections, and shareable plans for $4.99 a month.",
  alternates: { canonical: "/pricing" },
};

const NOTICES: Record<string, string> = {
  canceled: "Checkout was canceled. Nothing was charged.",
  error: "We could not reach the payment page. Try again in a minute.",
  unavailable: "Payments are not switched on for this site yet, so Pro cannot be bought here.",
};

function price(amount: number): string {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export default async function PricingPage(props: PageProps<"/pricing">) {
  const query = await props.searchParams;
  const period = query.period === "yearly" ? "yearly" : "monthly";
  const notice = typeof query.checkout === "string" ? NOTICES[query.checkout] : undefined;
  const user = await currentUser();
  const membership = user ? await getMembership(user.id) : null;
  const plan = PRO_PLANS[period];
  const payments = stripeConfigured();

  return (
    <div className="pt-32 pb-8 color-field">
      <Container className="max-w-4xl">
        <p className="text-meta font-semibold text-primary-text">CityRoots Pro</p>
        <h1 className="mt-2 font-display text-display font-medium tracking-tight">
          Free to browse. Pro when you want a plan.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-text-muted">
          Every listing, the map, search, and the events calendar stay free for everyone. Pro is for
          people who want CityRoots to line up their day for them.
        </p>

        {notice && (
          <p role="status" className="mt-6 rounded-2xl px-4 py-3 text-body glass-strong">
            {notice}
          </p>
        )}

        <SegmentedLinks
          label="Billing period"
          className="mt-8"
          items={[
            { href: "/pricing", label: "Monthly", active: period === "monthly" },
            {
              href: "/pricing?period=yearly",
              label: `Yearly, save ${yearlySavingPercent()}%`,
              active: period === "yearly",
            },
          ]}
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <GlassCard
            as="section"
            aria-labelledby="free-plan"
            className="grid content-start gap-5 p-6"
          >
            <div>
              <h2 id="free-plan" className="text-card font-semibold">
                Free
              </h2>
              <p className="mt-2">
                <span className="font-display text-[2.5rem] leading-none font-medium">$0</span>
              </p>
              <p className="mt-1 text-meta text-text-muted">Always, for everyone</p>
            </div>
            <ul className="grid gap-2.5">
              <Feature>Every listing, with what it costs</Feature>
              <Feature>The map, search, and filters</Feature>
              <Feature>The events calendar</Feature>
              <Feature>Up to {FREE_COLLECTION_LIMIT} collections of saved places</Feature>
              <Feature>Suggest places and corrections</Feature>
            </ul>
            {!user && (
              <ButtonLink href="/explore" variant="secondary" className="justify-self-start">
                Start exploring
              </ButtonLink>
            )}
          </GlassCard>

          <GlassCard
            as="section"
            strength="strong"
            aria-labelledby="pro-plan"
            className="grid content-start gap-5 p-6 ring-2 ring-primary-text/30"
          >
            <div>
              <h2 id="pro-plan" className="text-card font-semibold">
                Pro
              </h2>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-[2.5rem] leading-none font-medium">
                  {price(plan.amount)}
                </span>
                <span className="text-body text-text-muted">CAD a {plan.interval}</span>
              </p>
              <p className="mt-1 text-meta text-text-muted">
                {period === "yearly"
                  ? `Works out to ${price(Math.round((plan.amount / 12) * 100) / 100)} a month`
                  : "Cancel any time from your account"}
              </p>
            </div>
            <ul className="grid gap-2.5">
              <Feature>The Day Planner: a full day out, built around your budget</Feature>
              <Feature>Share any plan with a link</Feature>
              <Feature>Unlimited collections</Feature>
              <Feature>Everything in Free</Feature>
            </ul>
            <ProAction
              signedIn={Boolean(user)}
              pro={membership?.pro ?? false}
              canManage={Boolean(membership?.stripeCustomerId)}
              payments={payments}
              period={period}
            />
          </GlassCard>
        </div>

        <p className="mt-4 text-meta text-text-muted">
          Coming to Pro next: event reminders, a weekly note about new places near you, and early
          access to new cities. Prices are in Canadian dollars.
        </p>

        <section aria-labelledby="faq" className="mt-16 max-w-2xl">
          <h2 id="faq" className="font-display text-section font-medium tracking-tight">
            Questions
          </h2>
          <dl className="mt-6 grid gap-6">
            <Question q="Does paying change what I see first?">
              No. Free listings always come first, and the order uses only community signals like
              tips and saves. Pro, partners, and businesses cannot buy a better spot. The{" "}
              <Link href="/about#ranking" className="quiet-link">
                ranking rules
              </Link>{" "}
              are public.
            </Question>
            <Question q="How do I cancel?">
              From your account, choose Manage subscription. You keep Pro until the end of the
              period you paid for, and you are not charged again.
            </Question>
            <Question q="What happens to my plans and collections if I stop Pro?">
              Nothing is deleted. Shared plans keep working, and you can still open every
              collection. You just cannot start new plans, or more than {FREE_COLLECTION_LIMIT}{" "}
              collections, until you come back.
            </Question>
            <Question q="Who handles the payment?">
              Stripe. CityRoots never sees or stores your card number.
            </Question>
          </dl>
        </section>
      </Container>
    </div>
  );
}

function ProAction({
  signedIn,
  pro,
  canManage,
  payments,
  period,
}: {
  signedIn: boolean;
  pro: boolean;
  canManage: boolean;
  payments: boolean;
  period: "monthly" | "yearly";
}) {
  if (pro) {
    return (
      <div className="grid gap-2">
        <p className="text-body font-semibold">You have Pro. Thanks for supporting CityRoots.</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/planner">Plan a day</ButtonLink>
          {canManage && payments && (
            <form action={openPortalAction}>
              <Button type="submit" variant="secondary">
                Manage subscription
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }
  if (!signedIn) {
    return (
      <div className="grid gap-2">
        <ButtonLink
          href={`/signin?callbackUrl=${encodeURIComponent(`/pricing?period=${period}`)}`}
          className="justify-self-start"
        >
          Sign in to start Pro
        </ButtonLink>
        <p className="text-meta text-text-muted">You will come back here to pay.</p>
      </div>
    );
  }
  if (!payments) {
    return (
      <p className="text-body text-text-muted">
        Payments are not switched on for this site yet, so Pro cannot be bought here.
      </p>
    );
  }
  return (
    <form action={startCheckoutAction} className="grid gap-2">
      <input type="hidden" name="period" value={period} />
      <Button type="submit" className={`justify-self-start ${goal(GOALS.checkoutStarted)}`}>
        Start Pro, {price(PRO_PLANS[period].amount)} a {PRO_PLANS[period].interval}
      </Button>
      <p className="text-meta text-text-muted">Secure checkout by Stripe.</p>
    </form>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-body">
      <Icon icon={Check} size={20} className="shrink-0 text-free" />
      <span>{children}</span>
    </li>
  );
}

function Question({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-card font-semibold">{q}</dt>
      <dd className="mt-1 text-body text-text-muted">{children}</dd>
    </div>
  );
}
