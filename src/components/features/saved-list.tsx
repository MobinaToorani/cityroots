"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { keepSavedPlacesAction } from "@/app/(app)/collections/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { savedPlaces } from "@/lib/client/stores";
import type { PlaceCard as PlaceCardData } from "@/lib/data/types";
import { logger } from "@/lib/logger";
import { PlaceCard } from "./place-card";

/** Everything hearted on this device, read back from the listings. */
export function SavedList() {
  const ids = savedPlaces.use();
  const [cards, setCards] = useState<Record<string, PlaceCardData>>({});
  const missing = ids.filter((id) => !cards[id]);
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    let live = true;
    fetch(`/api/places?ids=${missingKey}`)
      .then((res) => (res.ok ? res.json() : { places: [] }))
      .then((data: { places: PlaceCardData[] }) => {
        if (!live) return;
        setCards((prev) => ({
          ...prev,
          ...Object.fromEntries(data.places.map((p) => [p.id, p])),
        }));
      })
      .catch((error: unknown) => {
        logger.warn("Could not load saved places", { error });
      });
    return () => {
      live = false;
    };
  }, [missingKey]);

  const list = ids.flatMap((id) => cards[id] ?? []);

  return (
    <>
      {ids.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          action={<ButtonLink href="/explore">Explore</ButtonLink>}
        >
          Tap the heart on anything you like.
        </EmptyState>
      ) : (
        <>
          <ul
            aria-busy={missing.length > 0}
            className="grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2 xl:grid-cols-3"
          >
            {list.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} showCity headingLevel="h2" />
              </li>
            ))}
          </ul>
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-body">Saved on this device only.</p>
            <form action={keepSavedPlacesAction}>
              <input type="hidden" name="ids" value={ids.join(",")} />
              <Button type="submit" variant="secondary" size="sm">
                Keep on all my devices
              </Button>
            </form>
          </Card>
        </>
      )}
      <p className="mt-8 text-body text-text-muted">
        <Link href="/collections" className="font-semibold text-primary-text quiet-link">
          Your collections
        </Link>
      </p>
    </>
  );
}
