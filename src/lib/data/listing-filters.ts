import "server-only";
import { sql } from "drizzle-orm";
import { events, places } from "@/lib/db/schema";

/**
 * An event whose last date has passed is no longer a thing you can do, so it leaves
 * every list, count, and search at once. A place has at most one event row, and the
 * weekly refresh moves a yearly event's row on to its next date, which brings it back.
 *
 * Written as `not in` so the finished events are listed once. City counts use this four
 * times per place on every page, and `not exists` here made each page about 1.4s slower.
 */
export const notFinished = sql`${places.id} not in (
  select e.place_id from ${events} e
  where e.place_id is not null and e.end_at < now()
)`;
