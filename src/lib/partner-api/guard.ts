import "server-only";
import { NextResponse } from "next/server";
import { authenticatePartner, type Partner } from "@/lib/data/partners";
import { features } from "@/lib/env";
import { ATTRIBUTION } from "@/lib/domain/partner-api";
import { keyFromAuthorization, type PartnerScope } from "@/lib/domain/partner-keys";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";

export function apiError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export function apiJson(body: Record<string, unknown>) {
  return NextResponse.json(
    { ...body, attribution: ATTRIBUTION },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}

/**
 * Wraps a partner API handler: feature flag, key, scope, then the per-key
 * rate limit. Keys go in `Authorization: Bearer cr_live_...`.
 */
export async function withPartner(
  request: Request,
  scope: PartnerScope | null,
  handle: (partner: Partner, url: URL) => Promise<Response>,
): Promise<Response> {
  if (!features.partners()) return apiError(404, "not_found", "Not found");
  const key = keyFromAuthorization(request.headers.get("authorization"));
  if (!key) {
    return apiError(
      401,
      "missing_key",
      "Send your partner key as: Authorization: Bearer cr_live_...",
      {
        "WWW-Authenticate": 'Bearer realm="cityroots"',
      },
    );
  }
  let partner: Partner | null;
  try {
    partner = await authenticatePartner(key);
  } catch (error) {
    logger.error("Partner key check failed", { error });
    return apiError(503, "unavailable", "The API is unavailable. Try again shortly.");
  }
  if (!partner) return apiError(401, "invalid_key", "This key is not valid or has been revoked.");
  if (scope && !partner.scopes.includes(scope)) {
    return apiError(403, "missing_scope", `This key does not include the ${scope} scope.`);
  }
  const limit = await consumeRateLimit("partner", partner.keyId);
  if (!limit.allowed) {
    return apiError(429, "rate_limited", "Too many requests for this key. Slow down and retry.", {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }
  try {
    return await handle(partner, new URL(request.url));
  } catch (error) {
    logger.error("Partner API request failed", { error, path: new URL(request.url).pathname });
    return apiError(500, "server_error", "Something went wrong on our side.");
  }
}
