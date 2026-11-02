import Script from "next/script";
import { env } from "@/lib/env";

/**
 * Plausible page views, outbound clicks, and tagged goals. Cookieless and
 * without personal data; nothing loads unless PLAUSIBLE_DOMAIN is set.
 * Goals are CSS classes (see `goal()` in src/lib/analytics.ts).
 */
export function Analytics() {
  const { PLAUSIBLE_DOMAIN, PLAUSIBLE_SCRIPT_SRC } = env();
  if (!PLAUSIBLE_DOMAIN) return null;
  return (
    <>
      <Script
        id="plausible-queue"
        strategy="afterInteractive"
      >{`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}</Script>
      <Script
        src={PLAUSIBLE_SCRIPT_SRC}
        data-domain={PLAUSIBLE_DOMAIN}
        strategy="afterInteractive"
      />
    </>
  );
}
