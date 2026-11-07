import { CalendarDays, Clock } from "lucide-react";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { deletePlanAction } from "@/app/(app)/planner/actions";
import { CategoryTag, CostBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { currentUser } from "@/lib/auth/session";
import { getPlanByShareId } from "@/lib/data/planner";
import { exploreHref } from "@/lib/domain/explore-params";
import { dayLabel, timeLabel } from "@/lib/domain/planner";
import { absoluteUrl } from "@/lib/site";
import { PlaceLink } from "@/components/features/place-link";

function money(n: number): string {
  return `$${n}`;
}

export async function generateMetadata(props: PageProps<"/plans/[shareId]">): Promise<Metadata> {
  const { shareId } = await props.params;
  const plan = await getPlanByShareId(shareId);
  if (!plan) return { title: "Plan not found" };
  const title = `${plan.title}, about ${money(plan.total)}`;
  const description = `${plan.stops.map((s) => s.place.name).join(", ")}. A day out planned with CityRoots.`;
  return {
    title,
    description,
    // Shared by link. Plans are personal, so they stay out of search results.
    robots: { index: false },
    openGraph: { title, description, url: `/plans/${plan.shareId}`, type: "article" },
  };
}

export default async function SharedPlanPage(props: PageProps<"/plans/[shareId]">) {
  const [{ shareId }, query] = await Promise.all([props.params, props.searchParams]);
  const plan = await getPlanByShareId(shareId);
  if (!plan) notFound();
  const user = await currentUser();
  const isOwner = user?.id === plan.userId;
  const shareUrl = absoluteUrl(`/plans/${plan.shareId}`);

  return (
    <div className="pt-8">
      <Container className="reading">
        {isOwner && query.saved && (
          <p role="status" className="mb-6 rounded-card px-4 py-3 text-body card">
            Plan saved. Anyone with the link below can see it.
          </p>
        )}
        <p className="text-meta font-semibold text-primary-text">A CityRoots day plan</p>
        <h1 className="mt-1 page-title">{plan.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-body text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={CalendarDays} size={16} />
            {dayLabel(plan.day)}
          </span>
          <span>
            About <strong className="text-text">{money(plan.total)}</strong> a person, on a{" "}
            {money(plan.budget)} budget
          </span>
        </p>

        <ol className="mt-8 grid gap-3">
          {plan.stops.map((stop) => (
            <li key={stop.placeId}>
              <Card className="grid gap-2 p-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:p-5">
                <p className="inline-flex items-center gap-1.5 text-card font-semibold">
                  <Icon icon={Clock} size={16} className="text-text-muted sm:hidden" />
                  {timeLabel(stop.time)}
                </p>
                <div className="min-w-0">
                  <p className="text-meta font-semibold text-text-muted">{stop.slot}</p>
                  <h2 className="text-card font-semibold">
                    <PlaceLink placeId={stop.place.id} className="quiet-link">
                      {stop.place.name}
                    </PlaceLink>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-body text-text-muted">
                    {stop.place.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CategoryTag slug={stop.place.category} />
                    {stop.place.neighborhood && (
                      <span className="text-meta text-text-muted">{stop.place.neighborhood}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <CostBadge band={stop.place.costBand} />
                  {stop.estimate > 0 && (
                    <span className="text-meta text-text-muted">About {money(stop.estimate)}</span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-meta text-text-muted">
          Costs are estimates per person from listed prices. Check hours before you go.
        </p>

        {isOwner && (
          <Card className="mt-8 grid gap-4 p-5">
            <div className="grid gap-1">
              <label htmlFor="plan-link" className="text-meta font-semibold">
                Share link
              </label>
              <input
                id="plan-link"
                readOnly
                value={shareUrl}
                className="h-11 rounded-control border border-divider bg-surface-solid px-4 text-body"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ButtonLink href="/planner" variant="secondary" size="sm">
                Plan another day
              </ButtonLink>
              <form action={deletePlanAction}>
                <input type="hidden" name="shareId" value={plan.shareId} />
                <button type="submit" className="text-meta font-semibold text-danger quiet-link">
                  Delete this plan
                </button>
              </form>
            </div>
          </Card>
        )}

        <Card className="mt-10 grid gap-4 p-6">
          <h2 className="font-display text-section font-medium tracking-tight">
            Free and low-cost things to do in {plan.cityName}
          </h2>
          <p className="text-body text-text-muted">
            CityRoots lists what things cost across the GTA and Waterloo Region, free things first.
            Browsing is free. The Day Planner, which made this plan, is part of CityRoots Pro.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={exploreHref({ city: plan.citySlug, cost: ["free"] })}>
              Find free things in {plan.cityName}
            </ButtonLink>
            <ButtonLink href={"/planner" as Route} variant="secondary">
              Plan your own day
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </div>
  );
}
