import "server-only";
import type { EmailConfig } from "next-auth/providers";
import { emailHtml, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

type Params = Parameters<EmailConfig["sendVerificationRequest"]>[0];

export async function sendMagicLink({ identifier, url }: Params): Promise<void> {
  const { RESEND_API_KEY, NODE_ENV, EMAIL_LOG_ONLY } = env();
  if (!RESEND_API_KEY && NODE_ENV === "production" && !EMAIL_LOG_ONLY) {
    throw new Error("Email sign-in is not configured: RESEND_API_KEY is missing");
  }
  await sendEmail({
    to: identifier,
    subject: "Your CityRoots sign-in link",
    text: `Sign in to CityRoots\n\nUse this link to sign in. It works once and expires in 24 hours.\n\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
    html: emailHtml(
      "Sign in to CityRoots",
      [
        "Use this button to sign in. It works once and expires in 24 hours.",
        "If you did not ask for this, you can ignore this email.",
      ],
      { href: url, label: "Sign in" },
    ),
  });
}

export function emailSignInAvailable(): boolean {
  const { RESEND_API_KEY, NODE_ENV, EMAIL_LOG_ONLY } = env();
  return Boolean(RESEND_API_KEY) || EMAIL_LOG_ONLY || NODE_ENV !== "production";
}
