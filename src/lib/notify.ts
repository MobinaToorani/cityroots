import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/** Posts a review notification to the curators' Slack channel, if configured. */
export async function notifyReviewers(text: string): Promise<void> {
  const url = env().SLACK_WEBHOOK_URL;
  if (!url) {
    logger.info("Review notification (Slack not configured)", { text });
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    logger.error("Slack webhook failed", { status: res.status, detail: await res.text() });
  }
}
