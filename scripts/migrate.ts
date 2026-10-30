import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { describeTarget, scriptDatabase } from "./db-config";

async function main() {
  const db = scriptDatabase();
  console.log(`Migrating ${describeTarget()}`);
  if (process.env.DATABASE_URL) {
    await migratePg(db as unknown as NodePgDatabase, { migrationsFolder: "drizzle" });
  } else {
    await migratePglite(db as unknown as PgliteDatabase, { migrationsFolder: "drizzle" });
  }
  console.log("Migrations applied");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
