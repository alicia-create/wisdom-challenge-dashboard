import { COOKIE_NAME } from "@shared/const";
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
    metrics: publicProcedure.query(async () => {
      return await getOverviewMetrics();
    }),

    // Get daily KPIs for charts (spend & leads trend, ROAS trend)
    dailyKpis: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getDailyKpis(input?.startDate, input?.endDate);
      }),

    // Get email engagement metrics
    emailEngagement: publicProcedure.query(async () => {
      return await getEmailEngagement();
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
});

export type AppRouter = typeof appRouter;
