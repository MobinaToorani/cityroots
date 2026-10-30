import { rmSync } from "node:fs";

/** Deletes the local PGlite database. Never touches a remote DATABASE_URL. */
if (process.env.DATABASE_URL) {
  console.error("Refusing to reset: DATABASE_URL is set. Reset only works on local PGlite.");
  process.exit(1);
}
const dir = process.env.PGLITE_DIR ?? ".data/pglite";
rmSync(dir, { recursive: true, force: true });
console.log(`Removed ${dir}. Run npm run db:migrate && npm run db:seed.`);
