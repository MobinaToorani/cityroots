"use client";

import { GOALS, goal } from "@/lib/analytics";
import { useActionState, useEffect, useRef } from "react";
import { submitListing, type SubmitState } from "./actions";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { CATEGORIES } from "@/lib/domain/categories";
import { COST_BANDS, COST_LABELS } from "@/lib/domain/cost";
import { CORRECTION_FIELDS, CORRECTION_LABELS } from "@/lib/domain/correction-fields";

const KIND_OPTIONS = [
  { value: "place", label: "A place" },
  { value: "event", label: "An event" },
  { value: "program", label: "A program" },
  { value: "resource", label: "A resource" },
];

function FormError({ state }: { state: SubmitState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p
      role="alert"
      tabIndex={-1}
      className="rounded-card bg-danger/10 px-4 py-3 text-meta font-medium text-danger outline-none"
    >
      {state.message}
    </p>
  );
}

/** After a failed submit, move focus to the first field that needs fixing. */
function useFocusFirstError(state: SubmitState) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status !== "error") return;
    const target =
      form.current?.querySelector<HTMLElement>(
        "input[aria-invalid='true'], select[aria-invalid='true'], textarea[aria-invalid='true'], fieldset[aria-invalid='true'] input",
      ) ?? form.current?.querySelector<HTMLElement>("[role='alert']");
    target?.focus();
    target?.scrollIntoView({ block: "center" });
  }, [state]);
  return form;
}

/** Off-screen trap field: people never fill it, bots usually do. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

const EMAIL_HELP =
  "Optional. We will tell you when a curator has reviewed it. Never shared, never used for anything else.";

export function NewPlaceForm({
  cities,
  defaultCity,
}: {
  cities: { slug: string; name: string }[];
  defaultCity?: string;
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitListing, {
    status: "idle",
  });
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const form = useFocusFirstError(state);
  return (
    <form ref={form} action={action} noValidate className="relative grid gap-5">
      <input type="hidden" name="type" value="new_place" />
      <Honeypot />
      <FormError state={state} />
      <TextField
        label="Name"
        name="name"
        required
        defaultValue={v.name}
        error={e.name}
        autoComplete="off"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="City"
          name="city"
          required
          placeholder="Choose a city"
          defaultValue={v.city ?? defaultCity ?? ""}
          options={cities.map((c) => ({ value: c.slug, label: c.name }))}
          error={e.city}
        />
        <SelectField
          label="Category"
          name="category"
          required
          placeholder="Choose a category"
          defaultValue={v.category ?? ""}
          options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          error={e.category}
        />
      </div>
      <ChoiceChips
        legend="What is it?"
        name="kind"
        options={KIND_OPTIONS}
        defaultValue={v.kind ?? "place"}
        error={e.kind}
      />
      <ChoiceChips
        legend="What does it cost?"
        name="costBand"
        required
        options={COST_BANDS.map((b) => ({ value: b, label: COST_LABELS[b] }))}
        defaultValue={v.costBand}
        description="Free means free for everyone, with nothing to buy to get in."
        error={e.costBand}
      />
      <TextField
        label="Price details"
        name="priceNote"
        defaultValue={v.priceNote}
        description="Optional. For example: $5 drop-in, free on Sundays."
        error={e.priceNote}
      />
      <TextField
        label="Address or area"
        name="area"
        required
        defaultValue={v.area}
        error={e.area}
      />
      <TextField
        label="Hours"
        name="hours"
        defaultValue={v.hours}
        description="Optional. For example: Tue to Sun 10am to 5pm."
        error={e.hours}
      />
      <TextareaField
        label="Why it belongs on CityRoots"
        name="description"
        required
        rows={5}
        defaultValue={v.description}
        description="What it is, who it is good for, and anything worth knowing before going."
        error={e.description}
      />
      <TextField
        label="Photo link"
        name="photoUrl"
        type="url"
        inputMode="url"
        defaultValue={v.photoUrl}
        description="Optional. A link to a photo you took or have permission to share."
        error={e.photoUrl}
      />
      <TextField
        label="Your email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={v.email}
        description={EMAIL_HELP}
        error={e.email}
      />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className={`justify-self-start ${goal(GOALS.suggestionSent)}`}
      >
        {pending ? "Sending" : "Send for review"}
      </Button>
    </form>
  );
}

export function CorrectionForm({ placeId }: { placeId: string }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitListing, {
    status: "idle",
  });
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const form = useFocusFirstError(state);
  return (
    <form ref={form} action={action} noValidate className="relative grid gap-5">
      <input type="hidden" name="type" value="correction" />
      <input type="hidden" name="placeId" value={placeId} />
      <Honeypot />
      <FormError state={state} />
      <ChoiceChips
        legend="What needs fixing?"
        name="field"
        required
        options={CORRECTION_FIELDS.map((f) => ({ value: f, label: CORRECTION_LABELS[f] }))}
        defaultValue={v.field}
        error={e.field}
      />
      <TextareaField
        label="What should it say?"
        name="details"
        required
        rows={5}
        defaultValue={v.details}
        description="If you have a source, like the official website, include the link."
        error={e.details}
      />
      <TextField
        label="Your email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={v.email}
        description={EMAIL_HELP}
        error={e.email}
      />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className={`justify-self-start ${goal(GOALS.correctionSent)}`}
      >
        {pending ? "Sending" : "Send the correction"}
      </Button>
    </form>
  );
}
