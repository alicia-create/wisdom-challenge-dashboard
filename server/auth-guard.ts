import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { invites } from "../drizzle/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

/**
 * Domain whitelist - emails from these domains have automatic access
 */
const WHITELISTED_DOMAINS = ["pedroadao.com"];

/**
 * Check if email domain is whitelisted
 */
export function isWhitelistedDomain(email: string): boolean {
  if (!email) return false;
  
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0]) return false; // Must have username@domain
  
  const domain = parts[1]?.toLowerCase();
  if (!domain) return false;
  
  return WHITELISTED_DOMAINS.includes(domain);
}

/**
 * Check if email has a valid invite
 * Valid = not used, not revoked, not expired
 */
export async function hasValidInvite(email: string): Promise<boolean> {
  if (!email) return false;

  const db = await getDb();
  if (!db) {
    console.warn("[Auth Guard] Database not available");
    return false;
  }

  try {
    const result = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.email, email.toLowerCase()),
          isNull(invites.usedAt),
          isNull(invites.revokedAt),
          gt(invites.expiresAt, new Date())
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Auth Guard] Error checking invite:", error);
    return false;
  }
}

/**
 * Mark invite as used
 */
export async function markInviteAsUsed(email: string): Promise<void> {
  if (!email) return;

  const db = await getDb();
  if (!db) {
    console.warn("[Auth Guard] Database not available");
    return;
  }

  try {
    await db
      .update(invites)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(invites.email, email.toLowerCase()),
          isNull(invites.usedAt),
          isNull(invites.revokedAt)
        )
      );
    
    console.log(`[Auth Guard] Marked invite as used for ${email}`);
  } catch (error) {
    console.error("[Auth Guard] Error marking invite as used:", error);
  }
}

/**
 * Check if user has access (whitelisted domain OR valid invite)
 */
export async function hasAccess(email: string): Promise<boolean> {
  if (!email) return false;

  // Check whitelist first (faster)
  if (isWhitelistedDomain(email)) {
    console.log(`[Auth Guard] ${email} allowed via domain whitelist`);
    return true;
  }

  // Check invite
  const hasInvite = await hasValidInvite(email);
  if (hasInvite) {
    console.log(`[Auth Guard] ${email} allowed via valid invite`);
    // Mark invite as used on first successful login
    await markInviteAsUsed(email);
    return true;
  }

  console.log(`[Auth Guard] ${email} denied - no whitelist or valid invite`);
  return false;
}

/**
 * Throw TRPC error if user doesn't have access
 */
export async function requireAccess(email: string | null | undefined): Promise<void> {
  if (!email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required. Please sign in with Google.",
    });
  }

  const allowed = await hasAccess(email);
  
  if (!allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Only @pedroadao.com emails or invited users can access this dashboard. Contact the administrator for an invite.",
    });
  }
}
