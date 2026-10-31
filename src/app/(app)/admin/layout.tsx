import type { Metadata, Route } from "next";
import type { ReactNode } from "react";
import { hasRole, requireRole } from "@/lib/auth/session";
import { features } from "@/lib/env";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { template: "%s | CityRoots admin", default: "Admin" },
  robots: { index: false, follow: false },
};

/** Staff only. Each page and action checks the role again; this only draws the tabs. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("curator", "/admin");
  const items: { href: Route; label: string }[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/submissions", label: "Suggestions" },
    ...(features.business() ? [{ href: "/admin/claims" as Route, label: "Claims" }] : []),
    ...(features.partners() && hasRole(user, "admin")
      ? [{ href: "/admin/partners" as Route, label: "Partner keys" }]
      : []),
  ];
  return (
    <div className="mx-auto max-w-4xl px-5 pt-4 sm:px-8 lg:pt-8">
      <p className="mb-3 text-meta font-semibold text-primary-text">CityRoots admin</p>
      <AdminNav items={items} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
