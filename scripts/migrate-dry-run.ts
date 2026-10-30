/**
 * Applies every migration to a throwaway in-memory Postgres (PGlite), then
 * verifies the schema has no drift from src/lib/db/schema.ts. Used on every PR.
 */
import { execSync } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

async function main() {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("All migrations apply cleanly to an empty database");

  const before = execSync("git status --porcelain --untracked-files=all drizzle").toString();
  execSync("npx drizzle-kit generate --name drift-check", { stdio: "pipe" });
  const after = execSync("git status --porcelain --untracked-files=all drizzle").toString();
  if (after !== before) {
    console.error("Schema drift: src/lib/db/schema.ts has changes without a migration.");
    console.error("Run `npm run db:generate` and commit the new migration.");
    execSync("git checkout -- drizzle && git clean -fdq drizzle");
    process.exit(1);
  }
  console.log("Schema and migrations are in sync");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
