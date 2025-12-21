import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@pedroadao.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("socialMedia procedures", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);
  const testDate = "2025-12-20";

  // Clean up test data before running tests
  beforeAll(async () => {
    try {
      await caller.socialMedia.delete({ date: testDate });
    } catch (error) {
      // Ignore if record doesn't exist
    }
  });

  it("should upsert social media followers successfully", async () => {
    const result = await caller.socialMedia.upsert({
      date: testDate,
      facebookFollowers: 10000,
      instagramFollowers: 15000,
      youtubeFollowers: 5000,
      comment: "Test entry",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list social media followers", async () => {
    const records = await caller.socialMedia.list();

    expect(Array.isArray(records)).toBe(true);
    
    // Find our test record
    const testRecord = records.find(r => r.date === testDate);
    expect(testRecord).toBeDefined();
    expect(testRecord?.facebookFollowers).toBe(10000);
    expect(testRecord?.instagramFollowers).toBe(15000);
    expect(testRecord?.youtubeFollowers).toBe(5000);
    expect(testRecord?.comment).toBe("Test entry");
  });

  it("should update existing record when upserting same date", async () => {
    // Update the same date with different values
    await caller.socialMedia.upsert({
      date: testDate,
      facebookFollowers: 12000,
      instagramFollowers: 18000,
      youtubeFollowers: 6000,
      comment: "Updated entry",
    });

    const records = await caller.socialMedia.list();
    const testRecord = records.find(r => r.date === testDate);
    
    expect(testRecord?.facebookFollowers).toBe(12000);
    expect(testRecord?.instagramFollowers).toBe(18000);
    expect(testRecord?.youtubeFollowers).toBe(6000);
    expect(testRecord?.comment).toBe("Updated entry");
  });

  it("should delete social media followers record", async () => {
    const result = await caller.socialMedia.delete({ date: testDate });
    expect(result).toEqual({ success: true });

    // Verify deletion
    const records = await caller.socialMedia.list();
    const testRecord = records.find(r => r.date === testDate);
    expect(testRecord).toBeUndefined();
  });

  it("should reject invalid date format", async () => {
    await expect(
      caller.socialMedia.upsert({
        date: "2025/12/20", // Invalid format
        facebookFollowers: 1000,
        instagramFollowers: 1000,
        youtubeFollowers: 1000,
      })
    ).rejects.toThrow();
  });

  it("should reject negative follower counts", async () => {
    await expect(
      caller.socialMedia.upsert({
        date: testDate,
        facebookFollowers: -100,
        instagramFollowers: 1000,
        youtubeFollowers: 1000,
      })
    ).rejects.toThrow();
  });
});
