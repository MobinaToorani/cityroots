import Link from "next/link";
import { CostBadge } from "@/components/ui/badges";
import { GlassCard } from "@/components/ui/glass-card";
import type { SampleDay } from "@/lib/data/sample-day";

/** A read-only day plan on a colour field, used as a preview of the Day Planner. */
export function SamplePlan({
  day,
  title = "Sample plan",
  headingLevel = "h3",
}: {
  day: SampleDay;
  title?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <div className="relative rounded-[var(--radius-modal)] p-3 color-field sm:p-5">
      <GlassCard strength="strong" className="rounded-[var(--radius-modal)] p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <Heading className="text-card font-semibold">{title}</Heading>
          <p className="text-meta text-text-muted">
            Estimated total <span className="text-card font-semibold text-text">${day.total}</span>
          </p>
        </div>
        <ol className="grid gap-2">
          {day.stops.map((stop) => (
            <li
              key={stop.place.id}
              className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 rounded-2xl bg-surface-solid/70 px-3 py-2.5"
            >
              <span className="text-meta font-semibold text-text-muted">{stop.time}</span>
              <span className="min-w-0">
                <span className="block text-meta text-text-muted">{stop.label}</span>
                <Link
                  href={`/places/${stop.place.id}`}
                  className="block truncate font-semibold quiet-link"
                >
                  {stop.place.name}
                </Link>
              </span>
              <CostBadge band={stop.place.costBand} />
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  );
}
