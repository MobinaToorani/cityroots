"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { COST_LABELS, COST_BANDS } from "@/lib/domain/cost";
import { submitClaim, type ClaimState } from "./actions";

const RELATIONSHIPS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "other", label: "Something else" },
];

const TRI = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const initial: ClaimState = { status: "idle" };

export function ClaimForm({ placeId }: { placeId: string }) {
  const [state, action, pending] = useActionState(submitClaim, initial);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="placeId" value={placeId} />
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-2xl px-4 py-3 text-body font-semibold text-danger glass-strong"
        >
          {state.message}
        </p>
      )}
      <ChoiceChips
        legend="How are you connected to this place?"
        name="relationship"
        required
        defaultValue={v.relationship ?? "owner"}
        options={RELATIONSHIPS}
        error={e.relationship}
      />

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-meta font-semibold">
          Details to confirm or correct. Leave anything that is already right.
        </legend>
        <TextField
          name="hoursText"
          label="Hours"
          description="Like: Mon to Fri 9am to 5pm, Sat 10am to 2pm"
          maxLength={200}
          defaultValue={v.hoursText}
          error={e.hoursText}
        />
        <SelectField
          name="costBand"
          label="What it costs"
          placeholder="No change"
          defaultValue={v.costBand ?? ""}
          options={COST_BANDS.map((b) => ({ value: b, label: COST_LABELS[b] }))}
          error={e.costBand}
        />
        <TextField
          name="priceNote"
          label="Prices"
          description="Like: $5 drop-in, free for under 12"
          maxLength={160}
          defaultValue={v.priceNote}
          error={e.priceNote}
        />
        <TextField
          name="sourceUrl"
          type="url"
          label="Website"
          maxLength={300}
          defaultValue={v.sourceUrl}
          error={e.sourceUrl}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-meta font-semibold">Accessibility</legend>
        <ChoiceChips
          legend="Step-free entrance?"
          name="stepFree"
          defaultValue={v.stepFree}
          options={TRI}
        />
        <ChoiceChips
          legend="Accessible washroom?"
          name="accessibleWashroom"
          defaultValue={v.accessibleWashroom}
          options={TRI}
        />
        <ChoiceChips
          legend="Accessible parking?"
          name="parking"
          defaultValue={v.parking}
          options={TRI}
        />
        <ChoiceChips
          legend="Transit stop within a short walk?"
          name="transitNearby"
          defaultValue={v.transitNearby}
          options={TRI}
        />
        <TextField
          name="accessibilityNotes"
          label="Anything else about access"
          maxLength={280}
          defaultValue={v.accessibilityNotes}
          error={e.accessibilityNotes}
        />
      </fieldset>

      <TextareaField
        name="message"
        label="Anything the curator should know"
        description="For example, the best phone number to confirm you on."
        rows={4}
        maxLength={1000}
        defaultValue={v.message}
        error={e.message}
      />
      <Button type="submit" size="lg" disabled={pending} className="justify-self-start">
        Send my claim
      </Button>
    </form>
  );
}
