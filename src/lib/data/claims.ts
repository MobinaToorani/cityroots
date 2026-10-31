import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  cities,
  claims,
  places,
  users,
  type ClaimProposal,
  type PlaceAccessibility,
} from "@/lib/db/schema";
import type { ClaimInput } from "@/lib/domain/claim";
import { DataError } from "@/lib/errors";
import { hoursFromText } from "./review";

// Ranking integrity: approving a claim changes listing facts only. It never
// touches Pick status or the verification date, both of which feed ranking.

export type ClaimStatus = "pending" | "verified" | "rejected";

export type ClaimTarget = {
  id: string;
  name: string;
  cityName: string;
  sourceUrl: string | null;
  claimed: boolean;
};

export type ClaimRow = {
  id: string;
  status: ClaimStatus;
  relationship: string;
  proposal: ClaimProposal;
  domainMatch: boolean;
  reviewNotes: string | null;
  createdAt: Date;
  placeId: string;
  placeName: string;
  cityName: string;
  claimantId: string;
  claimantEmail: string;
};

const UUID = /^[0-9a-f-]{36}$/i;

function wrap<T>(what: string, run: () => Promise<T>): Promise<T> {
  return run().catch((cause: unknown) => {
    throw new DataError(`Could not ${what}`, { cause });
  });
}

export async function getClaimTarget(placeId: string): Promise<ClaimTarget | null> {
  if (!UUID.test(placeId)) return null;
  const [row] = await wrap("load the place", () =>
    db()
      .select({
        id: places.id,
        name: places.name,
        cityName: cities.name,
        sourceUrl: places.sourceUrl,
        claimedBy: places.claimedBy,
      })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .where(and(eq(places.id, placeId), eq(places.status, "published"))),
  );
  if (!row) return null;
  const { claimedBy, ...rest } = row;
  return { ...rest, claimed: Boolean(claimedBy) };
}

export async function hasPendingClaim(userId: string, placeId: string): Promise<boolean> {
  const [row] = await wrap("check claims", () =>
    db()
      .select({ id: claims.id })
      .from(claims)
      .where(
        and(eq(claims.userId, userId), eq(claims.placeId, placeId), eq(claims.status, "pending")),
      ),
  );
  return Boolean(row);
}

function proposalFrom(input: ClaimInput): ClaimProposal {
  const accessibility: PlaceAccessibility = {};
  if (input.stepFree !== undefined) accessibility.stepFree = input.stepFree;
  if (input.accessibleWashroom !== undefined) {
    accessibility.accessibleWashroom = input.accessibleWashroom;
  }
  if (input.parking !== undefined) accessibility.parking = input.parking;
  if (input.transitNearby !== undefined) accessibility.transitNearby = input.transitNearby;
  if (input.accessibilityNotes) accessibility.notes = input.accessibilityNotes;
  const proposal: ClaimProposal = {};
  if (input.hoursText) proposal.hoursText = input.hoursText;
  if (input.costBand) proposal.costBand = input.costBand;
  if (input.priceNote) proposal.priceNote = input.priceNote;
  if (input.sourceUrl) proposal.sourceUrl = input.sourceUrl;
  if (Object.keys(accessibility).length > 0) proposal.accessibility = accessibility;
  if (input.message) proposal.message = input.message;
  return proposal;
}

export async function createClaim(
  userId: string,
  input: ClaimInput,
  domainMatch: boolean,
): Promise<{ id: string }> {
  return wrap("save the claim", async () => {
    const [row] = await db()
      .insert(claims)
      .values({
        placeId: input.placeId,
        userId,
        relationship: input.relationship,
        proposal: proposalFrom(input),
        domainMatch,
      })
      .returning({ id: claims.id });
    if (!row) throw new Error("Insert returned no row");
    return row;
  });
}

const claimColumns = {
  id: claims.id,
  status: claims.status,
  relationship: claims.relationship,
  proposal: claims.proposal,
  domainMatch: claims.domainMatch,
  reviewNotes: claims.reviewNotes,
  createdAt: claims.createdAt,
  placeId: places.id,
  placeName: places.name,
  cityName: cities.name,
  claimantId: users.id,
  claimantEmail: users.email,
};

