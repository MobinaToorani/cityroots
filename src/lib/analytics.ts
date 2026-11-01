/**
 * Analytics goals. Names are fixed here so the Plausible dashboard and the
 * code agree. Never pass personal data (emails, names, free text) as props.
 */
export const GOALS = {
  suggestionSent: "Suggestion sent",
  correctionSent: "Correction sent",
  claimSent: "Claim sent",
  checkoutStarted: "Checkout started",
  planSaved: "Plan saved",
  placeSaved: "Place saved",
  partnerContact: "Partner contact",
} as const;

type Goal = (typeof GOALS)[keyof typeof GOALS];

/** Class for a button, link, or form that counts as a goal when used (Plausible tagged events). */
export function goal(name: Goal): string {
  return `plausible-event-name=${name.replaceAll(" ", "+")}`;
}

type Plausible = (event: string, options?: { props?: Record<string, string> }) => void;

/** For goals that happen in client code rather than on a click. No-op without the script. */
export function track(name: Goal, props?: Record<string, string>): void {
  const plausible = (globalThis as { plausible?: Plausible }).plausible;
  plausible?.(name, props ? { props } : undefined);
}
