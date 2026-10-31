import { createHash, randomBytes } from "node:crypto";

export const PARTNER_SCOPES = ["places:read", "events:read"] as const;
export type PartnerScope = (typeof PARTNER_SCOPES)[number];

export const SCOPE_LABELS: Record<PartnerScope, string> = {
  "places:read": "Places and cities",
  "events:read": "Events",
};

const KEY_PREFIX = "cr_live_";
const KEY_PATTERN = /^cr_live_[A-Za-z0-9_-]{32}$/;

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** A new partner key. Only the hash and a short prefix are ever stored. */
export function generateKey(): { key: string; prefix: string; hash: string } {
  const key = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, KEY_PREFIX.length + 4), hash: hashKey(key) };
}

/** The key from an `Authorization: Bearer ...` header, if it is well formed. */
export function keyFromAuthorization(header: string | null): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "");
  const key = match?.[1];
  return key && KEY_PATTERN.test(key) ? key : null;
}

export function isPartnerScope(value: string): value is PartnerScope {
  return (PARTNER_SCOPES as readonly string[]).includes(value);
}
