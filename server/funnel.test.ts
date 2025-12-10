import { describe, expect, it } from "vitest";
import { getFunnelMetrics, getVSLMetrics } from "./funnel";

describe("Funnel Metrics", () => {
  it("should return funnel metrics structure", async () => {
    const metrics = await getFunnelMetrics();
    
    expect(metrics).toHaveProperty("totalLeads");
    expect(metrics).toHaveProperty("wisdomPurchases");
    expect(metrics).toHaveProperty("kingdomSeekerTrials");
    expect(metrics).toHaveProperty("manychatConnected");
    expect(metrics).toHaveProperty("botAlertsSubscribed");
    expect(metrics).toHaveProperty("leadToWisdomRate");
    expect(metrics).toHaveProperty("wisdomToKingdomRate");
    expect(metrics).toHaveProperty("kingdomToManychatRate");
    expect(metrics).toHaveProperty("manychatToBotAlertsRate");
    
    // All values should be numbers
    expect(typeof metrics.totalLeads).toBe("number");
    expect(typeof metrics.wisdomPurchases).toBe("number");
    expect(typeof metrics.kingdomSeekerTrials).toBe("number");
    expect(typeof metrics.manychatConnected).toBe("number");
    expect(typeof metrics.botAlertsSubscribed).toBe("number");
    
    // Conversion rates should be between 0 and 100 (or 0 if no data)
    expect(metrics.leadToWisdomRate).toBeGreaterThanOrEqual(0);
    expect(metrics.wisdomToKingdomRate).toBeGreaterThanOrEqual(0);
    expect(metrics.kingdomToManychatRate).toBeGreaterThanOrEqual(0);
    expect(metrics.manychatToBotAlertsRate).toBeGreaterThanOrEqual(0);
  });

  it("should handle date range filtering", async () => {
    const startDate = "2024-12-01";
    const endDate = "2024-12-10";
    
    const metrics = await getFunnelMetrics(startDate, endDate);
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalLeads).toBe("number");
  });
});

describe("VSL Metrics", () => {
  it("should return VSL metrics structure", async () => {
    const metrics = await getVSLMetrics();
    
    expect(metrics).toHaveProperty("vsl5Percent");
    expect(metrics).toHaveProperty("vsl25Percent");
    expect(metrics).toHaveProperty("vsl75Percent");
    expect(metrics).toHaveProperty("vsl95Percent");
    expect(metrics).toHaveProperty("wisdomPurchases");
    expect(metrics).toHaveProperty("vslToPurchaseRate");
    
    // All values should be numbers
    expect(typeof metrics.vsl5Percent).toBe("number");
    expect(typeof metrics.vsl25Percent).toBe("number");
    expect(typeof metrics.vsl75Percent).toBe("number");
    expect(typeof metrics.vsl95Percent).toBe("number");
    expect(typeof metrics.wisdomPurchases).toBe("number");
    
    // Conversion rate should be between 0 and 100 (or 0 if no data)
    expect(metrics.vslToPurchaseRate).toBeGreaterThanOrEqual(0);
  });

  it("should handle date range filtering", async () => {
    const startDate = "2024-12-01";
    const endDate = "2024-12-10";
    
    const metrics = await getVSLMetrics(startDate, endDate);
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.vsl5Percent).toBe("number");
  });
});
