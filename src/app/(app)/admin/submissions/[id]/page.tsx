import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import { requireRole } from "@/lib/auth/session";
import { listLiveCities } from "@/lib/data/cities";
import { getPlaceForEdit, getSubmission, type SubmissionRow } from "@/lib/data/review";
import { CORRECTION_LABELS } from "@/lib/domain/submission";
import {
  applyCorrectionAction,
  publishSubmissionAction,
  rejectSubmissionAction,
} from "../../actions";
import { PlaceEditForm, type PlaceDefaults } from "../../place-edit-form";

export const metadata: Metadata = { title: "Review a suggestion" };

function str(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function SubmissionPage(props: PageProps<"/admin/submissions/[id]">) {
  const { id } = await props.params;
  await requireRole("curator", `/admin/submissions/${id}`);
  const [submission, cities] = await Promise.all([getSubmission(id), listLiveCities()]);
  if (!submission) notFound();
  const place = submission.placeId ? await getPlaceForEdit(submission.placeId) : null;
  const p = submission.payload;
  const pending = submission.status === "pending";

  return (
    <>
      <Link
        href="/admin/submissions"
        className="text-meta font-semibold text-primary-text quiet-link"
      >
        Back to the queue
      </Link>
      <h1 className="mt-3 page-title">
        {submission.type === "new_place"
          ? `Suggested: ${str(p.name) ?? "Unnamed place"}`
          : `Correction to ${submission.placeName ?? "a listing"}`}
      </h1>

      <section aria-labelledby="sent" className="mt-6 rounded-card px-5 py-4 card">
        <h2 id="sent" className="text-card font-semibold">
          What they sent
        </h2>
        <Sent submission={submission} />
      </section>

      {!pending ? (
        <p className="mt-6 text-body">
          Reviewed: {submission.status === "approved" ? "approved" : "not added"}.
          {submission.reviewNotes ? ` Note: ${submission.reviewNotes}` : ""}
          {submission.placeId && (
            <>
              {" "}
              <Link
                href={`/places/${submission.placeId}` as Route}
                className="font-semibold text-primary-text quiet-link"
              >
                See the listing
              </Link>
            </>
          )}
        </p>
      ) : (
        <>
          <section aria-labelledby="edit" className="mt-10">
            <h2 id="edit" className="mb-4 text-card font-semibold">
              {submission.type === "new_place" ? "Check and publish" : "Edit the listing"}
            </h2>
            {submission.type === "new_place" ? (
              <PlaceEditForm
                action={publishSubmissionAction}
                submissionId={submission.id}
                mode="publish"
                cities={cities}
                defaults={newPlaceDefaults(p)}
              />
            ) : place ? (
              <>
                <p className="mb-4 text-meta text-text-muted">
                  The form shows the listing as it is now. Change what the correction asks for.
                </p>
                <PlaceEditForm
                  action={applyCorrectionAction}
                  submissionId={submission.id}
                  mode="correct"
                  cities={cities}
                  defaults={{
                    name: place.name,
                    citySlug: place.citySlug,
                    category: place.category,
                    kind: place.kind,
                    costBand: place.costBand,
                    priceNote: place.priceNote ?? undefined,
                    summary: place.summary,
                    description: place.description,
                    neighborhood: place.neighborhood ?? undefined,
                    address: place.address ?? undefined,
                    hoursText: place.hoursText ?? undefined,
                    sourceUrl: place.sourceUrl ?? undefined,
                    phone: place.phone ?? undefined,
                    lat: place.lat?.toString(),
                    lng: place.lng?.toString(),
                  }}
                />
              </>
            ) : (
              <p className="text-body">
                The listing this corrects no longer exists. Reject it below.
              </p>
            )}
          </section>

          <section aria-labelledby="reject" className="mt-12 border-t border-divider pt-6">
            <h2 id="reject" className="text-card font-semibold">
              Do not add this
            </h2>
            <form action={rejectSubmissionAction} className="mt-4 grid gap-4">
              <input type="hidden" name="submissionId" value={submission.id} />
              <TextareaField
                name="notes"
                label="Why, for the contributor"
                description="Optional. Sent in the email if they left an address."
                rows={2}
                maxLength={1000}
              />
              <Button type="submit" variant="secondary" className="justify-self-start">
                Reject this suggestion
              </Button>
            </form>
          </section>
        </>
      )}
    </>
  );
}

function newPlaceDefaults(p: Record<string, unknown>): PlaceDefaults {
  const area = str(p.area);
  return {
    name: str(p.name),
    citySlug: str(p.city),
    category: str(p.category),
    kind: str(p.kind),
    costBand: str(p.costBand),
    priceNote: str(p.priceNote),
    description: str(p.description),
    // The form asks for "address or neighborhood"; a digit usually means a street address.
    address: area && /\d/.test(area) ? area : undefined,
    neighborhood: area && !/\d/.test(area) ? area : undefined,
    hoursText: str(p.hours),
  };
}

function Sent({ submission }: { submission: SubmissionRow }) {
  const p = submission.payload;
  const rows: [string, string | undefined][] =
    submission.type === "new_place"
      ? [
          ["Name", str(p.name)],
          ["City", str(p.city)],
          ["Category", str(p.category)],
          ["Cost", str(p.costBand)],
          ["Prices", str(p.priceNote)],
          ["Where", str(p.area)],
          ["Hours", str(p.hours)],
          ["Description", str(p.description)],
          ["Photo", str(p.photoUrl)],
        ]
      : [
          ["About", CORRECTION_LABELS[p.field as keyof typeof CORRECTION_LABELS]],
          ["Details", str(p.details)],
        ];
  return (
    <dl className="mt-3 grid gap-2 text-body sm:grid-cols-[8rem_1fr]">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold">{k}</dt>
            <dd className="whitespace-pre-line text-text-muted">{v}</dd>
          </div>
        ))}
      <dt className="font-semibold">Reply to</dt>
      <dd className="text-text-muted">{submission.contactEmail ?? "No email left"}</dd>
    </dl>
  );
}
