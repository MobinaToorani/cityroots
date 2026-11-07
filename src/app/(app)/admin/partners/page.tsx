import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { listPartnerKeys } from "@/lib/data/partners";
import { features } from "@/lib/env";
import { SCOPE_LABELS } from "@/lib/domain/partner-keys";
import { revokeKeyAction } from "../actions";
import { IssueKeyForm } from "./issue-key-form";

export const metadata: Metadata = { title: "Partner keys" };

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "America/Toronto",
});

export default async function PartnerKeysPage(props: PageProps<"/admin/partners">) {
  if (!features.partners()) notFound();
  await requireRole("admin", "/admin/partners");
  const [keys, query] = await Promise.all([listPartnerKeys(), props.searchParams]);

  return (
    <>
      <h1 className="page-title">Partner keys</h1>
      <p className="mt-2 text-body text-text-muted">
        One key per organization. Partners are invoiced by email; nothing here charges anyone.
      </p>
      {query.done === "revoked" && (
        <p role="status" className="mt-3 text-body font-semibold">
          Key revoked. Requests with it now get a 401.
        </p>
      )}

      <section aria-labelledby="keys" className="mt-8">
        <h2 id="keys" className="mb-3 text-card font-semibold">
          Issued keys
        </h2>
        {keys.length > 0 ? (
          <ul className="divide-y divide-divider border-y border-divider">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {k.orgName}
                    {!k.active && <span className="font-normal text-text-muted"> (revoked)</span>}
                  </p>
                  <p className="text-meta text-text-muted">
                    Starts with {k.keyPrefix}, {k.scopes.map((s) => SCOPE_LABELS[s]).join(" and ")}
                    {k.contactEmail ? `, ${k.contactEmail}` : ""}
                  </p>
                  <p className="text-meta text-text-muted">
                    Created {dateFormat.format(k.createdAt)},{" "}
                    {k.lastUsedAt ? `last used ${dateFormat.format(k.lastUsedAt)}` : "never used"}
                  </p>
                </div>
                {k.active && (
                  <form action={revokeKeyAction}>
                    <input type="hidden" name="keyId" value={k.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Revoke the key for {k.orgName}
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={KeyRound}
            title="No keys yet"
            className="max-w-none"
            action={
              <a href="#new-key" className="font-semibold text-primary-text quiet-link">
                Create the first key
              </a>
            }
          >
            Keys let partners read places, cities, and events through the API.
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="new-key" className="mt-10">
        <h2 id="new-key" className="mb-4 text-card font-semibold">
          Create a key
        </h2>
        <IssueKeyForm />
      </section>
    </>
  );
}
