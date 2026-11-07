"use client";

import { GOALS, track } from "@/lib/analytics";
import { Check, Plus, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  createAndSaveAction,
  loadSaveDialog,
  toggleSavedAction,
  type SaveDialogState,
} from "@/app/(app)/collections/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { logger } from "@/lib/logger";

type Props = { placeId: string; placeName: string; onClose: () => void };

export function SaveDialog({ placeId, placeName, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pathname = usePathname();
  const [state, setState] = useState<SaveDialogState | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
    let live = true;
    loadSaveDialog(placeId)
      .then((s) => {
        if (live) setState(s);
      })
      .catch((error: unknown) => {
        logger.warn("Could not load collections", { error });
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [placeId]);

  function apply(next: SaveDialogState, announce?: string) {
    setState(next);
    if (next.signedIn) {
      setStatus(next.error ?? next.message ?? announce ?? "");
    }
  }

  function toggle(collectionId: string, title: string, saved: boolean) {
    if (!state?.signedIn) return;
    // Show the change at once; the server's answer replaces it.
    setState({
      ...state,
      choices: state.choices.map((c) => (c.id === collectionId ? { ...c, hasPlace: saved } : c)),
    });
    startTransition(async () => {
      try {
        const next = await toggleSavedAction(collectionId, placeId, saved);
        apply(next, saved ? `Saved to ${title}` : `Removed from ${title}`);
        if (saved && next.signedIn && !next.error) track(GOALS.placeSaved);
      } catch (error) {
        logger.warn("Save toggle failed", { error });
        setStatus("That did not save. Try again.");
      }
    });
  }

  function create() {
    startTransition(async () => {
      try {
        const next = await createAndSaveAction(newTitle, placeId);
        if (next.signedIn && !next.error) setNewTitle("");
        apply(next);
      } catch (error) {
        logger.warn("Create collection failed", { error });
        setStatus("That did not save. Try again.");
      }
    });
  }

  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname)}` as Route;

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current.close();
      }}
      className="palette m-auto w-[min(440px,calc(100vw-1.5rem))] rounded-[var(--radius-modal)] p-0 text-text card backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-card font-semibold">
            Save to a collection
          </h2>
          <p className="truncate text-meta text-text-muted">{placeName}</p>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-control text-text-muted hover:bg-divider/60 hover:text-text"
        >
          <Icon icon={X} />
        </button>
      </div>

      <div className="px-5 pb-5">
        {failed ? (
          <p className="text-body">
            Your collections did not load.{" "}
            <Link href={`/collections/save?place=${placeId}`} className="quiet-link">
              Open the save page instead
            </Link>
            .
          </p>
        ) : !state ? (
          <div aria-busy="true" className="grid gap-2">
            <span className="sr-only">Loading your collections</span>
            <div className="h-11 rounded-card bg-divider/60" />
            <div className="h-11 rounded-card bg-divider/40" />
          </div>
        ) : !state.signedIn ? (
          <div className="grid gap-4">
            <p className="text-body text-text-muted">
              Sign in to keep places in collections, like a list for this weekend or for when family
              visits. It is free.
            </p>
            <ButtonLink href={signInHref}>Sign in to save</ButtonLink>
          </div>
        ) : (
          <div className="grid gap-4">
            {state.choices.length > 0 ? (
              <fieldset>
                <legend className="sr-only">Your collections</legend>
                <ul className="grid gap-1.5">
                  {state.choices.map((c) => (
                    <li key={c.id}>
                      <label
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-card border px-3.5 py-2 transition-colors",
                          c.hasPlace
                            ? "border-primary-text/40 bg-free-soft"
                            : "border-divider bg-surface-solid/70 hover:border-text-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={c.hasPlace}
                          onChange={(e) => toggle(c.id, c.title, e.target.checked)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                            c.hasPlace
                              ? "border-primary bg-primary text-white"
                              : "border-text-muted",
                          )}
                        >
                          {c.hasPlace && <Icon icon={Check} size={16} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{c.title}</span>
                        <span className="text-meta text-text-muted">
                          {c.itemCount} {c.itemCount === 1 ? "place" : "places"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : (
              <p className="text-body text-text-muted">
                You have no collections yet. Name your first one to save {placeName} to it.
              </p>
            )}

            {state.canCreate ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create();
                }}
                className="flex gap-2"
              >
                <label className="sr-only" htmlFor={`${titleId}-new`}>
                  New collection name
                </label>
                <input
                  id={`${titleId}-new`}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New collection, like Rainy days"
                  maxLength={80}
                  className="h-11 min-w-0 flex-1 rounded-control border border-divider bg-surface-solid px-4 text-body placeholder:text-text-muted"
                />
                <Button type="submit" variant="secondary" disabled={pending || !newTitle.trim()}>
                  <Icon icon={Plus} size={16} />
                  Create
                </Button>
              </form>
            ) : (
              <p className="text-meta text-text-muted">
                Free accounts keep up to {state.freeLimit} collections.{" "}
                <Link href="/pricing" className="font-semibold text-primary-text quiet-link">
                  See what Pro adds
                </Link>
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Link href="/collections" className="text-meta font-semibold quiet-link">
                Open your collections
              </Link>
              <Button size="sm" onClick={() => dialog.current?.close()}>
                Done
              </Button>
            </div>
          </div>
        )}
        <p role="status" className="mt-3 text-meta text-text-muted">
          {status}
        </p>
      </div>
    </dialog>
  );
}
