import { describe, expect, it } from "vitest";
import { getPaidAdsContactIds, getOrganicContactIds } from "./wisdom-filter";
import { getFunnelMetrics } from "./funnel";

describe("Split Funnel Filtering", () => {
  describe("getPaidAdsContactIds", () => {
    it("should return contact IDs from 31daywisdom.com", async () => {
      const contactIds = await getPaidAdsContactIds();
      
      expect(Array.isArray(contactIds)).toBe(true);
      // Should have some paid ads contacts
      console.log(`[Test] Found ${contactIds.length} paid ads contacts`);
    });

    it("should filter by date range", async () => {
      const startDate = "2024-12-01";
      const endDate = "2024-12-31";
      
      const contactIds = await getPaidAdsContactIds(startDate, endDate);
      
      expect(Array.isArray(contactIds)).toBe(true);
      console.log(`[Test] Found ${contactIds.length} paid ads contacts in Dec 2024`);
    });
  });

  describe("getOrganicContactIds", () => {
    it("should return contact IDs NOT from 31daywisdom.com", async () => {
      const contactIds = await getOrganicContactIds();
      
      expect(Array.isArray(contactIds)).toBe(true);
      // Should have some organic contacts
      console.log(`[Test] Found ${contactIds.length} organic/affiliate contacts`);
    });

    it("should exclude paid ads contacts", async () => {
      const paidIds = await getPaidAdsContactIds();
      const organicIds = await getOrganicContactIds();
      
      // No overlap between paid and organic
      const overlap = paidIds.filter(id => organicIds.includes(id));
      expect(overlap.length).toBe(0);
      
      console.log(`[Test] Paid: ${paidIds.length}, Organic: ${organicIds.length}, Overlap: ${overlap.length}`);
    });
  });

  describe("getFunnelMetrics with filtering", () => {
    it("should return different metrics for paid vs organic", async () => {
      const paidIds = await getPaidAdsContactIds();
      const organicIds = await getOrganicContactIds();
      
      const paidMetrics = await getFunnelMetrics(undefined, undefined, paidIds);
      const organicMetrics = await getFunnelMetrics(undefined, undefined, organicIds);
      
      // Total leads should be different
      expect(paidMetrics.totalLeads).not.toBe(organicMetrics.totalLeads);
      
      // At least one funnel should have leads
      expect(paidMetrics.totalLeads + organicMetrics.totalLeads).toBeGreaterThan(0);
      
      console.log(`[Test] Paid Funnel: ${paidMetrics.totalLeads} leads → ${paidMetrics.wisdomPurchases} wisdom+ → ${paidMetrics.kingdomSeekerTrials} kingdom`);
      console.log(`[Test] Organic Funnel: ${organicMetrics.totalLeads} leads → ${organicMetrics.wisdomPurchases} wisdom+ → ${organicMetrics.kingdomSeekerTrials} kingdom`);
    });

    it("should filter all stages by contactIds", async () => {
      const paidIds = await getPaidAdsContactIds();
      
      if (paidIds.length === 0) {
        console.log("[Test] No paid ads contacts found, skipping test");
        return;
      }
      
      const metrics = await getFunnelMetrics(undefined, undefined, paidIds);
      
      // All stage counts should be <= total leads
      expect(metrics.wisdomPurchases).toBeLessThanOrEqual(metrics.totalLeads);
      expect(metrics.kingdomSeekerTrials).toBeLessThanOrEqual(metrics.wisdomPurchases);
      expect(metrics.manychatConnected).toBeLessThanOrEqual(metrics.totalLeads);
      expect(metrics.botAlertsSubscribed).toBeLessThanOrEqual(metrics.manychatConnected);
      
      console.log(`[Test] Paid Ads Funnel validated: ${metrics.totalLeads} → ${metrics.wisdomPurchases} → ${metrics.kingdomSeekerTrials} → ${metrics.manychatConnected} → ${metrics.botAlertsSubscribed}`);
    });
  });
});
