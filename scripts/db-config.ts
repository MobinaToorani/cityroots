import { createDatabase } from "../src/lib/db/create";

/** Scripts run outside Next.js, so they read only the database settings. */
export function scriptDatabase() {
  const url = process.env.DATABASE_URL;
  return createDatabase({
    DATABASE_URL: url && url.length > 0 ? url : undefined,
    PGLITE_DIR: process.env.PGLITE_DIR ?? ".data/pglite",
  });
}

export function describeTarget(): string {
  return process.env.DATABASE_URL
    ? "DATABASE_URL"
    : `PGlite at ${process.env.PGLITE_DIR ?? ".data/pglite"}`;
}
