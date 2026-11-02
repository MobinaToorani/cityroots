import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CorrectionForm, NewPlaceForm } from "./submit-form";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { listLiveCities } from "@/lib/data/cities";
import { getPlaceRef } from "@/lib/data/submissions";

export const metadata: Metadata = {
  title: "Suggest a place or a correction",
  description:
    "Know a free or low-cost place that belongs on CityRoots, or spotted something out of date? Tell us. Every suggestion is reviewed by a curator.",
  alternates: { canonical: "/submit" },
};

export default async function SubmitPage(props: PageProps<"/submit">) {
  const params = await props.searchParams;
  const isCorrection = params.type === "correction";
  const placeId = typeof params.place === "string" ? params.place : "";
  const defaultCity = typeof params.city === "string" ? params.city : undefined;
  const [cities, place] = await Promise.all([
    listLiveCities(),
    isCorrection && placeId ? getPlaceRef(placeId) : Promise.resolve(null),
  ]);

  return (
    <div className="px-5 pt-28 pb-8 color-field sm:px-8">
      <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="font-display text-section font-medium tracking-tight">
            {isCorrection ? "Suggest a correction" : "Suggest a place"}
          </h1>
          <p className="mt-2 max-w-xl text-body text-text-muted">
            {isCorrection
              ? "Prices and hours change. Thanks for helping keep listings accurate."
              : "Know somewhere free or low-cost that more people should find? No account needed."}
          </p>
          <SegmentedLinks
            label="What would you like to do?"
            className="mt-5"
            items={[
              { href: "/submit", label: "Add a place", active: !isCorrection },
              {
                href: placeId
                  ? `/submit?type=correction&place=${placeId}`
                  : "/submit?type=correction",
                label: "Fix a listing",
                active: isCorrection,
              },
            ]}
          />
          <GlassCard strength="strong" className="mt-6 rounded-[var(--radius-modal)] p-5 sm:p-8">
            {!isCorrection && <NewPlaceForm cities={cities} defaultCity={defaultCity} />}
            {isCorrection && place && (
              <>
                <p className="mb-5 text-body">
                  Correcting{" "}
                  <Link href={`/places/${place.id}`} className="font-semibold quiet-link">
                    {place.name}
                  </Link>{" "}
                  in {place.cityName}
                </p>
                <CorrectionForm placeId={place.id} />
              </>
            )}
            {isCorrection && !place && (
              <EmptyState
                icon={ShieldCheck}
                title="Which listing needs fixing?"
                className="max-w-none shadow-none"
                action={
                  <ButtonLink href="/explore" size="sm">
                    Find the listing
                  </ButtonLink>
                }
              >
                Open the listing and choose &ldquo;Suggest a correction&rdquo;. That way we know
                exactly which place you mean.
              </EmptyState>
            )}
          </GlassCard>
        </div>
        <aside aria-labelledby="review-title" className="lg:pt-24">
          <GlassCard className="p-5">
            <h2 id="review-title" className="flex items-center gap-2 text-card font-semibold">
              <Icon icon={ShieldCheck} className="text-free" />
              Every suggestion is reviewed
            </h2>
            <ul className="mt-3 grid gap-2 text-body text-text-muted">
              <li>A curator checks it against the official source before anything goes live.</li>
              <li>Reviews usually happen within a week.</li>
              <li>Leave an email if you want to hear back. It is optional.</li>
              <li>Suggestions are never paid and never change how listings rank.</li>
            </ul>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
