import { BadgeCheck, Store } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { requireRole } from "@/lib/auth/session";
import { listClaims, type ClaimField, type ClaimRow, type ClaimStatus } from "@/lib/data/claims";
import type { PlaceAccessibility } from "@/lib/db/schema";
import { cn } from "@/lib/cn";
import { features } from "@/lib/env";
import { RELATIONSHIP_LABELS } from "@/lib/domain/claim";
import { COST_LABELS } from "@/lib/domain/cost";
import { approveClaimAction, rejectClaimAction } from "../actions";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Claims" };

const TABS: { status: ClaimStatus; label: string }[] = [
  { status: "pending", label: "Waiting" },
  { status: "verified", label: "Verified" },
  { status: "rejected", label: "Not verified" },
];

const DONE: Record<string, string> = {
  verified: "Claim verified. The claimant has been emailed.",
  rejected: "Claim marked as not verified.",
};

export default async function ClaimsPage(props: PageProps<"/admin/claims">) {
  if (!features.business()) notFound();
  await requireRole("curator", "/admin/claims");
  const query = await props.searchParams;
  const status = TABS.find((t) => t.status === query.status)?.status ?? "pending";
  const rows = await listClaims(status);
  const done = typeof query.done === "string" ? DONE[query.done] : undefined;

  return (
    <>
      <h1 className="page-title">Listing claims</h1>
      <p className="mt-2 text-body text-text-muted">
        Confirm the person runs the place before verifying: a matching email domain, or a call to
        the number on the listing. Verifying never changes ranking or Picks.
      </p>
      {done && <Notice className="mt-3">{done}</Notice>}
      <nav aria-label="Filter by status" className="mt-4 flex gap-4 border-b border-divider">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={
              (t.status === "pending"
                ? "/admin/claims"
                : `/admin/claims?status=${t.status}`) as Route
            }
            aria-current={t.status === status ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2 text-meta font-semibold",
              t.status === status ? "border-ink" : "border-transparent text-text-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {rows.length > 0 ? (
        <ul className="divide-y divide-divider">
          {rows.map((c) => (
            <li key={c.id} className="py-6">
              <Claim claim={c} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Store}
          title={status === "pending" ? "No claims waiting" : "Nothing here yet"}
          className="mt-6 max-w-none"
          action={
            <ButtonLink href="/business" variant="secondary" size="sm">
              See the claim page
            </ButtonLink>
          }
        >
          Claims from people who run listed places land here.
        </EmptyState>
      )}
    </>
  );
}

function yesNo(v: boolean | undefined) {
  return v === undefined ? undefined : v ? "yes" : "no";
}

function accessibilityText(a: PlaceAccessibility): string {
  return [
    ["step-free entrance", yesNo(a.stepFree)],
    ["accessible washroom", yesNo(a.accessibleWashroom)],
    ["parking", yesNo(a.parking)],
    ["transit nearby", yesNo(a.transitNearby)],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .concat(a.notes ? [a.notes] : [])
    .join("; ");
}

function Claim({ claim }: { claim: ClaimRow }) {
  const p = claim.proposal;
  const fields: { field: ClaimField; label: string; value: string }[] = [];
  if (p.hoursText) fields.push({ field: "hoursText", label: "Hours", value: p.hoursText });
  if (p.costBand) fields.push({ field: "costBand", label: "Cost", value: COST_LABELS[p.costBand] });
  if (p.priceNote) fields.push({ field: "priceNote", label: "Prices", value: p.priceNote });
  if (p.sourceUrl) fields.push({ field: "sourceUrl", label: "Website", value: p.sourceUrl });
  if (p.accessibility) {
    fields.push({
      field: "accessibility",
      label: "Accessibility",
      value: accessibilityText(p.accessibility),
    });
  }
  const relationship =
    RELATIONSHIP_LABELS[claim.relationship as keyof typeof RELATIONSHIP_LABELS] ??
    claim.relationship;
  const pending = claim.status === "pending";

  return (
    <article aria-labelledby={`claim-${claim.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`claim-${claim.id}`} className="text-card font-semibold">
          <Link href={`/places/${claim.placeId}` as Route} className="quiet-link">
            {claim.placeName}
          </Link>
          <span className="font-normal text-text-muted">, {claim.cityName}</span>
        </h2>
        {claim.domainMatch && (
          <span className="inline-flex items-center gap-1 text-meta font-semibold text-free">
            <Icon icon={BadgeCheck} size={16} />
            Email matches the website
          </span>
        )}
      </div>
      <p className="mt-1 text-meta text-text-muted">
        {relationship}, signed in as {claim.claimantEmail}
      </p>
      {p.message && <p className="mt-3 text-body whitespace-pre-line">{p.message}</p>}

      {pending ? (
        <>
          <form action={approveClaimAction} className="mt-4 grid gap-3">
            <input type="hidden" name="claimId" value={claim.id} />
            {fields.length > 0 ? (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-meta font-semibold">Apply these details</legend>
                {fields.map((f) => (
                  <label key={f.field} className="flex items-start gap-3 text-body">
                    <input
                      type="checkbox"
                      name="apply"
                      value={f.field}
                      defaultChecked
                      className="mt-1 size-4 accent-[var(--color-primary)]"
                    />
                    <span>
                      <span className="font-semibold">{f.label}:</span> {f.value}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="text-body text-text-muted">
                No changes proposed, only the claim itself.
              </p>
            )}
            <TextField name="notes" label="Note for the record" maxLength={1000} />
            <Button type="submit" size="sm" className="justify-self-start">
              Verify {claim.placeName}
            </Button>
          </form>
          <form action={rejectClaimAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="claimId" value={claim.id} />
            <TextField
              name="notes"
              label="Why not, for the claimant"
              maxLength={1000}
              className="min-w-64 flex-1"
            />
            <Button type="submit" variant="secondary" size="sm">
              Do not verify
            </Button>
          </form>
        </>
      ) : (
        <p className="mt-3 text-body text-text-muted">
          {claim.status === "verified" ? "Verified" : "Not verified"}
          {claim.reviewNotes ? `. Note: ${claim.reviewNotes}` : "."}
        </p>
      )}
    </article>
  );
}
