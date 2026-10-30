import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

type DbConfig = { DATABASE_URL?: string; PGLITE_DIR: string };

/**
 * Postgres over the network when DATABASE_URL is set (Neon, Supabase, any Postgres),
 * otherwise embedded Postgres (PGlite) on local disk for development and tests.
 * Both run the same migrations, so behaviour matches.
 */
export function createDatabase(config: DbConfig): Database {
  if (config.DATABASE_URL) {
    const pool = new Pool({ connectionString: config.DATABASE_URL, max: 5 });
    return drizzlePg(pool, { schema, casing: "snake_case" });
  }
  mkdirSync(config.PGLITE_DIR, { recursive: true });
  const client = new PGlite(config.PGLITE_DIR);
  return drizzlePglite(client, { schema, casing: "snake_case" });
}
