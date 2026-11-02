"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { logger } from "@/lib/logger";

export type SignInState = { status: "idle" } | { status: "error"; message: string; email: string };

const emailSchema = z.object({
  email: z.email("Enter an email address like name@example.com").trim().toLowerCase(),
  callbackUrl: z.string().optional(),
});

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your email",
      email,
    };
  }
  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirectTo: safeRedirectPath(parsed.data.callbackUrl),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      logger.error("Email sign-in failed", { error, type: error.type });
      return {
        status: "error",
        message: "We could not send the link right now. Try again in a minute.",
        email,
      };
    }
    throw error;
  }
  redirect("/signin/check-email");
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: safeRedirectPath(formData.get("callbackUrl")) });
}
