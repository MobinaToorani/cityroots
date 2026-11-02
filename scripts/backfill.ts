/**
 * Re-derives structured weekly hours from each place's hours text.
 * Safe to run any time; only rows whose parsed schedule changed are written.
 */
import { eq, isNotNull } from "drizzle-orm";
import { places } from "../src/lib/db/schema";
import { parseWeeklyHours } from "../src/lib/domain/hours";
import { describeTarget, scriptDatabase } from "./db-config";

async function main() {
  const db = scriptDatabase();
  console.log(`Backfilling hours on ${describeTarget()}`);
  const rows = await db
    .select({ id: places.id, hours: places.hours })
    .from(places)
    .where(isNotNull(places.hours));
  let parsed = 0;
  let changed = 0;
  for (const row of rows) {
    if (!row.hours) continue;
    const weekly = parseWeeklyHours(row.hours.text);
    if (weekly) parsed++;
    const next = weekly ? { text: row.hours.text, weekly } : { text: row.hours.text };
    if (JSON.stringify(next) !== JSON.stringify(row.hours)) {
      await db.update(places).set({ hours: next }).where(eq(places.id, row.id));
      changed++;
    }
  }
  console.log(
    `${rows.length} places with hours, ${parsed} with a reliable weekly schedule, ${changed} updated`,
  );
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
