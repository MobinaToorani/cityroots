import { CalendarDays, RefreshCw, Route as RouteIcon, SlidersHorizontal } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PlanEditor, type EditorPlace } from "@/components/features/planner/plan-editor";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { currentUser } from "@/lib/auth/session";
import { listLiveCities } from "@/lib/data/cities";
import { listPlannerCandidates, listPlans, type PlanSummary } from "@/lib/data/planner";
import { sampleDay } from "@/lib/data/sample-day";
import { getMembership } from "@/lib/data/subscriptions";
import type { CitySummary } from "@/lib/data/types";
import { CATEGORIES } from "@/lib/domain/categories";
import {
  addDays,
  assemblePlan,
  BUDGET_CHOICES,
  dayLabel,
  MAX_DAYS_AHEAD,
  nextSaturday,
  plannerParamsSchema,
  PLANNER_INTERESTS,
  planTitle,
  torontoDay,
  weekdayOf,
  type PlannerParams,
} from "@/lib/domain/planner";

export const metadata: Metadata = {
  title: "Day Planner",
  description:
    "Pick a city, a day, and a budget, and CityRoots lines up a full day out with a running cost total and a link to share.",
  alternates: { canonical: "/planner" },
};

type Query = Awaited<PageProps<"/planner">["searchParams"]>;

function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function plannerHref(params: PlannerParams, extra: Record<string, string> = {}): Route {
  const q = new URLSearchParams({
    city: params.city,
    day: params.day,
    budget: String(params.budget),
  });
  for (const i of params.interests) q.append("interests", i);
  if (params.seed) q.set("seed", String(params.seed));
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return `/planner?${q.toString()}` as Route;
}

export default async function PlannerPage(props: PageProps<"/planner">) {
  const [user, query] = await Promise.all([currentUser(), props.searchParams]);
  const membership = user ? await getMembership(user.id) : null;
  const plans = user ? await listPlans(user.id) : [];

  if (!membership?.pro) {
    return <PlannerIntro signedIn={Boolean(user)} plans={plans} deleted={Boolean(query.deleted)} />;
  }

  const today = torontoDay(new Date());
  const cities = await listLiveCities();
  const requested = typeof query.city === "string";
  const parsed = requested
    ? plannerParamsSchema(today).safeParse({
        city: query.city,
        day: query.day,
        budget: query.budget,
        interests: list(query.interests),
        seed: query.seed,
      })
    : null;
  const city = parsed?.success ? cities.find((c) => c.slug === parsed.data.city) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-4 sm:px-8 lg:pt-8">
      {query.deleted && (
        <p role="status" className="mb-4 text-body font-semibold">
          Plan deleted.
        </p>
      )}
      {parsed?.success && city && !query.edit ? (
        <AssembledPlan params={parsed.data} city={city} />
      ) : (
        <>
          <p className="text-meta font-semibold text-primary-text">Day Planner</p>
          <h1 className="mt-1 text-section font-semibold tracking-tight">Plan a day out</h1>
          <p className="mt-2 text-body text-text-muted">
            Four quick answers, and CityRoots lines up coffee, something free, lunch, an afternoon
            stop, and an evening plan that fit your budget.
          </p>
          <PlannerForm
            cities={cities}
            today={today}
            query={query}
            error={
              parsed && !parsed.success
                ? (parsed.error.issues[0]?.message ?? "Check your answers")
                : parsed?.success && !city
                  ? "Choose a city from the list"
                  : undefined
            }
          />
        </>
      )}
      <SavedPlans plans={plans} />
    </div>
  );
}

async function AssembledPlan({ params, city }: { params: PlannerParams; city: CitySummary }) {
  const candidates = await listPlannerCandidates(city.slug, params.day);
  const plan = assemblePlan({
    candidates,
    budget: params.budget,
    interests: params.interests,
    weekday: weekdayOf(params.day),
    seed: params.seed,
  });
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const places: Record<string, EditorPlace> = {};
  for (const stop of plan.stops) {
    for (const id of [stop.placeId, ...stop.alternatives.map((a) => a.placeId)]) {
      const c = byId.get(id);
      if (c) {
        places[id] = {
          id,
          name: c.name,
          category: c.category,
          costBand: c.costBand,
          neighborhood: c.neighborhood,
          hoursKnown: Boolean(c.weekly),
        };
      }
    }
  }

  return (
    <>
      <p className="text-meta font-semibold text-primary-text">Your plan</p>
      <h1 className="mt-1 text-section font-semibold tracking-tight">
        {planTitle(params.day, city.name)}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={CalendarDays} size={16} />
          {dayLabel(params.day)}
        </span>
        <span>Budget {params.budget === 0 ? "$0, free only" : `$${params.budget} a person`}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={plannerHref(params, { seed: String((params.seed + 1) % 100) })}
          className={buttonClasses("secondary", "sm")}
        >
          <Icon icon={RefreshCw} size={16} />
          Shuffle the plan
        </Link>
        <Link
          href={plannerHref(params, { edit: "1" })}
          className={buttonClasses("secondary", "sm")}
        >
          <Icon icon={SlidersHorizontal} size={16} />
          Change the details
        </Link>
      </div>

      <div className="mt-6">
        {plan.stops.length > 0 ? (
          <PlanEditor
            key={plannerHref(params)}
            stops={plan.stops.map((s) => ({
              slot: s.slot,
              label: s.label,
              placeId: s.placeId,
              estimate: s.estimate,
              options: s.alternatives,
            }))}
            places={places}
            budget={params.budget}
            city={city.slug}
            day={params.day}
            interests={params.interests}
          />
        ) : (
          <EmptyState
            icon={RouteIcon}
            title="Nothing fits that day yet"
            className="max-w-none"
            action={
              <ButtonLink href={plannerHref(params, { edit: "1" })} size="sm">
                Change the details
              </ButtonLink>
            }
          >
            Nothing listed in {city.name} is open and within budget for that day. Try a bigger
            budget, another day, or another city.
          </EmptyState>
        )}
        {plan.skipped.length > 0 && plan.stops.length > 0 && (
          <p className="mt-4 text-meta text-text-muted">
            Left out to stay within budget, or because nothing is open then:{" "}
            {plan.skipped.map((s) => s.label.toLowerCase()).join(", ")}.
          </p>
        )}
      </div>
    </>
  );
}

