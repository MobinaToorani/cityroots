import { ArrowDown, ArrowLeft, ArrowUp, Bookmark, Globe, Lock, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceCard } from "@/components/features/place-card";
import { CategoryTag, CostBadge } from "@/components/ui/badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { currentUser } from "@/lib/auth/session";
import { getCollection, type CollectionDetail } from "@/lib/data/collections";
import { absoluteUrl } from "@/lib/site";
import {
  collectionItemAction,
  deleteCollectionAction,
  renameCollectionAction,
  setCollectionVisibilityAction,
} from "../actions";

export async function generateMetadata(props: PageProps<"/collections/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const user = await currentUser();
  const collection = await getCollection(id, user?.id ?? null);
  return {
    title: collection ? collection.title : "Collection not found",
    robots: { index: false },
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[id]">) {
  const { id } = await props.params;
  const user = await currentUser();
  const collection = await getCollection(id, user?.id ?? null);
  if (!collection) notFound();
  const isOwner = user?.id === collection.userId;
  return isOwner ? <OwnerView collection={collection} /> : <PublicView collection={collection} />;
}

function PublicView({ collection }: { collection: CollectionDetail }) {
  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-4 sm:px-8 lg:pt-8">
      <p className="text-meta font-semibold text-primary-text">
        A collection by {collection.ownerName ?? "a CityRoots member"}
      </p>
      <h1 className="mt-1 text-section font-semibold tracking-tight">{collection.title}</h1>
      {collection.items.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map(({ place, note }) => (
            <li key={place.id} className="grid gap-2">
              <PlaceCard place={place} showCity />
              {note && <p className="px-2 text-meta text-text-muted">{note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Nothing here yet"
          className="mt-6"
          action={
            <ButtonLink href="/explore" size="sm">
              Explore places
            </ButtonLink>
          }
        >
          This collection is empty for now.
        </EmptyState>
      )}
      <GlassCard className="mt-10 grid gap-3 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="text-body">
          CityRoots lists free and low-cost things to do across the GTA and Waterloo Region, free
          things first. Anyone can save places into collections like this one.
        </p>
        <ButtonLink href="/collections">Start your own collection</ButtonLink>
      </GlassCard>
    </div>
  );
}

function OwnerView({ collection }: { collection: CollectionDetail }) {
  const shareUrl = absoluteUrl(`/collections/${collection.id}`);
  const last = collection.items.length - 1;
  return (
    <div className="mx-auto max-w-3xl px-5 pt-4 sm:px-8 lg:pt-8">
      <Link
        href="/collections"
        className="mb-5 inline-flex items-center gap-1.5 text-meta font-semibold text-text-muted quiet-link"
      >
        <Icon icon={ArrowLeft} size={16} />
        All collections
      </Link>
      <h1 className="text-section font-semibold tracking-tight">{collection.title}</h1>
      <p className="mt-1 flex items-center gap-3 text-meta text-text-muted">
        <span>
          {collection.items.length} {collection.items.length === 1 ? "place" : "places"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon icon={collection.isPublic ? Globe : Lock} size={16} />
          {collection.isPublic ? "Anyone with the link can see it" : "Only you can see it"}
        </span>
      </p>

      {collection.items.length > 0 ? (
        <ol className="mt-6 grid gap-3">
          {collection.items.map(({ place, note }, i) => (
            <li key={place.id}>
              <GlassCard className="grid gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryTag slug={place.category} />
                      <CostBadge band={place.costBand} />
                    </div>
                    <h2 className="mt-2 text-card font-semibold">
                      <Link href={`/places/${place.id}`} className="quiet-link">
                        {place.name}
                      </Link>
                    </h2>
                    <p className="text-meta text-text-muted">
                      {[place.neighborhood, place.cityName].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <form action={collectionItemAction} className="flex gap-1">
                    <input type="hidden" name="id" value={collection.id} />
                    <input type="hidden" name="placeId" value={place.id} />
                    <IconButton
                      intent="up"
                      label={`Move ${place.name} up`}
                      icon={ArrowUp}
                      disabled={i === 0}
                    />
                    <IconButton
                      intent="down"
                      label={`Move ${place.name} down`}
                      icon={ArrowDown}
                      disabled={i === last}
                    />
                    <IconButton intent="remove" label={`Remove ${place.name}`} icon={Trash2} />
                  </form>
                </div>
                {note && <p className="text-body">{note}</p>}
                <details className="group">
                  <summary className="cursor-pointer text-meta font-semibold text-primary-text">
                    {note ? "Edit note" : "Add a note"}
                  </summary>
                  <form action={collectionItemAction} className="mt-3 grid gap-2 sm:flex">
                    <input type="hidden" name="id" value={collection.id} />
                    <input type="hidden" name="placeId" value={place.id} />
                    <input type="hidden" name="intent" value="note" />
                    <TextField
                      name="note"
                      label={`Note for ${place.name}`}
                      defaultValue={note ?? ""}
                      maxLength={280}
                      className="flex-1"
                    />
                    <Button type="submit" variant="secondary" className="h-14">
                      Save note
                    </Button>
                  </form>
                </details>
              </GlassCard>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved here yet"
          className="mt-6 max-w-none"
          action={
            <ButtonLink href="/explore" size="sm">
              Find places to save
            </ButtonLink>
          }
        >
          Press the bookmark on any place and pick this collection.
        </EmptyState>
      )}

      <section aria-labelledby="settings" className="mt-12 grid gap-4">
        <h2 id="settings" className="text-card font-semibold">
          Collection settings
        </h2>
        <GlassCard className="grid gap-5 p-5">
          <form action={renameCollectionAction} className="grid gap-2 sm:flex">
            <input type="hidden" name="id" value={collection.id} />
            <TextField
              name="title"
              label="Name"
              defaultValue={collection.title}
              maxLength={80}
              required
              className="flex-1"
            />
            <Button type="submit" variant="secondary" className="h-14">
              Rename
            </Button>
          </form>

          <div className="grid gap-3">
            <form action={setCollectionVisibilityAction}>
              <input type="hidden" name="id" value={collection.id} />
              <input type="hidden" name="isPublic" value={collection.isPublic ? "false" : "true"} />
              <Button type="submit" variant="secondary" size="sm">
                <Icon icon={collection.isPublic ? Lock : Globe} size={16} />
                {collection.isPublic ? "Make it private" : "Share with a link"}
              </Button>
            </form>
            {collection.isPublic && (
              <div className="grid gap-1">
                <label htmlFor="share-url" className="text-meta font-semibold">
                  Share link
                </label>
                <input
                  id="share-url"
                  readOnly
                  value={shareUrl}
                  className="h-11 rounded-full border border-divider bg-surface-solid px-4 text-body"
                />
              </div>
            )}
          </div>

          <details>
            <summary className="cursor-pointer text-meta font-semibold text-danger">
              Delete this collection
            </summary>
            <form action={deleteCollectionAction} className="mt-3 grid gap-2">
              <input type="hidden" name="id" value={collection.id} />
              <p className="text-body">
                The places stay on CityRoots. Only this list and its notes go.
              </p>
              <Button type="submit" variant="ink" size="sm" className="justify-self-start">
                Delete it for good
              </Button>
            </form>
          </details>
        </GlassCard>
      </section>
    </div>
  );
}

function IconButton({
  intent,
  label,
  icon,
  disabled,
}: {
  intent: string;
  label: string;
  icon: typeof ArrowUp;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      aria-label={label}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-divider/60 hover:text-text disabled:opacity-35"
    >
      <Icon icon={icon} size={16} />
    </button>
  );
}
