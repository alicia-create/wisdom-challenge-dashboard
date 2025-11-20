import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("engagement.metrics", () => {
  it("returns engagement metrics with correct structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.metrics({
      dateRange: "30 DAYS",
    });

    expect(result).toHaveProperty("todayAttendance");
    expect(result).toHaveProperty("totalAttendance");
    expect(result).toHaveProperty("attendanceByDay");
    expect(typeof result.todayAttendance).toBe("number");
    expect(typeof result.totalAttendance).toBe("number");
    expect(Array.isArray(result.attendanceByDay)).toBe(true);
  });

  it("handles empty attendance data gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.metrics({
      dateRange: "TODAY",
    });

    expect(result.todayAttendance).toBeGreaterThanOrEqual(0);
    expect(result.totalAttendance).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.attendanceByDay)).toBe(true);
  });

  it("groups attendance by date and platform", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.metrics({
      dateRange: "30 DAYS",
    });

    // Each day should have freeCount and vipCount
    result.attendanceByDay.forEach((day: any) => {
      expect(day).toHaveProperty("date");
      expect(day).toHaveProperty("freeCount");
      expect(day).toHaveProperty("vipCount");
      expect(typeof day.freeCount).toBe("number");
      expect(typeof day.vipCount).toBe("number");
    });
  });
});

describe("engagement.highTicketSales", () => {
  it("returns high-ticket sales with correct structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.highTicketSales({
      dateRange: "30 DAYS",
    });

    expect(result).toHaveProperty("todayHtSales");
    expect(result).toHaveProperty("totalHtSales");
    expect(result).toHaveProperty("totalHtRevenue");
    expect(result).toHaveProperty("htSalesList");
    expect(typeof result.todayHtSales).toBe("number");
    expect(typeof result.totalHtSales).toBe("number");
    expect(typeof result.totalHtRevenue).toBe("number");
    expect(Array.isArray(result.htSalesList)).toBe(true);
  });

  it("handles empty HT sales data gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.highTicketSales({
      dateRange: "TODAY",
    });

    expect(result.todayHtSales).toBeGreaterThanOrEqual(0);
    expect(result.totalHtSales).toBeGreaterThanOrEqual(0);
    expect(result.totalHtRevenue).toBeGreaterThanOrEqual(0);
  });

  it("includes UTM attribution in HT sales list", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.highTicketSales({
      dateRange: "30 DAYS",
    });

    // If there are sales, they should have UTM fields
    if (result.htSalesList.length > 0) {
      const sale = result.htSalesList[0];
      expect(sale).toHaveProperty("customer_name");
      expect(sale).toHaveProperty("customer_email");
      expect(sale).toHaveProperty("product_name");
      expect(sale).toHaveProperty("price");
      expect(sale).toHaveProperty("purchase_date");
      expect(sale).toHaveProperty("utm_source");
      expect(sale).toHaveProperty("utm_campaign");
    }
  });
});

describe("engagement.fullFunnel", () => {
  it("returns full funnel metrics with correct structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.fullFunnel({
      dateRange: "30 DAYS",
    });

    expect(result).toHaveProperty("vipRevenue");
    expect(result).toHaveProperty("htRevenue");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalSpend");
    expect(result).toHaveProperty("fullFunnelRoas");
    expect(result).toHaveProperty("htCpa");
    expect(result).toHaveProperty("htSalesCount");
    expect(typeof result.vipRevenue).toBe("number");
    expect(typeof result.htRevenue).toBe("number");
    expect(typeof result.totalRevenue).toBe("number");
    expect(typeof result.totalSpend).toBe("number");
    expect(typeof result.fullFunnelRoas).toBe("number");
    expect(typeof result.htCpa).toBe("number");
    expect(typeof result.htSalesCount).toBe("number");
  });

  it("calculates full funnel ROAS correctly", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.fullFunnel({
      dateRange: "30 DAYS",
    });

    // Total revenue should be VIP + HT
    expect(result.totalRevenue).toBe(result.vipRevenue + result.htRevenue);

    // ROAS should be totalRevenue / totalSpend (or 0 if no spend)
    if (result.totalSpend > 0) {
      const expectedRoas = result.totalRevenue / result.totalSpend;
      expect(result.fullFunnelRoas).toBeCloseTo(expectedRoas, 2);
    } else {
      expect(result.fullFunnelRoas).toBe(0);
    }
  });

  it("calculates HT CPA correctly", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.fullFunnel({
      dateRange: "30 DAYS",
    });

    // HT CPA should be totalSpend / htSalesCount (or 0 if no sales)
    if (result.htSalesCount > 0) {
      const expectedCpa = result.totalSpend / result.htSalesCount;
      expect(result.htCpa).toBeCloseTo(expectedCpa, 2);
    } else {
      expect(result.htCpa).toBe(0);
    }
  });

  it("handles zero spend gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.fullFunnel({
      dateRange: "TODAY",
    });

    // Should not throw errors even with zero spend
    expect(result.fullFunnelRoas).toBeGreaterThanOrEqual(0);
    expect(result.htCpa).toBeGreaterThanOrEqual(0);
  });
});
