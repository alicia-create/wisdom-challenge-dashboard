import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as supabaseModule from "./supabase";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("dashboard.overview", () => {
  it("returns overview metrics successfully", async () => {
    const { ctx } = createAuthContext();
    
    // Mock the Supabase helper
    vi.spyOn(supabaseModule, 'getOverviewMetrics').mockResolvedValue({
      totalLeads: 1000,
      totalSpend: 50000,
      cpl: 50,
      vipSales: 100,
      vipRevenue: 100000,
      cpp: 500,
      roas: 2.0,
      vipTakeRate: 10,
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.overview();

    expect(result).toBeDefined();
    expect(result.totalLeads).toBe(1000);
    expect(result.totalSpend).toBe(50000);
    expect(result.cpl).toBe(50);
    expect(result.vipSales).toBe(100);
    expect(result.vipRevenue).toBe(100000);
    expect(result.cpp).toBe(500);
    expect(result.roas).toBe(2.0);
    expect(result.vipTakeRate).toBe(10);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: undefined,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.dashboard.overview()).rejects.toThrow();
  });
});

describe("dashboard.dailyKpis", () => {
  it("returns daily KPIs with date filtering", async () => {
    const { ctx } = createAuthContext();
    
    // Mock the Supabase helper
    vi.spyOn(supabaseModule, 'getDailyKpis').mockResolvedValue([
      {
        id: 1,
        date: new Date('2024-01-01'),
        total_leads: 50,
        total_spend: '2500',
        cpl: '50',
        vip_sales: 5,
        vip_revenue: '5000',
        cpp: '500',
        roas: '2.0',
        vip_take_rate: '10',
        welcome_email_clicks: 25,
      },
    ]);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.dailyKpis({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
