import { CostBadge } from "@/components/ui/badges";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { EventItem } from "@/lib/data/events";
import { categoryMeta } from "@/lib/domain/categories";
import { whereLine } from "@/lib/domain/where";
import { PlaceLink } from "./place-link";

type EventRowProps = {
  event: EventItem;
  /** The left column: a time, a date, or how long it runs. */
  when: string;
  /** A second line under `when`, such as the time under a date. */
  whenDetail?: string;
  showCity?: boolean;
  headingLevel?: "h3" | "h4";
};

/**
 * One line of a schedule, the only way events are shown: when, what, where, how much.
 * Where sits under the title in a narrow space and gets its own column in a wide one.
 */
export function EventRow({
  event,
  when,
  whenDetail,
  showCity = false,
  headingLevel = "h3",
}: EventRowProps) {
  const Heading = headingLevel;
  const { placeId, category } = event;
  const where =
    whereLine(event.neighborhood, showCity ? event.cityName : null) ||
    (category ? categoryMeta(category).name : "");
  const whereClasses = "items-baseline gap-1.5 text-meta text-text-muted";
  const whereContent = (
    <>
      {category && <CategoryIcon slug={category} size={16} className="translate-y-[3px]" />}
      <span className="min-w-0 truncate">{where}</span>
    </>
  );
  return (
    <article className="group @container relative">
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-3 @3xl:grid-cols-[6.5rem_minmax(0,3fr)_minmax(0,2fr)_5.5rem] @3xl:gap-x-6">
        <p className="text-meta font-semibold">
          {when}
          {whenDetail && <span className="block font-normal text-text-muted">{whenDetail}</span>}
        </p>
        <div className="min-w-0">
          <Heading className="line-clamp-2 font-semibold tracking-tight">
            {placeId ? (
              <PlaceLink
                placeId={placeId}
                className="group-hover:underline after:absolute after:inset-0"
              >
                {event.title}
              </PlaceLink>
            ) : (
              event.title
            )}
          </Heading>
          {where && <p className={`mt-0.5 flex @3xl:hidden ${whereClasses}`}>{whereContent}</p>}
        </div>
        {where && <p className={`hidden @3xl:flex ${whereClasses}`}>{whereContent}</p>}
        <CostBadge band={event.costBand} className="text-right" />
      </div>
    </article>
  );
}
