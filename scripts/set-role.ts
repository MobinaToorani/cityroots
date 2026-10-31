/**
 * Gives a member a role. The member must have signed in once.
 *
 *   npx tsx scripts/set-role.ts someone@example.com curator
 */
import { eq } from "drizzle-orm";
import { users } from "../src/lib/db/schema";
import { describeTarget, scriptDatabase } from "./db-config";

const ROLES = ["user", "curator", "admin"] as const;

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role as (typeof ROLES)[number])) {
    console.error("Usage: npx tsx scripts/set-role.ts <email> <user|curator|admin>");
    process.exit(1);
  }
  const db = scriptDatabase();
  const rows = await db
    .update(users)
    .set({ role: role as (typeof ROLES)[number] })
    .where(eq(users.email, email.toLowerCase()))
    .returning({ id: users.id });
  if (rows.length === 0) {
    console.error(
      `No member with email ${email} on ${describeTarget()}. They need to sign in once first.`,
    );
    process.exit(1);
  }
  console.log(`${email} is now ${role} on ${describeTarget()}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
