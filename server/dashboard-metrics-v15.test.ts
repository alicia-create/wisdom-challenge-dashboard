import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

describe("Dashboard Metrics v15 - Fixed CPL/CPP Ads Calculation", () => {
  it("should calculate CPL/CPP Ads using Meta LEADS + SALES spend divided by total paid funnel", async () => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("get_dashboard_metrics", {
      p_start_date: "2025-12-13",
      p_end_date: "2025-12-18",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const { kpis, paidAdsFunnel, metaCampaignBreakdown } = data;

    // Get Meta LEADS + SALES spend (numerator)
    const metaLeadsSpend = metaCampaignBreakdown?.leads?.spend || 0;
    const metaSalesSpend = metaCampaignBreakdown?.sales?.spend || 0;
    const totalMetaLeadsSalesSpend = metaLeadsSpend + metaSalesSpend;

    console.log("\n=== Opção A: Meta LEADS+SALES spend / Total Paid Funnel ===");
    console.log("Meta LEADS spend:", metaLeadsSpend);
    console.log("Meta SALES spend:", metaSalesSpend);
    console.log("Total Meta LEADS+SALES spend:", totalMetaLeadsSalesSpend);
    console.log("Paid Ads Funnel Total Leads (all paid sources):", paidAdsFunnel.leads);
    console.log("Paid Ads Funnel Total Wisdom Sales (all paid sources):", paidAdsFunnel.wisdomSales);

    // Verify CPL (Ads) = (Meta LEADS+SALES spend) / (Total Paid Funnel Leads)
    if (paidAdsFunnel.leads > 0 && totalMetaLeadsSalesSpend > 0) {
      const expectedCplAds = totalMetaLeadsSalesSpend / paidAdsFunnel.leads;
      expect(kpis.cplAds).toBeCloseTo(expectedCplAds, 2);
      console.log("✅ CPL (Ads) verified:", kpis.cplAds, "≈", expectedCplAds.toFixed(2));
    }

    // Verify CPP (Ads) = (Meta LEADS+SALES spend) / (Total Paid Funnel Wisdom Sales)
    if (paidAdsFunnel.wisdomSales > 0 && totalMetaLeadsSalesSpend > 0) {
      const expectedCppAds = totalMetaLeadsSalesSpend / paidAdsFunnel.wisdomSales;
      expect(kpis.cppAds).toBeCloseTo(expectedCppAds, 2);
      console.log("✅ CPP (Ads) verified:", kpis.cppAds, "≈", expectedCppAds.toFixed(2));
    }

    // Verify that CPL/CPP Ads use Meta spend (not total spend which includes Google)
    console.log("\n=== Verification ===");
    console.log("CPL (Ads) uses Meta LEADS+SALES spend:", kpis.cplAds);
    console.log("True CPL uses total spend (Meta + Google):", kpis.trueCpl);
    console.log("CPP (Ads) uses Meta LEADS+SALES spend:", kpis.cppAds);
    console.log("True CPP uses total spend (Meta + Google):", kpis.trueCpp);
    
    // They should be different since True uses total spend
    expect(kpis.cplAds).not.toEqual(kpis.trueCpl);
    expect(kpis.cppAds).not.toEqual(kpis.trueCpp);
    console.log("✅ CPL/CPP Ads correctly use only Meta LEADS+SALES spend");
  });

  it("should have True CPL/CPP using total spend from all campaigns", async () => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("get_dashboard_metrics", {
      p_start_date: "2025-12-13",
      p_end_date: "2025-12-18",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const { kpis } = data;

    // Verify True CPL calculation uses total spend
    if (kpis.totalLeads > 0 && kpis.totalSpend > 0) {
      const expectedTrueCpl = kpis.totalSpend / kpis.totalLeads;
      expect(kpis.trueCpl).toBeCloseTo(expectedTrueCpl, 2);
      console.log("✅ True CPL verified:", kpis.trueCpl, "≈", expectedTrueCpl);
    }

    // Verify True CPP calculation uses total spend
    if (kpis.wisdomSales > 0 && kpis.totalSpend > 0) {
      const expectedTrueCpp = kpis.totalSpend / kpis.wisdomSales;
      expect(kpis.trueCpp).toBeCloseTo(expectedTrueCpp, 2);
      console.log("✅ True CPP verified:", kpis.trueCpp, "≈", expectedTrueCpp);
    }
  });
});
