import "server-only";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { partnerKeys } from "@/lib/db/schema";
import { generateKey, hashKey, isPartnerScope, type PartnerScope } from "@/lib/domain/partner-keys";
import { DataError } from "@/lib/errors";

export type PartnerKeyRow = {
  id: string;
  orgName: string;
  contactEmail: string | null;
  keyPrefix: string;
  scopes: PartnerScope[];
  active: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export type Partner = { keyId: string; orgName: string; scopes: PartnerScope[] };

function scopesOf(raw: string[]): PartnerScope[] {
  return raw.filter(isPartnerScope);
}

export async function listPartnerKeys(): Promise<PartnerKeyRow[]> {
  try {
    const rows = await db()
      .select({
        id: partnerKeys.id,
        orgName: partnerKeys.orgName,
        contactEmail: partnerKeys.contactEmail,
        keyPrefix: partnerKeys.keyPrefix,
        scopes: partnerKeys.scopes,
        active: partnerKeys.active,
        lastUsedAt: partnerKeys.lastUsedAt,
        createdAt: partnerKeys.createdAt,
      })
      .from(partnerKeys)
      .orderBy(desc(partnerKeys.active), desc(partnerKeys.createdAt));
    return rows.map((r) => ({ ...r, scopes: scopesOf(r.scopes) }));
  } catch (cause) {
    throw new DataError("Could not list partner keys", { cause });
  }
}

/** Issues a key. The returned key is the only copy; it cannot be shown again. */
export async function issuePartnerKey(input: {
  orgName: string;
  contactEmail: string | null;
  scopes: PartnerScope[];
  createdBy: string;
}): Promise<{ id: string; key: string }> {
  const { key, prefix, hash } = generateKey();
  try {
    const [row] = await db()
      .insert(partnerKeys)
      .values({ ...input, keyPrefix: prefix, keyHash: hash })
      .returning({ id: partnerKeys.id });
    if (!row) throw new Error("Insert returned no row");
    return { id: row.id, key };
  } catch (cause) {
    throw new DataError("Could not issue a partner key", { cause });
  }
}

export async function revokePartnerKey(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  try {
    const rows = await db()
      .update(partnerKeys)
      .set({ active: false, revokedAt: new Date() })
      .where(and(eq(partnerKeys.id, id), eq(partnerKeys.active, true)))
      .returning({ id: partnerKeys.id });
    return rows.length > 0;
  } catch (cause) {
    throw new DataError("Could not revoke the key", { cause });
  }
}

const TOUCH_EVERY_MS = 5 * 60_000;

/** The partner behind an active key, or null. Records use at most every five minutes. */
export async function authenticatePartner(key: string): Promise<Partner | null> {
  try {
    const [row] = await db()
      .select({ id: partnerKeys.id, orgName: partnerKeys.orgName, scopes: partnerKeys.scopes })
      .from(partnerKeys)
      .where(and(eq(partnerKeys.keyHash, hashKey(key)), eq(partnerKeys.active, true)));
    if (!row) return null;
    const now = new Date();
    await db()
      .update(partnerKeys)
      .set({ lastUsedAt: now })
      .where(
        and(
          eq(partnerKeys.id, row.id),
          or(
            isNull(partnerKeys.lastUsedAt),
            lt(partnerKeys.lastUsedAt, new Date(now.getTime() - TOUCH_EVERY_MS)),
          ),
        ),
      );
    return { keyId: row.id, orgName: row.orgName, scopes: scopesOf(row.scopes) };
  } catch (cause) {
    throw new DataError("Could not check the partner key", { cause });
  }
}