function PlannerForm({
  cities,
  today,
  query,
  error,
}: {
  cities: CitySummary[];
  today: string;
  query: Query;
  error?: string;
}) {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return (
    <form method="get" action="/planner" className="mt-6 grid gap-6">
      {error && (
        <p
          role="alert"
          className="rounded-2xl px-4 py-3 text-body font-semibold text-danger glass-strong"
        >
          {error}
        </p>
      )}
      <Step n={1}>
        <SelectField
          label="Which city?"
          name="city"
          required
          defaultValue={str(query.city) ?? cities[0]?.slug}
          options={cities.map((c) => ({ value: c.slug, label: c.name }))}
        />
      </Step>
      <Step n={2}>
        <TextField
          type="date"
          name="day"
          label="Which day?"
          required
          min={today}
          max={addDays(today, MAX_DAYS_AHEAD)}
          defaultValue={str(query.day) ?? nextSaturday(today)}
          description="Hours and seasonal events are checked for this day."
        />
      </Step>
      <Step n={3}>
        <ChoiceChips
          legend="What can you spend, per person?"
          name="budget"
          required
          defaultValue={str(query.budget) ?? "25"}
          options={BUDGET_CHOICES.map((b) => ({
            value: String(b),
            label: b === 0 ? "Free only" : `$${b}`,
          }))}
        />
      </Step>
      <Step n={4}>
        <ChoiceChips
          legend="What are you into? Pick any, or none."
          name="interests"
          multiple
          defaultValue={list(query.interests)}
          options={CATEGORIES.filter((c) =>
            (PLANNER_INTERESTS as readonly string[]).includes(c.slug),
          ).map((c) => ({ value: c.slug, label: c.shortName, accent: c.accent }))}
        />
      </Step>
      <button type="submit" className={buttonClasses("primary", "lg", "justify-self-start")}>
        Plan my day
      </button>
    </form>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <GlassCard className="grid gap-1 p-5">
      <p className="text-meta font-semibold text-text-muted">Step {n} of 4</p>
      {children}
    </GlassCard>
  );
}

function SavedPlans({ plans }: { plans: PlanSummary[] }) {
  if (plans.length === 0) return null;
  return (
    <section aria-labelledby="saved-plans" className="mt-12">
      <h2 id="saved-plans" className="text-card font-semibold">
        Your saved plans
      </h2>
      <ul className="mt-3 grid gap-2">
        {plans.map((p) => (
          <li key={p.shareId}>
            <GlassCard
              interactive
              className="relative flex items-center justify-between gap-3 px-4 py-3"
            >
              <Link
                href={`/plans/${p.shareId}` as Route}
                className="font-semibold after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
              >
                {p.title}
              </Link>
              <span className="text-meta text-text-muted">
                {dayLabel(p.day)}, {p.stopCount} stops
              </span>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function PlannerIntro({
  signedIn,
  plans,
  deleted,
}: {
  signedIn: boolean;
  plans: PlanSummary[];
  deleted: boolean;
}) {
  const day = await sampleDay("newmarket");
  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-4 sm:px-8 lg:pt-8">
      {deleted && (
        <p role="status" className="mb-4 text-body font-semibold">
          Plan deleted.
        </p>
      )}
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-meta font-semibold text-primary-text">Day Planner, part of Pro</p>
          <h1 className="mt-1 font-display text-section font-medium tracking-tight">
            Tell it your budget. Get a whole day out.
          </h1>
          <p className="mt-4 max-w-md text-body text-text-muted">
            Pick a city, a day, a budget, and what you are into. The planner lines up coffee,
            something free, lunch, an afternoon stop, and an evening plan, checks that each place is
            open, and keeps a running total. Move stops around, swap any of them, and share the plan
            with a link.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {signedIn ? (
              <ButtonLink href="/pricing">Start Pro to plan a day</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/pricing">See Pro plans</ButtonLink>
                <ButtonLink href="/signin?callbackUrl=%2Fplanner" variant="secondary">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
          <p className="mt-3 text-meta text-text-muted">
            $4.99 a month or $39 a year. Every place in a plan stays free to browse.
          </p>
        </div>
        {day.stops.length > 0 && (
          <SamplePlan
            day={day}
            title={`This Saturday in Newmarket, $${day.budget} budget`}
            headingLevel="h2"
          />
        )}
      </div>
      <SavedPlans plans={plans} />
    </div>
  );
}
