import { z } from "zod";
import { COST_BANDS } from "./cost";
import { cleanCopy } from "./copy";

export const RELATIONSHIPS = ["owner", "manager", "staff", "other"] as const;
export const RELATIONSHIP_LABELS: Record<(typeof RELATIONSHIPS)[number], string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  other: "Something else, like a volunteer coordinator",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v ? cleanCopy(v) : undefined))
    .optional();

const tri = z
  .enum(["yes", "no", ""])
  .optional()
  .transform((v) => (v === "yes" ? true : v === "no" ? false : undefined));

/** A claim as the form sends it. Every detail is optional; the curator checks each one. */
export const claimSchema = z.object({
  placeId: z.uuid("This place could not be found"),
  relationship: z.enum(RELATIONSHIPS, "Tell us how you are connected to this place"),
  hoursText: optionalText(200),
  costBand: z
    .union([z.enum(COST_BANDS), z.literal("")])
    .optional()
    .transform((v) => v || undefined),
  priceNote: optionalText(160),
  sourceUrl: z
    .union([
      z.literal(""),
      z
        .url("Use a full link starting with https://")
        .startsWith("https://", "Use a link starting with https://"),
    ])
    .optional()
    .transform((v) => v || undefined),
  stepFree: tri,
  accessibleWashroom: tri,
  parking: tri,
  transitNearby: tri,
  accessibilityNotes: optionalText(280),
  message: optionalText(1000),
});

export type ClaimInput = z.infer<typeof claimSchema>;

function registrableHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Whether an email address belongs to the domain of a website, including its
 * subdomains: jo@newmarketlibrary.ca matches https://www.newmarketlibrary.ca.
 * Free mail providers never match.
 */
export function emailMatchesWebsite(email: string, website: string | null): boolean {
  if (!website) return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain || FREE_MAIL.has(domain)) return false;
  let host: string;
  try {
    host = registrableHost(new URL(website).hostname);
  } catch {
    return false;
  }
  return domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`);
}

const FREE_MAIL = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "yahoo.ca",
  "icloud.com",
  "live.com",
  "proton.me",
  "protonmail.com",
  "rogers.com",
  "bell.net",
  "sympatico.ca",
  "aol.com",
]);
