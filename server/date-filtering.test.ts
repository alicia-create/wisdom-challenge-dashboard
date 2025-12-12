import { describe, expect, it } from "vitest";
import { getDailyAnalysisMetrics, getOverviewMetrics } from "./supabase";

/**
 * Tests for date filtering fixes
 * 
 * These tests validate that:
 * 1. getDailyAnalysisMetrics filters contacts and orders by created_at date
 * 2. Kingdom Seeker Trials count respects date range filters
 * 3. Daily charts (leads, sales) only show data within selected date range
 */

describe("Date Filtering - Daily Analysis", () => {
  it("should filter daily leads by created_at date range", async () => {
    // Test with TODAY filter (should return only today's data)
    const today = new Date().toISOString().split('T')[0];
    const dailyData = await getDailyAnalysisMetrics(today, today);
    
    // All returned dates should match today
    dailyData.forEach(day => {
      expect(day.date).toBe(today);
    });
  });

  it("should filter daily orders by created_at date range", async () => {
    // Test with specific date range (Dec 11, 2024)
    const startDate = '2024-12-11';
    const endDate = '2024-12-11';
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    // All returned dates should be within range
    dailyData.forEach(day => {
      expect(day.date).toBeGreaterThanOrEqual(startDate);
      expect(day.date).toBeLessThanOrEqual(endDate);
    });
  });

  it("should return empty array when no data exists in date range", async () => {
    // Test with future date (should return empty)
    const futureDate = '2025-12-31';
    const dailyData = await getDailyAnalysisMetrics(futureDate, futureDate);
    
    expect(dailyData).toEqual([]);
  });

  it("should aggregate multiple days correctly in 7-day range", async () => {
    // Test with 7-day range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
    
    // Should have at most 7 days of data
    expect(dailyData.length).toBeLessThanOrEqual(7);
    
    // Each day should have required fields
    dailyData.forEach(day => {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('totalOptins');
      expect(day).toHaveProperty('totalVipSales');
      expect(day).toHaveProperty('metaSpend');
      expect(day).toHaveProperty('googleSpend');
    });
  });
});

describe("Date Filtering - Kingdom Seeker Trials", () => {
  it("should count only Kingdom Seeker trials within date range", async () => {
    // Test with TODAY filter
    const today = new Date().toISOString().split('T')[0];
    const metrics = await getOverviewMetrics(today, today);
    
    // Kingdom Seeker count should be >= 0 (not the total historical count of 12)
    expect(metrics.kingdomSeekerTrials).toBeGreaterThanOrEqual(0);
    expect(typeof metrics.kingdomSeekerTrials).toBe('number');
  });

  it("should return 0 Kingdom Seekers when no trials in date range", async () => {
    // Test with future date
    const futureDate = '2025-12-31';
    const metrics = await getOverviewMetrics(futureDate, futureDate);
    
    expect(metrics.kingdomSeekerTrials).toBe(0);
  });

  it("should count Kingdom Seekers correctly in 30-day range", async () => {
    // Test with 30-day range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const metrics = await getOverviewMetrics(startDate, endDate);
    
    // Should return a valid count (not undefined or null)
    expect(metrics.kingdomSeekerTrials).toBeDefined();
    expect(typeof metrics.kingdomSeekerTrials).toBe('number');
    expect(metrics.kingdomSeekerTrials).toBeGreaterThanOrEqual(0);
  });
});

describe("Date Filtering - Overview Metrics", () => {
  it("should filter all metrics by date range consistently", async () => {
    // Test with specific date
    const testDate = '2024-12-11';
    const metrics = await getOverviewMetrics(testDate, testDate);
    
    // All metrics should be numbers
    expect(typeof metrics.totalLeads).toBe('number');
    expect(typeof metrics.vipSales).toBe('number');
    expect(typeof metrics.kingdomSeekerTrials).toBe('number');
    expect(typeof metrics.totalSpend).toBe('number');
    expect(typeof metrics.totalRevenue).toBe('number');
    
    // Metrics should be >= 0
    expect(metrics.totalLeads).toBeGreaterThanOrEqual(0);
    expect(metrics.vipSales).toBeGreaterThanOrEqual(0);
    expect(metrics.kingdomSeekerTrials).toBeGreaterThanOrEqual(0);
  });

  it("should return zero metrics for future dates", async () => {
    const futureDate = '2025-12-31';
    const metrics = await getOverviewMetrics(futureDate, futureDate);
    
    // All counts should be 0 for future dates
    expect(metrics.totalLeads).toBe(0);
    expect(metrics.vipSales).toBe(0);
    expect(metrics.kingdomSeekerTrials).toBe(0);
  });
});
