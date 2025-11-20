import { COOKIE_NAME } from "@shared/const";
import { DATE_RANGES, getDateRangeValues, type DateRange } from "@shared/constants";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDailyKpis,
  getOverviewMetrics,
  getLeadsWithAttribution,
  getOrdersWithAttribution,
  getAdPerformanceByCampaign,
  getAdPerformanceDetailed,
  getAdHierarchy,
  getLandingPageMetrics,
  getDailyAttendance,
  getEmailEngagement,
  getDailyAnalysisMetrics,
  getEngagementMetrics,
  getHighTicketSales,
  getFullFunnelMetrics,
  getChannelPerformance,
} from "./supabase";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Overview page queries
  overview: router({
    // Get aggregated overview metrics (total leads, spend, CPL, ROAS, etc.)
    metrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS); // Default to 30 days
        
        return await getOverviewMetrics(startDate, endDate);
      }),

    // Get daily KPIs for charts (spend & leads trend, ROAS trend)
    dailyKpis: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getDailyKpis(startDate, endDate);
      }),

    // Get email engagement metrics
    emailEngagement: publicProcedure.query(async () => {
      return await getEmailEngagement();
    }),

    // Get performance comparison by channel (Meta vs Google)
    channelPerformance: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getChannelPerformance(startDate, endDate);
      }),
  }),

  // Daily Analysis queries
  dailyAnalysis: router({
    // Get daily metrics for spreadsheet view
    metrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getDailyAnalysisMetrics(startDate, endDate);
      }),
  }),

  // Leads queries
  leads: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
      }).optional())
      .query(async ({ input }) => {
        return await getLeadsWithAttribution(input?.limit);
      }),
  }),

  // Orders/Purchases queries
  orders: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
      }).optional())
      .query(async ({ input }) => {
        return await getOrdersWithAttribution(input?.limit);
      }),
  }),

  // Ad Performance queries
  adPerformance: router({
    // Get ad performance by campaign (aggregated)
    byCampaign: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAdPerformanceByCampaign(input?.startDate, input?.endDate);
      }),

    // Get detailed ad performance (campaign + adset + ad level)
    detailed: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        campaignId: z.string().optional(),
        adsetId: z.string().optional(),
        adId: z.string().optional(),
        platform: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAdPerformanceDetailed(input);
      }),

    // Get ad hierarchy (campaigns, adsets, ads) for filters
    hierarchy: publicProcedure.query(async () => {
      return await getAdHierarchy();
    }),

    // Get landing page view metrics
    landingPageMetrics: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getLandingPageMetrics(input?.startDate, input?.endDate);
      }),
  }),

  // Daily attendance queries
  attendance: router({
    daily: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getDailyAttendance(input?.startDate, input?.endDate);
      }),
  }),

  // Engagement & Sales queries (View 3)
  engagement: router({
    // Get engagement metrics (attendance)
    metrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getEngagementMetrics(startDate, endDate);
      }),

    // Get high-ticket sales
    highTicketSales: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getHighTicketSales(startDate, endDate);
      }),

    // Get full funnel metrics (VIP + HT revenue, ROAS, CPA)
    fullFunnel: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getFullFunnelMetrics(startDate, endDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
