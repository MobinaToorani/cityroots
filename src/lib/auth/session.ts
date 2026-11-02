import "server-only";
import { notFound, redirect } from "next/navigation";
import { env } from "@/lib/env";
import { auth, type Role } from "./index";

export type CurrentUser = { id: string; email: string; name: string | null; role: Role };

export async function currentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  const role: Role = env().ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "admin" : user.role;
  return { id: user.id, email: user.email, name: user.name ?? null, role };
}

/** For pages that need a signed-in user. Sends everyone else to sign in and back. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

const RANK: Record<Role, number> = { user: 0, curator: 1, admin: 2 };

/**
 * For staff pages. Signed-out visitors go to sign in; signed-in members
 * without the role get a plain 404, so the page's existence is not advertised.
 */
export async function requireRole(
  minimum: "curator" | "admin",
  returnTo: string,
): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (RANK[user.role] < RANK[minimum]) notFound();
  return user;
}

export function hasRole(user: CurrentUser | null, minimum: Role): boolean {
  return Boolean(user && RANK[user.role] >= RANK[minimum]);
}
