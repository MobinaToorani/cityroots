import "server-only";
import type { EmailConfig } from "next-auth/providers";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type Params = Parameters<EmailConfig["sendVerificationRequest"]>[0];

function emailBody(url: string): { text: string; html: string } {
  const text = `Sign in to CityRoots\n\nUse this link to sign in. It works once and expires in 24 hours.\n\n${url}\n\nIf you did not ask for this, you can ignore this email.`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#141412;background:#F4F2ED;padding:32px">
<table role="presentation" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px">
<tr><td><h1 style="font-size:22px;margin:0 0 12px">Sign in to CityRoots</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">Use this button to sign in. It works once and expires in 24 hours.</p>
<p><a href="${url}" style="display:inline-block;background:#1E4D36;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Sign in</a></p>
<p style="font-size:13px;color:#6B675F;margin-top:24px">If you did not ask for this, you can ignore this email.</p>
</td></tr></table></body></html>`;
  return { text, html };
}

/**
 * Sends the magic link through Resend. Without an API key outside production,
 * the link is written to the server log so local sign-in still works.
 */
export async function sendMagicLink({ identifier, url }: Params): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM, NODE_ENV, EMAIL_LOG_ONLY } = env();
  if (!RESEND_API_KEY || EMAIL_LOG_ONLY) {
    if (NODE_ENV === "production" && !EMAIL_LOG_ONLY) {
      throw new Error("Email sign-in is not configured: RESEND_API_KEY is missing");
    }
    logger.info("Magic link (email delivery not configured)", { to: identifier, url });
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: identifier,
      subject: "Your CityRoots sign-in link",
      ...emailBody(url),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    logger.error("Resend rejected the sign-in email", { status: res.status, detail });
    throw new Error("Could not send the sign-in email");
  }
}

export function emailSignInAvailable(): boolean {
  const { RESEND_API_KEY, NODE_ENV, EMAIL_LOG_ONLY } = env();
  return Boolean(RESEND_API_KEY) || EMAIL_LOG_ONLY || NODE_ENV !== "production";
}
