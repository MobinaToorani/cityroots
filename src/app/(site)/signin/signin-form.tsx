"use client";

import { useActionState } from "react";
import { signInWithEmail, type SignInState } from "./actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithEmail, {
    status: "idle",
  });
  return (
    <form action={action} noValidate className="grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.status === "error" ? state.email : undefined}
        description="We will email you a one-time sign-in link. No password needed."
        error={state.status === "error" ? state.message : undefined}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending your link" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
