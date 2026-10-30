import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const ROLE_LABELS = { user: "Member", curator: "Curator", admin: "Admin" } as const;

export default async function AccountPage() {
  const user = await requireUser("/account");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-4 sm:px-8 lg:pt-8">
      <h1 className="text-section font-semibold tracking-tight">Your account</h1>
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
          <div>
            <dt className="text-meta text-text-muted">Plan</dt>
            <dd className="font-semibold">Free</dd>
          </div>
        </dl>
        <p className="text-body text-text-muted">
          Everything on CityRoots is free to browse. Saved collections and the Day Planner will
          appear here when they launch.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/explore" size="sm">
            Explore places
          </ButtonLink>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