export function listClaims(status: ClaimStatus, limit = 100): Promise<ClaimRow[]> {
  return wrap("list claims", () =>
    db()
      .select(claimColumns)
      .from(claims)
      .innerJoin(places, eq(places.id, claims.placeId))
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(users, eq(users.id, claims.userId))
      .where(eq(claims.status, status))
      .orderBy(status === "pending" ? claims.createdAt : desc(claims.updatedAt))
      .limit(limit),
  );
}

export async function getClaim(id: string): Promise<ClaimRow | null> {
  if (!UUID.test(id)) return null;
  const [row] = await wrap("load the claim", () =>
    db()
      .select(claimColumns)
      .from(claims)
      .innerJoin(places, eq(places.id, claims.placeId))
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(users, eq(users.id, claims.userId))
      .where(eq(claims.id, id)),
  );
  return row ?? null;
}

export async function pendingClaimCount(): Promise<number> {
  const [row] = await wrap("count claims", () =>
    db().select({ n: count() }).from(claims).where(eq(claims.status, "pending")),
  );
  return row?.n ?? 0;
}

export type ClaimField = "hoursText" | "costBand" | "priceNote" | "sourceUrl" | "accessibility";

/**
 * Verifies a claim: links the place to the claimant and applies only the
 * proposed fields the curator ticked.
 */
export async function approveClaim(input: {
  claimId: string;
  reviewerId: string;
  apply: readonly ClaimField[];
  notes: string | null;
}): Promise<{ placeId: string; claimantEmail: string; placeName: string } | null> {
  return wrap("approve the claim", () =>
    db().transaction(async (tx) => {
      const [claim] = await tx
        .select({
          placeId: claims.placeId,
          userId: claims.userId,
          proposal: claims.proposal,
          status: claims.status,
        })
        .from(claims)
        .where(eq(claims.id, input.claimId));
      if (!claim || claim.status !== "pending") return null;
      const p = claim.proposal;
      const patch: Partial<typeof places.$inferInsert> = { claimedBy: claim.userId };
      const verified: Record<string, unknown> = {};
      for (const field of input.apply) {
        if (field === "hoursText" && p.hoursText) {
          patch.hours = hoursFromText(p.hoursText);
          verified.hours = p.hoursText;
        } else if (field === "costBand" && p.costBand) {
          patch.costBand = p.costBand;
          verified.costBand = p.costBand;
        } else if (field === "priceNote" && p.priceNote) {
          patch.priceNote = p.priceNote;
          verified.priceNote = p.priceNote;
        } else if (field === "sourceUrl" && p.sourceUrl) {
          patch.sourceUrl = p.sourceUrl;
          verified.sourceUrl = p.sourceUrl;
        } else if (field === "accessibility" && p.accessibility) {
          patch.accessibility = p.accessibility;
          verified.accessibility = p.accessibility;
        }
      }
      await tx.update(places).set(patch).where(eq(places.id, claim.placeId));
      await tx
        .update(claims)
        .set({
          status: "verified",
          reviewerId: input.reviewerId,
          reviewNotes: input.notes,
          verifiedFields: verified,
        })
        .where(eq(claims.id, input.claimId));
      const [info] = await tx
        .select({ email: users.email, placeName: places.name })
        .from(users)
        .innerJoin(places, eq(places.id, claim.placeId))
        .where(eq(users.id, claim.userId));
      return {
        placeId: claim.placeId,
        claimantEmail: info?.email ?? "",
        placeName: info?.placeName ?? "",
      };
    }),
  );
}

export async function rejectClaim(
  claimId: string,
  reviewerId: string,
  notes: string | null,
): Promise<boolean> {
  const rows = await wrap("reject the claim", () =>
    db()
      .update(claims)
      .set({ status: "rejected", reviewerId, reviewNotes: notes })
      .where(and(eq(claims.id, claimId), eq(claims.status, "pending")))
      .returning({ id: claims.id }),
  );
  return rows.length > 0;
}
