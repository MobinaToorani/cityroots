import "server-only";
import { redirect } from "next/navigation";
import { auth, type Role } from "./index";

export type CurrentUser = { id: string; email: string; name: string | null; role: Role };

export async function currentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email, name: user.name ?? null, role: user.role };
}

/** For pages that need a signed-in user. Sends everyone else to sign in and back. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}
