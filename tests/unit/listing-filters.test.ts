import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { notFinished } = await import("@/lib/data/listing-filters");

describe("notFinished", () => {
  const db = drizzle(new PGlite());

  beforeAll(async () => {
    await db.execute(sql`create table places (id text primary key)`);
    await db.execute(
      sql`create table events (place_id text, end_at timestamptz, occurrences jsonb)`,
    );
    await db.execute(sql`insert into places values
      ('ended-curated'), ('ended-feed'), ('running'), ('undated'), ('not-an-event')`);
    await db.execute(sql`insert into events values
      ('ended-curated', now() - interval '1 hour', null),
      ('ended-feed', now() - interval '1 day', '[]'),
      ('running', now() + interval '1 day', null),
      ('undated', null, null)`);
  });

  it("drops an event once it has ended, whatever its source, and keeps the rest", async () => {
    const { rows } = await db.execute<{ id: string }>(
      sql`select id from places where ${notFinished} order by id`,
    );
    expect(rows.map((r) => r.id)).toEqual(["not-an-event", "running", "undated"]);
  });
});
