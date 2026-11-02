"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { createCollectionAction, type CreateCollectionState } from "./actions";

const initial: CreateCollectionState = { status: "idle" };

/** Names a new collection. With a place id, the place is saved into it straight away. */
export function CreateCollectionForm({
  placeId,
  returnTo,
}: {
  placeId?: string;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(createCollectionAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
      {placeId && <input type="hidden" name="placeId" value={placeId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <TextField
        name="title"
        label="New collection name"
        description="Like Rainy days, or Visiting with the kids"
        maxLength={80}
        required
        defaultValue={state.title}
        error={state.status === "error" ? state.message : undefined}
      />
      <Button type="submit" size="lg" className="h-14" disabled={pending}>
        <Icon icon={Plus} size={16} />
        Create collection
      </Button>
    </form>
  );
}
