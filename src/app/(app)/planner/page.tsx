import { RefreshCw, Route as RouteIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/features/planner/auto-submit-form";
import { PlanEditor, type EditorPlace } from "@/components/features/planner/plan-editor";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { currentUser } from "@/lib/auth/session";
import { listLiveCities } from "@/lib/data/cities";
import { listPlannerCandidates, listPlans, type PlanSummary } from "@/lib/data/planner";
import { getMembership } from "@/lib/data/subscriptions";
import type { CitySummary } from "@/lib/data/types";
import { CATEGORIES } from "@/lib/domain/categories";
import { exploreHref } from "@/lib/domain/explore-params";
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

const DEFAULT_CITY = "toronto";
const DEFAULT_BUDGET = 25;

export const metadata: Metadata = {
  title: "Plan a day out",
  description:
    "Pick a city, a day, and a budget, and get a full day out with a running cost total. Free, no account needed.",
  alternates: { canonical: "/planner" },
};

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
  const [user, query, cities] = await Promise.all([
    currentUser(),
    props.searchParams,
    listLiveCities(),
  ]);
  const [membership, plans] = user
    ? await Promise.all([getMembership(user.id), listPlans(user.id)])
    : [null, []];

  const today = torontoDay(new Date());
  const fallback: PlannerParams = {
    city: DEFAULT_CITY,
    day: nextSaturday(today),
    budget: DEFAULT_BUDGET,
    interests: [],
    seed: 0,
  };
  const parsed = plannerParamsSchema(today).safeParse({
    city: typeof query.city === "string" ? query.city : fallback.city,
    day: query.day ?? fallback.day,
    budget: query.budget ?? fallback.budget,
    interests: list(query.interests),
    seed: query.seed,
  });
  const params = parsed.success ? parsed.data : fallback;
  const city = cities.find((c) => c.slug === params.city) ?? cities[0];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <RememberCity slug={city?.slug ?? null} />
      {query.deleted && (
        <p role="status" className="mb-4 text-body font-semibold">
          Plan deleted.
        </p>
      )}
      <h1 className="mb-4 text-section font-semibold tracking-tight">Plan a day</h1>
      {city && (
        <>
          <PlannerForm cities={cities} params={{ ...params, city: city.slug }} today={today} />
          <AssembledPlan
            params={{ ...params, city: city.slug }}
            city={city}
            canSave={membership?.pro ?? false}
          />
        </>
      )}
      <SavedPlans plans={plans} />
    </div>
  );
}

async function AssembledPlan({
  params,
  city,
  canSave,
}: {
  params: PlannerParams;
  city: CitySummary;
  canSave: boolean;
}) {
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-card font-semibold tracking-tight">
          {planTitle(params.day, city.name)}
        </h2>
        <Link
          href={plannerHref(params, { seed: String((params.seed + 1) % 100) })}
          replace
          scroll={false}
          className={buttonClasses("secondary", "sm")}
        >
          <Icon icon={RefreshCw} size={16} />
          Shuffle
        </Link>
      </div>

      <div className="mt-3">
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
            canSave={canSave}
          />
        ) : (
          <EmptyState
            icon={RouteIcon}
            title="Nothing fits that day yet"
            className="max-w-none"
            action={
              <ButtonLink href={exploreHref({ city: city.slug })} size="sm">
                See everything in {city.name}
              </ButtonLink>
            }
          >
            Try a bigger budget, another day, or another city.
          </EmptyState>
        )}
        {plan.skipped.length > 0 && plan.stops.length > 0 && (
          <p className="mt-4 text-meta text-text-muted">
            Left out to stay on budget or because nothing is open:{" "}
            {plan.skipped.map((s) => s.label.toLowerCase()).join(", ")}.
          </p>
        )}
      </div>
    </>
  );
}

function PlannerForm({
  cities,
  params,
  today,
}: {
  cities: CitySummary[];
  params: PlannerParams;
  today: string;
}) {
  return (
    <Card className="p-4">
      {/* Keyed so the answers follow the URL when the header's city picker changes it. */}
      <AutoSubmitForm
        key={`${params.city}-${params.day}-${params.budget}`}
        method="get"
        action="/planner"
        className="grid gap-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="City"
            name="city"
            required
            defaultValue={params.city}
            options={cities.map((c) => ({ value: c.slug, label: c.name }))}
          />
          <TextField
            type="date"
            name="day"
            label="Day"
            required
            min={today}
            max={addDays(today, MAX_DAYS_AHEAD)}
            defaultValue={params.day}
          />
        </div>
        <ChoiceChips
          legend="Budget per person"
          name="budget"
          required
          defaultValue={String(params.budget)}
          options={BUDGET_CHOICES.map((b) => ({
            value: String(b),
            label: b === 0 ? "Free" : `$${b}`,
          }))}
        />
        <ChoiceChips
          legend="Into (optional)"
          name="interests"
          multiple
          defaultValue={params.interests}
          options={CATEGORIES.filter((c) =>
            (PLANNER_INTERESTS as readonly string[]).includes(c.slug),
          ).map((c) => ({ value: c.slug, label: c.shortName, accent: c.accent }))}
        />
        <noscript>
          <button type="submit" className={buttonClasses("primary")}>
            Plan my day
          </button>
        </noscript>
      </AutoSubmitForm>
    </Card>
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
            <Card
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
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
