import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

describe("Dashboard Metrics v14 - Backend Calculations", () => {
  it("should return cplAds, cppAds, trueCpl, trueCpp from get_dashboard_metrics", async () => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the SQL function
    const { data, error } = await supabase.rpc("get_dashboard_metrics", {
      p_start_date: "2025-12-13",
      p_end_date: "2025-12-18",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Check that KPIs object exists
    expect(data.kpis).toBeDefined();

    // Check new calculated fields exist
    expect(data.kpis).toHaveProperty("cplAds");
    expect(data.kpis).toHaveProperty("cppAds");
    expect(data.kpis).toHaveProperty("trueCpl");
    expect(data.kpis).toHaveProperty("trueCpp");

    // Verify they are numbers
    expect(typeof data.kpis.cplAds).toBe("number");
    expect(typeof data.kpis.cppAds).toBe("number");
    expect(typeof data.kpis.trueCpl).toBe("number");
    expect(typeof data.kpis.trueCpp).toBe("number");

    // Verify they are non-negative
    expect(data.kpis.cplAds).toBeGreaterThanOrEqual(0);
    expect(data.kpis.cppAds).toBeGreaterThanOrEqual(0);
    expect(data.kpis.trueCpl).toBeGreaterThanOrEqual(0);
    expect(data.kpis.trueCpp).toBeGreaterThanOrEqual(0);

    console.log("✅ CPL (Ads):", data.kpis.cplAds);
    console.log("✅ CPP (Ads):", data.kpis.cppAds);
    console.log("✅ True CPL:", data.kpis.trueCpl);
    console.log("✅ True CPP:", data.kpis.trueCpp);
  });

  it("should return Google conversions in googlePerformance", async () => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("get_dashboard_metrics", {
      p_start_date: "2025-12-13",
      p_end_date: "2025-12-18",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Check that googlePerformance exists
    expect(data.googlePerformance).toBeDefined();

    // Check conversions field exists
    expect(data.googlePerformance).toHaveProperty("conversions");

    // Verify it's a number
    expect(typeof data.googlePerformance.conversions).toBe("number");

    // Verify it's non-negative
    expect(data.googlePerformance.conversions).toBeGreaterThanOrEqual(0);

    console.log("✅ Google Conversions:", data.googlePerformance.conversions);
  });

  it("should calculate CPL/CPP correctly based on leads and sales spend", async () => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("get_dashboard_metrics", {
      p_start_date: "2025-12-13",
      p_end_date: "2025-12-18",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const { kpis, paidAdsFunnel } = data;

    // If we have paid leads and spend, verify calculation
    if (paidAdsFunnel.leads > 0 && kpis.leadsSalesSpend > 0) {
      const expectedCplAds = kpis.leadsSalesSpend / paidAdsFunnel.leads;
      expect(kpis.cplAds).toBeCloseTo(expectedCplAds, 2);
      console.log("✅ CPL (Ads) calculation verified:", kpis.cplAds, "≈", expectedCplAds);
    }

    // If we have paid wisdom sales and spend, verify calculation
    if (paidAdsFunnel.wisdomSales > 0 && kpis.leadsSalesSpend > 0) {
      const expectedCppAds = kpis.leadsSalesSpend / paidAdsFunnel.wisdomSales;
      expect(kpis.cppAds).toBeCloseTo(expectedCppAds, 2);
      console.log("✅ CPP (Ads) calculation verified:", kpis.cppAds, "≈", expectedCppAds);
    }

    // Verify True CPL calculation
    if (kpis.totalLeads > 0 && kpis.totalSpend > 0) {
      const expectedTrueCpl = kpis.totalSpend / kpis.totalLeads;
      expect(kpis.trueCpl).toBeCloseTo(expectedTrueCpl, 2);
      console.log("✅ True CPL calculation verified:", kpis.trueCpl, "≈", expectedTrueCpl);
    }

    // Verify True CPP calculation
    if (kpis.wisdomSales > 0 && kpis.totalSpend > 0) {
      const expectedTrueCpp = kpis.totalSpend / kpis.wisdomSales;
      expect(kpis.trueCpp).toBeCloseTo(expectedTrueCpp, 2);
      console.log("✅ True CPP calculation verified:", kpis.trueCpp, "≈", expectedTrueCpp);
    }
  });
});
