import { getDb } from "./db";
import { invites, type InsertInvite } from "../drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Generate a secure random token for invite
 */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new invite for an email
 * @param email Email to invite
 * @param createdBy Email of admin creating the invite
 * @param expiresInDays Number of days until invite expires (default: 7)
 */
export async function createInvite(
  email: string,
  createdBy: string,
  expiresInDays: number = 7
): Promise<{ token: string; inviteUrl: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const invite: InsertInvite = {
    email: email.toLowerCase(),
    token,
    createdBy: createdBy.toLowerCase(),
    expiresAt,
  };

  await db.insert(invites).values(invite);

  // Generate invite URL (will be opened in browser, then redirects to login)
  const inviteUrl = `${process.env.VITE_OAUTH_PORTAL_URL || "https://login.manus.im"}?invite=${token}`;

  console.log(`[Invites] Created invite for ${email} by ${createdBy}, expires ${expiresAt.toISOString()}`);

  return { token, inviteUrl };
}

/**
 * Get all invites (for admin UI)
 */
export async function getAllInvites() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(invites)
    .orderBy(desc(invites.createdAt));

  return result;
}

/**
 * Revoke an invite (mark as revoked)
 */
export async function revokeInvite(inviteId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(invites)
    .set({ revokedAt: new Date() })
    .where(eq(invites.id, inviteId));

  console.log(`[Invites] Revoked invite ID ${inviteId}`);
}

/**
 * Delete an invite permanently
 */
export async function deleteInvite(inviteId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(invites).where(eq(invites.id, inviteId));

  console.log(`[Invites] Deleted invite ID ${inviteId}`);
}

/**
 * Get invite by token (for validation during login)
 */
export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
