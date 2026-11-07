import { Inbox } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { listSubmissions, type ReviewStatus } from "@/lib/data/review";
import { cn } from "@/lib/cn";
import { CORRECTION_LABELS } from "@/lib/domain/submission";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Suggestions" };

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: "pending", label: "Waiting" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Not added" },
];

const DONE: Record<string, string> = {
  published: "Published. The contributor has been emailed if they left an address.",
  corrected: "Correction saved.",
  rejected: "Marked as not added.",
};

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  timeZone: "America/Toronto",
});

export default async function SubmissionsPage(props: PageProps<"/admin/submissions">) {
  await requireRole("curator", "/admin/submissions");
  const query = await props.searchParams;
  const status = TABS.find((t) => t.status === query.status)?.status ?? "pending";
  const rows = await listSubmissions(status);
  const done = typeof query.done === "string" ? DONE[query.done] : undefined;

  return (
    <>
      <h1 className="page-title">Suggestions and corrections</h1>
      {done && <Notice className="mt-3">{done}</Notice>}
      <nav aria-label="Filter by status" className="mt-4 flex gap-4 border-b border-divider">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={
              (t.status === "pending"
                ? "/admin/submissions"
                : `/admin/submissions?status=${t.status}`) as Route
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
          {rows.map((r) => {
            const title =
              r.type === "new_place"
                ? String(r.payload.name ?? "Unnamed place")
                : `${r.placeName ?? "A listing"}: ${CORRECTION_LABELS[r.payload.field as keyof typeof CORRECTION_LABELS] ?? "correction"}`;
            return (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/submissions/${r.id}` as Route}
                    className="font-semibold quiet-link"
                  >
                    {title}
                  </Link>
                  <p className="text-meta text-text-muted">
                    {r.type === "new_place" ? "New place" : "Correction"}
                    {r.type === "new_place" && r.payload.city ? `, ${String(r.payload.city)}` : ""}
                  </p>
                </div>
                <time dateTime={r.createdAt.toISOString()} className="text-meta text-text-muted">
                  {dateFormat.format(r.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Inbox}
          title={status === "pending" ? "Nothing waiting" : "Nothing here yet"}
          className="mt-6 max-w-none"
          action={
            <ButtonLink href="/submit" variant="secondary" size="sm">
              See the suggestion form
            </ButtonLink>
          }
        >
          New suggestions and corrections from the community land here.
        </EmptyState>
      )}
    </>
  );
}
