"use client";

import { ArrowDown, ArrowUp, Clock, RefreshCw, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { savePlanAction, type SavePlanState } from "@/app/(app)/planner/actions";
import { CategoryTag, CostBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import type { PlanOption } from "@/lib/domain/planner";
import { SLOT_TIMES, timeLabel, type SlotKey } from "@/lib/domain/plan-slots";
import type { CategorySlug } from "@/lib/domain/categories";
import type { CostBand } from "@/lib/domain/cost";
import { cn } from "@/lib/cn";

export type EditorPlace = {
  id: string;
  name: string;
  category: CategorySlug;
  costBand: CostBand;
  neighborhood: string | null;
  hoursKnown: boolean;
};

export type EditorStop = {
  slot: SlotKey;
  label: string;
  placeId: string;
  estimate: number;
  /** Other places for this slot, cycled with "Try another". */
  options: PlanOption[];
};

type Props = {
  stops: EditorStop[];
  places: Record<string, EditorPlace>;
  budget: number;
  city: string;
  day: string;
  interests: string[];
};

const initial: SavePlanState = { status: "idle" };

function money(n: number): string {
  return n === 0 ? "$0" : `$${n}`;
}

/** The assembled day: reorder, swap, or drop stops, watch the total, then save to share. */
export function PlanEditor({ stops: initialStops, places, budget, city, day, interests }: Props) {
  const [stops, setStops] = useState(initialStops);
  const [announcement, setAnnouncement] = useState("");
  const [state, save, saving] = useActionState(savePlanAction, initial);
  const total = stops.reduce((sum, s) => sum + s.estimate, 0);
  const over = total > budget;
  const share = budget === 0 ? (total > 0 ? 1 : 0) : Math.min(1, total / budget);

  function move(index: number, by: -1 | 1) {
    const next = [...stops];
    const [stop] = next.splice(index, 1);
    if (!stop) return;
    next.splice(index + by, 0, stop);
    setStops(next);
    setAnnouncement(
      `${places[stop.placeId]?.name ?? "Stop"} moved to ${timeLabel(SLOT_TIMES[index + by] ?? "")}`,
    );
  }

  function swap(index: number) {
    const stop = stops[index];
    if (!stop || stop.options.length === 0) return;
    const [nextOption, ...rest] = stop.options;
    if (!nextOption) return;
    const updated: EditorStop = {
      ...stop,
      placeId: nextOption.placeId,
      estimate: nextOption.estimate,
      options: [...rest, { placeId: stop.placeId, estimate: stop.estimate }],
    };
    setStops(stops.map((s, i) => (i === index ? updated : s)));
    setAnnouncement(`${stop.label} is now ${places[nextOption.placeId]?.name ?? "another place"}`);
  }

  function remove(index: number) {
    const stop = stops[index];
    setStops(stops.filter((_, i) => i !== index));
    setAnnouncement(`${places[stop?.placeId ?? ""]?.name ?? "Stop"} removed`);
  }

  return (
    <div className="grid gap-5">
      <GlassCard strength="strong" className="grid gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-card font-semibold">Estimated total</h2>
          <p className="text-meta text-text-muted">
            <span className={cn("text-card font-semibold", over ? "text-danger" : "text-text")}>
              {money(total)}
            </span>{" "}
            of {money(budget)}
          </p>
        </div>
        <div
          role="meter"
          aria-label="Spend against budget"
          aria-valuemin={0}
          aria-valuemax={budget}
          aria-valuenow={total}
          aria-valuetext={`${money(total)} of ${money(budget)}`}
          className="h-2 overflow-hidden rounded-full bg-divider"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              over ? "bg-danger" : "bg-free",
            )}
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </div>
        <p className="text-meta text-text-muted">
          {over
            ? "Over budget. Try another option for a paid stop, or remove one."
            : "Per person, from listed prices. Free stops cost nothing."}
        </p>
      </GlassCard>

      {stops.length > 0 ? (
        <ol className="grid gap-3" aria-label="Your day">
          {stops.map((stop, i) => {
            const place = places[stop.placeId];
            if (!place) return null;
            const time = SLOT_TIMES[i] ?? SLOT_TIMES[SLOT_TIMES.length - 1] ?? "18:30";
            return (
              <li key={`${stop.slot}-${stop.placeId}`}>
                <GlassCard className="grid gap-3 p-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:p-5">
                  <p className="text-card font-semibold">{timeLabel(time)}</p>
                  <div className="min-w-0">
                    <p className="text-meta font-semibold text-text-muted">{stop.label}</p>
                    <h3 className="text-card font-semibold">
                      <Link href={`/places/${place.id}`} className="quiet-link">
                        {place.name}
                      </Link>
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-meta text-text-muted">
                      <CategoryTag slug={place.category} />
                      <CostBadge band={place.costBand} />
                      {stop.estimate > 0 && <span>About {money(stop.estimate)}</span>}
                      {place.neighborhood && <span>{place.neighborhood}</span>}
                    </div>
                    {!place.hoursKnown && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-meta text-text-muted">
                        <Icon icon={Clock} size={16} />
                        Check the hours before you go
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 sm:justify-end">
                    <StopButton
                      label={`Move ${place.name} earlier`}
                      icon={ArrowUp}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    />
                    <StopButton
                      label={`Move ${place.name} later`}
                      icon={ArrowDown}
                      disabled={i === stops.length - 1}
                      onClick={() => move(i, 1)}
                    />
                    <StopButton
                      label={`Try another place instead of ${place.name}`}
                      icon={RefreshCw}
                      disabled={stop.options.length === 0}
                      onClick={() => swap(i)}
                    />
                    <StopButton
                      label={`Remove ${place.name}`}
                      icon={Trash2}
                      onClick={() => remove(i)}
                    />
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-body text-text-muted">
          Every stop is gone. Shuffle the plan or change the details to start again.
        </p>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <form action={save} className="grid gap-2">
        <input type="hidden" name="city" value={city} />
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="budget" value={budget} />
        {interests.map((i) => (
          <input key={i} type="hidden" name="interests" value={i} />
        ))}
        <input
          type="hidden"
          name="stops"
          value={JSON.stringify(stops.map((s) => ({ placeId: s.placeId, slot: s.slot })))}
        />
        <Button
          type="submit"
          size="lg"
          disabled={saving || stops.length === 0}
          className="justify-self-start"
        >
          <Icon icon={Share2} size={16} />
          Save and get a share link
        </Button>
        {state.status === "error" && (
          <p role="alert" className="text-body text-danger">
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

function StopButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof ArrowUp;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full text-text-muted transition-colors hover:bg-divider/60 hover:text-text disabled:opacity-35"
    >
      <Icon icon={icon} size={16} />
    </button>
  );
}
