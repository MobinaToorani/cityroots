"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toaster";
import { logger } from "@/lib/logger";

/** The phone's own share sheet where there is one, otherwise copies the link. */
export function ShareButton({
  title,
  label = "Share",
  path,
}: {
  title: string;
  label?: string;
  /** What to share, when it is not the page this button is on. */
  path?: string;
}) {
  async function onClick() {
    const url = path ? new URL(path, window.location.origin).href : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // Closing the share sheet counts as an error; anything else is worth knowing.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          logger.warn("Share failed", { error });
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch (error) {
      logger.warn("Copy failed", { error });
      toast("Could not copy the link");
    }
  }
  return (
    <Button type="button" variant="secondary" onClick={() => void onClick()}>
      <Icon icon={Share2} size={16} />
      {label}
    </Button>
  );
}
