import { describe, expect, it, beforeEach } from "vitest";
import { isWhitelistedDomain, hasValidInvite, hasAccess } from "./auth-guard";
import { createInvite, getAllInvites, revokeInvite } from "./invites";
import { getDb } from "./db";
import { invites } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Authentication & Invites", () => {
  describe("Domain Whitelist", () => {
    it("allows @pedroadao.com emails", () => {
      expect(isWhitelistedDomain("user@pedroadao.com")).toBe(true);
      expect(isWhitelistedDomain("admin@pedroadao.com")).toBe(true);
      expect(isWhitelistedDomain("test.user@pedroadao.com")).toBe(true);
    });

    it("blocks non-whitelisted domains", () => {
      expect(isWhitelistedDomain("user@gmail.com")).toBe(false);
      expect(isWhitelistedDomain("admin@example.com")).toBe(false);
      expect(isWhitelistedDomain("test@yahoo.com")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(isWhitelistedDomain("User@PedroAdao.COM")).toBe(true);
      expect(isWhitelistedDomain("ADMIN@PEDROADAO.COM")).toBe(true);
    });

    it("handles invalid emails", () => {
      expect(isWhitelistedDomain("")).toBe(false);
      expect(isWhitelistedDomain("not-an-email")).toBe(false);
      expect(isWhitelistedDomain("@pedroadao.com")).toBe(false);
    });
  });

  describe("Invite System", () => {
    const testEmail = "test@example.com";
    const createdBy = "admin@pedroadao.com";

    beforeEach(async () => {
      // Clean up test invites
      const db = await getDb();
      if (db) {
        await db.delete(invites).where(eq(invites.email, testEmail.toLowerCase()));
      }
    });

    it("creates invite with valid token and URL", async () => {
      const result = await createInvite(testEmail, createdBy, 7);

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes hex = 64 chars
      expect(result.inviteUrl).toContain("invite=");
      expect(result.inviteUrl).toContain(result.token);
    });

    it("stores invite in database", async () => {
      await createInvite(testEmail, createdBy, 7);

      const allInvites = await getAllInvites();
      const testInvite = allInvites.find((inv) => inv.email === testEmail.toLowerCase());

      expect(testInvite).toBeDefined();
      expect(testInvite?.email).toBe(testEmail.toLowerCase());
      expect(testInvite?.createdBy).toBe(createdBy.toLowerCase());
      expect(testInvite?.usedAt).toBeNull();
      expect(testInvite?.revokedAt).toBeNull();
    });

    it("validates active invites", async () => {
      await createInvite(testEmail, createdBy, 7);

      const hasInvite = await hasValidInvite(testEmail);
      expect(hasInvite).toBe(true);
    });

    it("rejects used invites", async () => {
      const { token } = await createInvite(testEmail, createdBy, 7);

      // Mark as used
      const db = await getDb();
      if (db) {
        await db
          .update(invites)
          .set({ usedAt: new Date() })
          .where(eq(invites.token, token));
      }

      const hasInvite = await hasValidInvite(testEmail);
      expect(hasInvite).toBe(false);
    });

    it("rejects revoked invites", async () => {
      await createInvite(testEmail, createdBy, 7);

      const allInvites = await getAllInvites();
      const testInvite = allInvites.find((inv) => inv.email === testEmail.toLowerCase());

      if (testInvite) {
        await revokeInvite(testInvite.id);
      }

      const hasInvite = await hasValidInvite(testEmail);
      expect(hasInvite).toBe(false);
    });

    it("rejects expired invites", async () => {
      // Create invite that expires immediately
      const { token } = await createInvite(testEmail, createdBy, 0);

      // Set expiration to past
      const db = await getDb();
      if (db) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        
        await db
          .update(invites)
          .set({ expiresAt: pastDate })
          .where(eq(invites.token, token));
      }

      const hasInvite = await hasValidInvite(testEmail);
      expect(hasInvite).toBe(false);
    });
  });

  describe("Access Control", () => {
    it("grants access to whitelisted domains", async () => {
      const allowed = await hasAccess("user@pedroadao.com");
      expect(allowed).toBe(true);
    });

    it("grants access to invited users", async () => {
      const testEmail = "invited@example.com";
      const createdBy = "admin@pedroadao.com";

      // Clean up first
      const db = await getDb();
      if (db) {
        await db.delete(invites).where(eq(invites.email, testEmail.toLowerCase()));
      }

      // Create invite
      await createInvite(testEmail, createdBy, 7);

      const allowed = await hasAccess(testEmail);
      expect(allowed).toBe(true);
    });

    it("denies access to non-whitelisted users without invites", async () => {
      const allowed = await hasAccess("random@example.com");
      expect(allowed).toBe(false);
    });
  });
});
