import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { collectionsForPlace, countCollections } from "@/lib/data/collections";
import { getPlaceCards } from "@/lib/data/places";
import { getMembership } from "@/lib/data/subscriptions";
import { FREE_COLLECTION_LIMIT } from "@/lib/domain/subscription";
import { saveToCollectionsAction } from "../actions";
import { CreateCollectionForm } from "../create-collection-form";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Save a place", robots: { index: false } };

/** The save dialog as a page, for links opened without JavaScript or in a new tab. */
export default async function SavePlacePage(props: PageProps<"/collections/save">) {
  const { place: placeParam } = await props.searchParams;
  const placeId = typeof placeParam === "string" ? placeParam : "";
  const user = await requireUser(`/collections/save?place=${encodeURIComponent(placeId)}`);
  const [place] = await getPlaceCards([placeId]);
  if (!place) notFound();
  const [choices, membership, total] = await Promise.all([
    collectionsForPlace(user.id, place.id),
    getMembership(user.id),
    countCollections(user.id),
  ]);
  const canCreate = membership.pro || total < FREE_COLLECTION_LIMIT;
  const back = `/places/${place.id}`;

  return (
    <div className="page-frame reading page-top">
      <BackLink href={back as Route}>Back to {place.name}</BackLink>
      <h1 className="page-title">Save {place.name}</h1>

      {choices.length > 0 && (
        <Card as="form" action={saveToCollectionsAction} className="mt-6 grid gap-4 p-5">
          <input type="hidden" name="placeId" value={place.id} />
          <input type="hidden" name="returnTo" value={back} />
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-meta font-semibold">Keep it in</legend>
            {choices.map((c) => (
              <label
                key={c.id}
                className="flex min-h-11 items-center gap-3 rounded-card border border-divider bg-surface-solid/70 px-3.5"
              >
                <input
                  type="checkbox"
                  name="collection"
                  value={c.id}
                  defaultChecked={c.hasPlace}
                  className="size-4 accent-[var(--color-primary)]"
                />
                <span className="flex-1 font-semibold">{c.title}</span>
                <span className="text-meta text-text-muted">
                  {c.itemCount} {c.itemCount === 1 ? "place" : "places"}
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" className="justify-self-start">
            Save changes
          </Button>
        </Card>
      )}

      <section aria-labelledby="new" className="mt-8">
        <h2 id="new" className="text-card font-semibold">
          {choices.length > 0 ? "Or start a new collection" : "Start your first collection"}
        </h2>
        <div className="mt-3">
          {canCreate ? (
            <CreateCollectionForm placeId={place.id} returnTo={back} />
          ) : (
            <p className="text-body text-text-muted">
              Free accounts keep up to {FREE_COLLECTION_LIMIT} collections.{" "}
              <Link href="/pricing" className="font-semibold text-primary-text quiet-link">
                See what Pro adds
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
