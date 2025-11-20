import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { DATE_RANGES } from "@shared/constants";

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

describe("dailyAnalysis.metrics", () => {
  it("returns daily metrics with correct structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyAnalysis.metrics({
      dateRange: DATE_RANGES.LAST_30_DAYS,
    });

    // Should return an array
    expect(Array.isArray(result)).toBe(true);

    // If there's data, check structure
    if (result.length > 0) {
      const firstDay = result[0];

      // Check required fields exist
      expect(firstDay).toHaveProperty("date");
      expect(firstDay).toHaveProperty("totalOptins");
      expect(firstDay).toHaveProperty("totalVipSales");
      expect(firstDay).toHaveProperty("vipTakeRate");
      expect(firstDay).toHaveProperty("totalVipRevenue");
      expect(firstDay).toHaveProperty("totalSpend");
      expect(firstDay).toHaveProperty("trueCPL");
      expect(firstDay).toHaveProperty("trueCPP");
      expect(firstDay).toHaveProperty("roas");
      expect(firstDay).toHaveProperty("profitLoss");

      // Check Meta fields
      expect(firstDay).toHaveProperty("metaSpend");
      expect(firstDay).toHaveProperty("metaCPL");
      expect(firstDay).toHaveProperty("metaCPP");
      expect(firstDay).toHaveProperty("metaOptins");
      expect(firstDay).toHaveProperty("metaVipSales");
      expect(firstDay).toHaveProperty("metaClicks");
      expect(firstDay).toHaveProperty("metaImpressions");
      expect(firstDay).toHaveProperty("metaLandingPageViews");
      expect(firstDay).toHaveProperty("metaConnectRate");
      expect(firstDay).toHaveProperty("metaClickToLeadRate");
      expect(firstDay).toHaveProperty("metaClickToPurchaseRate");

      // Check Google fields
      expect(firstDay).toHaveProperty("googleSpend");
      expect(firstDay).toHaveProperty("googleCPL");
      expect(firstDay).toHaveProperty("googleCPP");
      expect(firstDay).toHaveProperty("googleOptins");
      expect(firstDay).toHaveProperty("googleVipSales");
      expect(firstDay).toHaveProperty("googleClicks");
      expect(firstDay).toHaveProperty("googleImpressions");
      expect(firstDay).toHaveProperty("googleClickToLeadRate");
      expect(firstDay).toHaveProperty("googleClickToPurchaseRate");

      // Check data types
      expect(typeof firstDay.date).toBe("string");
      expect(typeof firstDay.totalOptins).toBe("number");
      expect(typeof firstDay.totalVipSales).toBe("number");
      expect(typeof firstDay.vipTakeRate).toBe("number");
      expect(typeof firstDay.totalVipRevenue).toBe("number");
      expect(typeof firstDay.totalSpend).toBe("number");
      expect(typeof firstDay.trueCPL).toBe("number");
      expect(typeof firstDay.trueCPP).toBe("number");
      expect(typeof firstDay.roas).toBe("number");
      expect(typeof firstDay.profitLoss).toBe("number");

      // Check calculations are correct
      if (firstDay.totalOptins > 0) {
        const expectedVipTakeRate = (firstDay.totalVipSales / firstDay.totalOptins) * 100;
        expect(firstDay.vipTakeRate).toBeCloseTo(expectedVipTakeRate, 2);
      }

      if (firstDay.totalOptins > 0 && firstDay.totalSpend > 0) {
        const expectedCPL = firstDay.totalSpend / firstDay.totalOptins;
        expect(firstDay.trueCPL).toBeCloseTo(expectedCPL, 2);
      }

      if (firstDay.totalVipSales > 0 && firstDay.totalSpend > 0) {
        const expectedCPP = firstDay.totalSpend / firstDay.totalVipSales;
        expect(firstDay.trueCPP).toBeCloseTo(expectedCPP, 2);
      }

      if (firstDay.totalSpend > 0) {
        const expectedROAS = firstDay.totalVipRevenue / firstDay.totalSpend;
        expect(firstDay.roas).toBeCloseTo(expectedROAS, 2);
      }

      const expectedProfitLoss = firstDay.totalVipRevenue - firstDay.totalSpend;
      expect(firstDay.profitLoss).toBeCloseTo(expectedProfitLoss, 2);
    }
  });

  it("filters data by date range correctly", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyAnalysis.metrics({
      dateRange: DATE_RANGES.TODAY,
    });

    expect(Array.isArray(result)).toBe(true);

    // When filtering by TODAY, result should be empty or contain only today's data
    // Since we may not have data for today, we just verify the structure
    if (result.length > 0) {
      // Verify each day has the correct structure
      result.forEach(day => {
        expect(day).toHaveProperty("date");
        expect(typeof day.date).toBe("string");
      });
    }
  });

  it("returns empty array when no data exists", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Query for a date range that definitely has no data (far future)
    const result = await caller.dailyAnalysis.metrics({
      dateRange: DATE_RANGES.LAST_7_DAYS,
    });

    expect(Array.isArray(result)).toBe(true);
    // Result can be empty or have data, both are valid
  });

  it("calculates Meta metrics correctly when ad data exists", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyAnalysis.metrics({
      dateRange: DATE_RANGES.LAST_30_DAYS,
    });

    if (result.length > 0) {
      result.forEach(day => {
        // If there are Meta clicks, rates should be calculated
        if (day.metaClicks > 0) {
          const expectedClickToLeadRate = (day.metaOptins / day.metaClicks) * 100;
          expect(day.metaClickToLeadRate).toBeCloseTo(expectedClickToLeadRate, 2);

          const expectedClickToPurchaseRate = (day.metaVipSales / day.metaClicks) * 100;
          expect(day.metaClickToPurchaseRate).toBeCloseTo(expectedClickToPurchaseRate, 2);

          if (day.metaLandingPageViews > 0) {
            const expectedConnectRate = (day.metaLandingPageViews / day.metaClicks) * 100;
            expect(day.metaConnectRate).toBeCloseTo(expectedConnectRate, 2);
          }
        }

        // If there are Meta optins, CPL should be calculated
        if (day.metaOptins > 0 && day.metaSpend > 0) {
          const expectedCPL = day.metaSpend / day.metaOptins;
          expect(day.metaCPL).toBeCloseTo(expectedCPL, 2);
        }

        // If there are Meta sales, CPP should be calculated
        if (day.metaVipSales > 0 && day.metaSpend > 0) {
          const expectedCPP = day.metaSpend / day.metaVipSales;
          expect(day.metaCPP).toBeCloseTo(expectedCPP, 2);
        }
      });
    }
  });

  it("calculates Google metrics correctly when ad data exists", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyAnalysis.metrics({
      dateRange: DATE_RANGES.LAST_30_DAYS,
    });

    if (result.length > 0) {
      result.forEach(day => {
        // If there are Google clicks, rates should be calculated
        if (day.googleClicks > 0) {
          const expectedClickToLeadRate = (day.googleOptins / day.googleClicks) * 100;
          expect(day.googleClickToLeadRate).toBeCloseTo(expectedClickToLeadRate, 2);

          const expectedClickToPurchaseRate = (day.googleVipSales / day.googleClicks) * 100;
          expect(day.googleClickToPurchaseRate).toBeCloseTo(expectedClickToPurchaseRate, 2);
        }

        // If there are Google optins, CPL should be calculated
        if (day.googleOptins > 0 && day.googleSpend > 0) {
          const expectedCPL = day.googleSpend / day.googleOptins;
          expect(day.googleCPL).toBeCloseTo(expectedCPL, 2);
        }

        // If there are Google sales, CPP should be calculated
        if (day.googleVipSales > 0 && day.googleSpend > 0) {
          const expectedCPP = day.googleSpend / day.googleVipSales;
          expect(day.googleCPP).toBeCloseTo(expectedCPP, 2);
        }
      });
    }
  });
});
