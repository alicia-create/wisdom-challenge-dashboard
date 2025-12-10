import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Create mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@pedroadao.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Ads Diary - Edit Functionality", () => {
  it("should create and update diary action via tRPC", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create action
    const created = await caller.diary.createAction({
      category: "Ad Change",
      description: "Original description",
      adName: "Original Ad Name",
      campaignName: "Original Campaign Name",
      adId: "123456",
      campaignId: "789012",
    });

    console.log("Created action:", created);
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.description).toBe("Original description");

    // Update action
    const updated = await caller.diary.updateAction({
      actionId: created.id,
      description: "Updated description",
      adName: "New Ad Name",
      campaignName: "New Campaign Name",
    });

    expect(updated).toBeDefined();
    expect(updated.description).toBe("Updated description");
    expect(updated.adName).toBe("New Ad Name");
    expect(updated.campaignName).toBe("New Campaign Name");
    expect(updated.category).toBe("Ad Change"); // Unchanged
  });

  it("should update only specified fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create action
    const created = await caller.diary.createAction({
      category: "Budget Adjustment",
      description: "Original budget description",
      adName: "Test Ad",
      campaignName: "Test Campaign",
    });

    // Update only description
    const updated = await caller.diary.updateAction({
      actionId: created.id,
      description: "New budget description",
    });

    expect(updated.description).toBe("New budget description");
    expect(updated.category).toBe("Budget Adjustment"); // Unchanged
    expect(updated.adName).toBe("Test Ad"); // Unchanged
    expect(updated.campaignName).toBe("Test Campaign"); // Unchanged
  });

  it("should update category and preserve other fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create action
    const created = await caller.diary.createAction({
      category: "Ad Change",
      description: "Test description",
      adName: "Test Ad",
    });

    // Update only category
    const updated = await caller.diary.updateAction({
      actionId: created.id,
      category: "Creative Swap",
    });

    expect(updated.category).toBe("Creative Swap");
    expect(updated.description).toBe("Test description"); // Unchanged
    expect(updated.adName).toBe("Test Ad"); // Unchanged
  });

  it("should update ad_name and campaign_name fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create action
    const created = await caller.diary.createAction({
      category: "Ad Change",
      description: "Test",
    });

    // Update names
    const updated = await caller.diary.updateAction({
      actionId: created.id,
      adName: "31DWC - VSL - Warm Audience",
      campaignName: "31DWC2026 - Optin - Cold",
    });

    expect(updated.adName).toBe("31DWC - VSL - Warm Audience");
    expect(updated.campaignName).toBe("31DWC2026 - Optin - Cold");
  });

  it("should throw error when updating non-existent action", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.diary.updateAction({
        actionId: 999999,
        description: "This should fail",
      })
    ).rejects.toThrow("Action not found");
  });
});
