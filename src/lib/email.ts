import "server-only";
import { appendFile } from "node:fs/promises";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type Email = { to: string; subject: string; text: string; html: string };

export function emailDeliveryConfigured(): boolean {
  const { RESEND_API_KEY, EMAIL_LOG_ONLY } = env();
  return Boolean(RESEND_API_KEY) && !EMAIL_LOG_ONLY;
}

/**
 * Sends through Resend. Without delivery configured, the message is written to
 * the server log instead (development, CI, previews).
 */
export async function sendEmail(email: Email): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM, EMAIL_OUTBOX_FILE } = env();
  if (!emailDeliveryConfigured() || !RESEND_API_KEY) {
    logger.info("Email (delivery not configured)", {
      to: email.to,
      subject: email.subject,
      text: email.text,
    });
    if (EMAIL_OUTBOX_FILE) {
      await appendFile(
        EMAIL_OUTBOX_FILE,
        `${JSON.stringify({ to: email.to, text: email.text })}\n`,
      );
    }
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, ...email }),
  });
  if (!res.ok) {
    const detail = await res.text();
    logger.error("Resend rejected an email", {
      status: res.status,
      detail,
      subject: email.subject,
    });
    throw new Error("Could not send email");
  }
}

/** Minimal branded wrapper. Inline styles only, for email clients. */
export function emailHtml(
  title: string,
  paragraphs: string[],
  action?: { href: string; label: string },
) {
  const body = paragraphs
    .map((p) => `<p style="font-size:15px;line-height:1.6;margin:0 0 16px">${p}</p>`)
    .join("");
  const button = action
    ? `<p><a href="${action.href}" style="display:inline-block;background:#1E4D36;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${action.label}</a></p>`
    : "";
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#141412;background:#F4F2ED;padding:32px">
<table role="presentation" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px"><tr><td>
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>${body}${button}
<p style="font-size:13px;color:#5F5B54;margin-top:24px">CityRoots. Free things first, and nobody pays for placement.</p>
</td></tr></table></body></html>`;
}
