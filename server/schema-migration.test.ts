import { describe, expect, it } from "vitest";
import {
  getOverviewMetrics,
  getLeadsPaginated,
  getPurchasesPaginated,
  getHighTicketSales,
  getEngagementMetrics,
} from "./supabase";

/**
 * Tests to validate schema migration from old tables to new tables:
 * - Lead → contacts
 * - Order → orders
 * - high_ticket_sales → orders (with order_total >= 1000)
 * - daily_attendance → analytics_events (TODO: not yet implemented)
 */

describe("Schema Migration Tests", () => {
  describe("contacts table (formerly Lead)", () => {
    it("should fetch paginated contacts without errors", async () => {
      const result = await getLeadsPaginated({
        page: 1,
        pageSize: 10,
      });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return valid contact data structure", async () => {
      const result = await getLeadsPaginated({
        page: 1,
        pageSize: 1,
      });

      if (result.data.length > 0) {
        const contact = result.data[0];
        expect(contact).toHaveProperty("id");
        expect(contact).toHaveProperty("email");
        expect(contact).toHaveProperty("created_at");
      }
    });
  });

  describe("orders table (formerly Order)", () => {
    it("should fetch paginated orders without errors", async () => {
      const result = await getPurchasesPaginated({
        page: 1,
        pageSize: 10,
      });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return valid order data structure", async () => {
      const result = await getPurchasesPaginated({
        page: 1,
        pageSize: 1,
      });

      if (result.data.length > 0) {
        const order = result.data[0];
        expect(order).toHaveProperty("id");
        expect(order).toHaveProperty("order_total");
        expect(order).toHaveProperty("created_at");
      }
    });

    it("should calculate overview metrics using orders table", async () => {
      const metrics = await getOverviewMetrics();

      expect(metrics).toHaveProperty("totalLeads");
      expect(metrics).toHaveProperty("totalSpend");
      expect(metrics).toHaveProperty("vipSales");
      expect(metrics).toHaveProperty("totalRevenue");
      expect(metrics).toHaveProperty("cpl");
      expect(metrics).toHaveProperty("cpp");
      expect(metrics).toHaveProperty("roas");
      expect(metrics).toHaveProperty("vipTakeRate");
      expect(metrics).toHaveProperty("aov");
      expect(metrics).toHaveProperty("vipRevenue");

      expect(typeof metrics.totalLeads).toBe("number");
      expect(typeof metrics.vipSales).toBe("number");
      expect(typeof metrics.totalRevenue).toBe("number");
    });
  });

  describe("high-ticket sales (now part of orders)", () => {
    it("should fetch high-ticket sales from orders table", async () => {
      const result = await getHighTicketSales();

      expect(result).toHaveProperty("todayHtSales");
      expect(result).toHaveProperty("totalHtSales");
      expect(result).toHaveProperty("totalHtRevenue");
      expect(result).toHaveProperty("htSalesList");

      expect(typeof result.todayHtSales).toBe("number");
      expect(typeof result.totalHtSales).toBe("number");
      expect(typeof result.totalHtRevenue).toBe("number");
      expect(Array.isArray(result.htSalesList)).toBe(true);
    });

    it("should only return orders with order_total >= 1000", async () => {
      const result = await getHighTicketSales();

      // All HT sales should have order_total >= 1000
      result.htSalesList.forEach((sale: any) => {
        expect(parseFloat(sale.order_total || 0)).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe("attendance metrics (daily_attendance removed)", () => {
    it("should return zero attendance until analytics_events is implemented", async () => {
      const result = await getEngagementMetrics();

      expect(result).toHaveProperty("todayAttendance");
      expect(result).toHaveProperty("totalAttendance");
      expect(result).toHaveProperty("attendanceByDay");

      // Should return 0 and empty array until analytics_events is configured
      expect(result.todayAttendance).toBe(0);
      expect(result.totalAttendance).toBe(0);
      expect(Array.isArray(result.attendanceByDay)).toBe(true);
      expect(result.attendanceByDay.length).toBe(0);
    });
  });

  describe("data consistency", () => {
    it("should have consistent lead and order counts (wisdom funnel only)", async () => {
      const overview = await getOverviewMetrics();
      const leads = await getLeadsPaginated({ page: 1, pageSize: 1000 });
      // Note: getPurchasesPaginated returns ALL orders, not filtered by wisdom
      // Overview metrics are now wisdom-filtered, so we can't compare directly to all orders

      // Overview metrics should match wisdom-filtered leads
      expect(overview.totalLeads).toBe(leads.total);
      
      // VIP sales should be >= 0 and <= total leads (can't have more sales than leads)
      expect(overview.vipSales).toBeGreaterThanOrEqual(0);
      expect(overview.vipSales).toBeLessThanOrEqual(overview.totalLeads);
      
      console.log(`Wisdom funnel (last 2 days): ${overview.totalLeads} leads, ${overview.vipSales} VIP sales`);
    });

    it("should calculate VIP take rate correctly", async () => {
      const overview = await getOverviewMetrics();

      if (overview.totalLeads > 0) {
        const expectedTakeRate = (overview.vipSales / overview.totalLeads) * 100;
        expect(Math.abs(overview.vipTakeRate - expectedTakeRate)).toBeLessThan(0.01);
      }
    });
  });
});
