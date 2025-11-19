import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDailyKpis,
  getOverviewMetrics,
  getLeadsWithAttribution,
  getOrdersWithAttribution,
  getAdPerformanceByCampaign,
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

  // Dashboard data routers
  dashboard: router({
    // Get overview metrics (total leads, spend, ROAS, etc.)
    overview: protectedProcedure.query(async () => {
      const metrics = await getOverviewMetrics();
      return metrics;
    }),

    // Get daily KPIs with optional date range filter
    dailyKpis: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const kpis = await getDailyKpis(input?.startDate, input?.endDate);
        return kpis;
      }),

    // Get leads with UTM attribution
    leads: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(100),
        }).optional()
      )
      .query(async ({ input }) => {
        const leads = await getLeadsWithAttribution(input?.limit || 100);
        return leads;
      }),

    // Get orders with UTM attribution
    orders: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(100),
        }).optional()
      )
      .query(async ({ input }) => {
        const orders = await getOrdersWithAttribution(input?.limit || 100);
        return orders;
      }),

    // Get ad performance by campaign
    adPerformance: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const performance = await getAdPerformanceByCampaign(input?.startDate, input?.endDate);
        return performance;
      }),

    // Get daily attendance
    attendance: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const attendance = await getDailyAttendance(input?.startDate, input?.endDate);
        return attendance;
      }),

    // Get email engagement metrics
    emailEngagement: protectedProcedure.query(async () => {
      const engagement = await getEmailEngagement();
      return engagement;
    }),
  }),
});

export type AppRouter = typeof appRouter;
