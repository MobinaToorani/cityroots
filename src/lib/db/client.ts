import "server-only";
import { env } from "@/lib/env";
import { createDatabase, type Database } from "./create";

declare global {
  // One connection per server process, reused across hot reloads in development.
  var __cityrootsDb: Database | undefined;
}

export function db(): Database {
  globalThis.__cityrootsDb ??= createDatabase(env());
  return globalThis.__cityrootsDb;
}

export type { Database };
