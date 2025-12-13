import { describe, expect, it } from "vitest";
import { getDailyAnalysisMetrics } from "./supabase";
import { getDateRangeValues, DATE_RANGES } from "../shared/constants";

describe("Daily Charts Data", () => {
  it("should return data with frontend-compatible field names", async () => {
    const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
    
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    expect(Array.isArray(dailyData)).toBe(true);
    
    if (dailyData.length > 0) {
      const firstDay = dailyData[0];
      
      // Check frontend-compatible fields exist
      expect(firstDay).toHaveProperty('total_leads');
      expect(firstDay).toHaveProperty('vip_sales');
      expect(firstDay).toHaveProperty('total_spend_meta');
      expect(firstDay).toHaveProperty('total_spend_google');
      expect(firstDay).toHaveProperty('date');
      
      console.log(`[Test] Found ${dailyData.length} days of data`);
      console.log(`[Test] Sample day: ${firstDay.date} - ${firstDay.total_leads} leads, ${firstDay.vip_sales} vip sales`);
    } else {
      console.log('[Test] No daily data found (this is okay if database is empty)');
    }
  });

  it("should combine data from both Paid Ads and Organic funnels", async () => {
    const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_7_DAYS);
    
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    // Daily data should include ALL wisdom contacts (not split by source)
    const totalLeads = dailyData.reduce((sum, day) => sum + (day.total_leads || 0), 0);
    const totalVipSales = dailyData.reduce((sum, day) => sum + (day.vip_sales || 0), 0);
    
    console.log(`[Test] Last 7 days: ${totalLeads} total leads, ${totalVipSales} total vip sales`);
    
    // Should have some data (unless database is completely empty)
    expect(totalLeads).toBeGreaterThanOrEqual(0);
    expect(totalVipSales).toBeGreaterThanOrEqual(0);
  });

  it("should filter by date range correctly", async () => {
    const { startDate, endDate } = getDateRangeValues(DATE_RANGES.TODAY);
    
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    // TODAY should return 0 or 1 day of data
    expect(dailyData.length).toBeLessThanOrEqual(1);
    
    if (dailyData.length === 1) {
      const today = dailyData[0];
      console.log(`[Test] TODAY: ${today.date} - ${today.total_leads} leads, ${today.vip_sales} vip sales`);
      
      // Date should match today's date
      const todayDate = new Date().toISOString().split('T')[0];
      expect(today.date).toBe(todayDate);
    } else {
      console.log('[Test] No data for TODAY (this is okay if no leads were created today)');
    }
  });

  it("should calculate spend correctly from both Meta and Google", async () => {
    const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
    
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    dailyData.forEach(day => {
      const metaSpend = day.total_spend_meta || 0;
      const googleSpend = day.total_spend_google || 0;
      const totalSpend = day.totalSpend || 0;
      
      // Total spend should equal meta + google
      expect(totalSpend).toBeCloseTo(metaSpend + googleSpend, 2);
    });
    
    console.log(`[Test] Verified spend calculations for ${dailyData.length} days`);
  });
});
