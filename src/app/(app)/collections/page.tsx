import { Bookmark, Globe, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { requireUser } from "@/lib/auth/session";
import { listCollections } from "@/lib/data/collections";
import { getMembership } from "@/lib/data/subscriptions";
import { FREE_COLLECTION_LIMIT } from "@/lib/domain/subscription";
import { CreateCollectionForm } from "./create-collection-form";

export const metadata: Metadata = { title: "Your collections", robots: { index: false } };

export default async function CollectionsPage(props: PageProps<"/collections">) {
  const user = await requireUser("/collections");
  const [list, membership, query] = await Promise.all([
    listCollections(user.id),
    getMembership(user.id),
    props.searchParams,
  ]);
  const atLimit = !membership.pro && list.length >= FREE_COLLECTION_LIMIT;

  return (
    <div className="page-frame reading pt-8">
      <h1 className="page-title">Your collections</h1>
      <p className="mt-2 text-body text-text-muted">
        Keep places together for a weekend, a visit, or a rainy day. Collections are private until
        you share one.
      </p>
      {query.deleted && (
        <p role="status" className="mt-4 text-body font-semibold">
          Collection deleted.
        </p>
      )}

      {list.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2">
          {list.map((c) => (
            <li key={c.id}>
              <Card as="article" interactive className="relative grid gap-1 p-5">
                <h2 className="text-card font-semibold">
                  <Link
                    href={`/collections/${c.id}`}
                    className="after:absolute after:inset-0 after:rounded-card"
                  >
                    {c.title}
                  </Link>
                </h2>
                <p className="flex items-center gap-3 text-meta text-text-muted">
                  <span>
                    {c.itemCount} {c.itemCount === 1 ? "place" : "places"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={c.isPublic ? Globe : Lock} size={16} />
                    {c.isPublic ? "Shared" : "Private"}
                  </span>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No collections yet"
          className="mt-6 max-w-none"
          action={
            <ButtonLink href="/explore" variant="secondary" size="sm">
              Explore places to save
            </ButtonLink>
          }
        >
          Name one below, or press the bookmark on any place to save it as you browse.
        </EmptyState>
      )}

      <section aria-labelledby="new-collection" className="mt-10">
        <h2 id="new-collection" className="text-card font-semibold">
          Start a collection
        </h2>
        {atLimit ? (
          <Card className="mt-3 grid gap-3 p-5">
            <p className="text-body">
              You are using all {FREE_COLLECTION_LIMIT} free collections. Add places to the ones you
              have, delete one you are done with, or go Pro to keep as many as you like.
            </p>
            <ButtonLink href="/pricing" size="sm" className="justify-self-start">
              See what Pro adds
            </ButtonLink>
          </Card>
        ) : (
          <div className="mt-3">
            <CreateCollectionForm />
            {!membership.pro && (
              <p className="mt-2 text-meta text-text-muted">
                {list.length} of {FREE_COLLECTION_LIMIT} free collections used.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
