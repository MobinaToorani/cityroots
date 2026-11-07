"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { TextField } from "@/components/ui/text-field";
import { PARTNER_SCOPES, SCOPE_LABELS } from "@/lib/domain/partner-keys";
import { issueKeyAction, type IssueKeyState } from "../actions";

const initial: IssueKeyState = { status: "idle" };

export function IssueKeyForm() {
  const [state, action, pending] = useActionState(issueKeyAction, initial);
  return (
    <div className="grid gap-5">
      {state.status === "issued" && state.key && (
        <div role="status" className="grid gap-2 rounded-card px-5 py-4 card">
          <p className="font-semibold">Key for {state.orgName}</p>
          <p className="text-meta text-text-muted">
            Copy it now and send it to the partner securely. It is not stored and cannot be shown
            again.
          </p>
          <label htmlFor="issued-key" className="sr-only">
            New partner key
          </label>
          <input
            id="issued-key"
            readOnly
            value={state.key}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full rounded-card border border-divider bg-surface-solid px-3 text-body"
          />
        </div>
      )}
      {state.status === "error" && state.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}
      <form action={action} className="grid gap-4">
        <TextField name="orgName" label="Organization" required maxLength={120} />
        <TextField
          name="contactEmail"
          type="email"
          label="Technical contact email"
          description="For telling them about changes to the API."
          maxLength={200}
        />
        <ChoiceChips
          legend="What the key can read"
          name="scopes"
          multiple
          defaultValue={[...PARTNER_SCOPES]}
          options={PARTNER_SCOPES.map((s) => ({ value: s, label: SCOPE_LABELS[s] }))}
        />
        <Button type="submit" disabled={pending} className="justify-self-start">
          Create a key
        </Button>
      </form>
    </div>
  );
}
