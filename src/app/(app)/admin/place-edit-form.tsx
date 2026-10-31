"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { CATEGORIES } from "@/lib/domain/categories";
import { COST_BANDS, COST_LABELS } from "@/lib/domain/cost";
import type { EditState } from "./actions";

const KINDS = [
  { value: "place", label: "Place" },
  { value: "event", label: "Event" },
  { value: "program", label: "Program" },
  { value: "resource", label: "Resource" },
];

type Action = (prev: EditState, formData: FormData) => Promise<EditState>;

export type PlaceDefaults = Partial<Record<string, string>>;

/**
 * The place as it will be published. Used to publish a suggestion and to
 * apply a correction; `mode` decides the buttons.
 */
export function PlaceEditForm({
  action,
  submissionId,
  defaults,
  cities,
  mode,
}: {
  action: Action;
  submissionId: string;
  defaults: PlaceDefaults;
  cities: readonly { slug: string; name: string }[];
  mode: "publish" | "correct";
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const v = { ...defaults, ...state.values };
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-2xl px-4 py-3 text-body font-semibold text-danger glass-strong"
        >
          {state.message}
        </p>
      )}
      <TextField
        name="name"
        label="Name"
        required
        maxLength={120}
        defaultValue={v.name}
        error={e.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="citySlug"
          label="City"
          required
          defaultValue={v.citySlug ?? ""}
          placeholder="Choose a city"
          options={cities.map((c) => ({ value: c.slug, label: c.name }))}
          error={e.citySlug}
        />
        <SelectField
          name="category"
          label="Category"
          required
          defaultValue={v.category ?? ""}
          placeholder="Choose a category"
          options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          error={e.category}
        />
        <SelectField
          name="kind"
          label="Kind"
          required
          defaultValue={v.kind ?? "place"}
          options={KINDS}
          error={e.kind}
        />
        <SelectField
          name="costBand"
          label="Cost"
          required
          defaultValue={v.costBand ?? ""}
          placeholder="Choose a cost band"
          options={COST_BANDS.map((b) => ({ value: b, label: COST_LABELS[b] }))}
          error={e.costBand}
        />
      </div>
      <TextField
        name="priceNote"
        label="Prices"
        maxLength={160}
        defaultValue={v.priceNote}
        error={e.priceNote}
      />
      <TextField
        name="summary"
        label="Summary"
        description="One line for cards. Left empty, the first sentence of the description is used."
        maxLength={200}
        defaultValue={v.summary}
        error={e.summary}
      />
      <TextareaField
        name="description"
        label="Description"
        required
        rows={5}
        maxLength={2000}
        defaultValue={v.description}
        error={e.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="neighborhood"
          label="Neighborhood"
          maxLength={120}
          defaultValue={v.neighborhood}
          error={e.neighborhood}
        />
        <TextField
          name="address"
          label="Address"
          maxLength={200}
          defaultValue={v.address}
          error={e.address}
        />
      </div>
      <TextField
        name="hoursText"
        label="Hours"
        description="Like: Mon to Fri 9am to 5pm. Written this way, open-now works."
        maxLength={200}
        defaultValue={v.hoursText}
        error={e.hoursText}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="sourceUrl"
          type="url"
          label="Website"
          maxLength={300}
          defaultValue={v.sourceUrl}
          error={e.sourceUrl}
        />
        <TextField
          name="phone"
          type="tel"
          label="Phone"
          maxLength={40}
          defaultValue={v.phone}
          error={e.phone}
        />
        <TextField
          name="lat"
          inputMode="decimal"
          label="Latitude"
          defaultValue={v.lat}
          error={e.lat}
        />
        <TextField
          name="lng"
          inputMode="decimal"
          label="Longitude"
          defaultValue={v.lng}
          error={e.lng}
        />
      </div>
      <TextareaField
        name="notes"
        label="Note to the contributor"
        description="Included in the email they get, if they left an address."
        rows={2}
        maxLength={1000}
        defaultValue={v.notes}
        error={e.notes}
      />
      <div className="flex flex-wrap gap-3">
        {mode === "publish" ? (
          <Button type="submit" disabled={pending}>
            Publish this place
          </Button>
        ) : (
          <>
            <Button type="submit" name="intent" value="apply" disabled={pending}>
              Save changes to the listing
            </Button>
            <Button
              type="submit"
              name="intent"
              value="dismiss"
              variant="secondary"
              disabled={pending}
            >
              Mark done without changes
            </Button>
            <Button
              type="submit"
              name="intent"
              value="close"
              variant="secondary"
              disabled={pending}
            >
              Take the listing down
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
