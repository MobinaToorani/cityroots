import { Bookmark, Route as RouteIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { openPortalAction } from "@/app/(site)/pricing/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/auth/session";
import { getMembership, type Membership } from "@/lib/data/subscriptions";
import { periodForLookupKey } from "@/lib/domain/subscription";
import { stripeConfigured } from "@/lib/stripe/client";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const ROLE_LABELS = { user: "Member", curator: "Curator", admin: "Admin" } as const;

const NOTICES: Record<string, string> = {
  pro: "You have Pro. The Day Planner is ready when you are.",
  pending:
    "Your payment went through. Pro switches on as soon as Stripe confirms it, usually within a minute. Refresh this page to check.",
};

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Toronto",
  }).format(date);
}

function planLine(m: Membership): string {
  if (!m.pro) return "Free";
  const period = periodForLookupKey(m.priceLookupKey);
  const name = period === "yearly" ? "Pro, yearly" : period === "monthly" ? "Pro, monthly" : "Pro";
  if (!m.currentPeriodEnd) return name;
  if (m.cancelAtPeriodEnd) return `${name}, ends ${formatDay(m.currentPeriodEnd)}`;
  if (m.status === "past_due") return `${name}, payment due`;
  return `${name}, renews ${formatDay(m.currentPeriodEnd)}`;
}

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await requireUser("/account");
  const [membership, query] = await Promise.all([getMembership(user.id), props.searchParams]);
  const welcome = typeof query.welcome === "string" ? NOTICES[query.welcome] : undefined;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-4 sm:px-8 lg:pt-8">
      <h1 className="text-section font-semibold tracking-tight">Your account</h1>
      {welcome && (
        <p role="status" className="mt-4 rounded-2xl px-4 py-3 text-body glass-strong">
          {welcome}
        </p>
      )}
      {query.billing === "error" && (
        <p role="alert" className="mt-4 rounded-2xl px-4 py-3 text-body glass-strong">
          The billing page did not open. Try again in a minute.
        </p>
      )}
      <GlassCard strength="strong" className="mt-6 grid gap-5 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-meta text-text-muted">Email</dt>
            <dd className="font-semibold break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-meta text-text-muted">Role</dt>
            <dd className="font-semibold">{ROLE_LABELS[user.role]}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-meta text-text-muted">Plan</dt>
            <dd className="font-semibold">{planLine(membership)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {membership.pro ? (
            membership.stripeCustomerId &&
            stripeConfigured() && (
              <form action={openPortalAction}>
                <Button type="submit" size="sm">
                  Manage subscription
                </Button>
              </form>
            )
          ) : (
            <ButtonLink href="/pricing" size="sm">
              See what Pro adds
            </ButtonLink>
          )}
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </GlassCard>

      <nav aria-label="Your things" className="mt-6 grid gap-3 sm:grid-cols-2">
        <AccountLink href="/collections" icon={Bookmark} title="Collections">
          Places you saved
        </AccountLink>
        <AccountLink href="/planner" icon={RouteIcon} title="Day plans">
          {membership.pro ? "Plan a day, or open one you saved" : "See how the Day Planner works"}
        </AccountLink>
      </nav>
    </div>
  );
}

function AccountLink({
  href,
  icon,
  title,
  children,
}: {
  href: "/collections" | "/planner";
  icon: typeof Bookmark;
  title: string;
  children: string;
}) {
  return (
    <GlassCard interactive className="relative flex items-center gap-3 p-4">
      <Icon icon={icon} className="shrink-0 text-primary-text" />
      <div>
        <Link
          href={href}
          className="font-semibold after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
        >
          {title}
        </Link>
        <p className="text-meta text-text-muted">{children}</p>
      </div>
    </GlassCard>
  );
}
