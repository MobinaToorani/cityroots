import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireRole } from "@/lib/auth/session";
import { pendingClaimCount } from "@/lib/data/claims";
import { pendingCounts } from "@/lib/data/review";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminPage() {
  const user = await requireRole("curator", "/admin");
  const [counts, claims] = await Promise.all([
    pendingCounts(),
    features.business() ? pendingClaimCount() : Promise.resolve(0),
  ]);
  return (
    <>
      <h1 className="page-title">Waiting for review</h1>
      <dl className="mt-6 divide-y divide-divider border-y border-divider">
        <Row
          label="Suggestions and corrections"
          count={counts.submissions}
          href="/admin/submissions"
        />
        {features.business() && <Row label="Listing claims" count={claims} href="/admin/claims" />}
      </dl>
      {features.partners() && hasRole(user, "admin") && (
        <p className="mt-6 text-body text-text-muted">
          Partner keys are issued on the{" "}
          <Link href="/admin/partners" className="font-semibold text-primary-text quiet-link">
            partner keys page
          </Link>
          .
        </p>
      )}
    </>
  );
}

function Row({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: "/admin/submissions" | "/admin/claims";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="text-body">{label}</dt>
      <dd>
        <Link href={href} className="font-semibold text-primary-text quiet-link">
          {count === 0 ? "None waiting, see history" : `Review ${count}`}
        </Link>
      </dd>
    </div>
  );
}
