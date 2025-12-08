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
  getLeadsPaginated,
  getPurchasesPaginated,
  getGoogleCampaignsPaginated,
  getMetaCampaignsPaginated,
} from "./supabase";
import {
  getContactActivities,
  getContactActivitySummary,
  getContactTimeline,
} from "./supabase-activities";
import { getWorkflowErrors, getWorkflowErrorStats } from "./workflow-errors";
import {
  getEmailEngagementMetrics,
  getLeadQualityMetrics,
  getWisdomTagDistribution,
  isKeapConfigured,
} from "./keap";
import {
  syncFacebookAudiences,
  getFacebookAudiencesFromDb,
} from "./facebook-db";
import { isFacebookConfigured } from "./facebook";
import { supabase } from "./supabase";
import {
  analyzeAdPerformance,
  detectFunnelLeaks,
  detectCreativeFatigue,
} from "./optimization-engine";
import {
  generateDailyReport,
  explainRecommendation,
  explainFunnelLeak,
} from "./optimization-llm";

export const appRouter = router({
  system: systemRouter,
  
  // Facebook API integration
  facebook: router({
    status: publicProcedure.query(() => {
      return { configured: isFacebookConfigured() };
    }),

    audiences: publicProcedure.query(async () => {
      if (!isFacebookConfigured()) {
        throw new Error('Facebook not configured');
      }
      return await getFacebookAudiencesFromDb();
    }),

    sync: publicProcedure.mutation(async () => {
      if (!isFacebookConfigured()) {
        throw new Error('Facebook not configured');
      }
      const count = await syncFacebookAudiences();
      return { success: true, count };
    }),
  }),

  // Keap API integration
  keap: router({    status: publicProcedure.query(() => {
      return { configured: isKeapConfigured() };
    }),

    emailEngagement: publicProcedure.query(async () => {
      if (!isKeapConfigured()) {
        throw new Error('Keap not configured. Please authorize at /api/keap/auth');
      }
      return await getEmailEngagementMetrics();
    }),

    leadQuality: publicProcedure.query(async () => {
      if (!isKeapConfigured()) {
        throw new Error('Keap not configured. Please authorize at /api/keap/auth');
      }
      return await getLeadQualityMetrics();
    }),

    wisdomTags: publicProcedure.query(async () => {
      if (!isKeapConfigured()) {
        throw new Error('Keap not configured. Please authorize at /api/keap/auth');
      }
      return await getWisdomTagDistribution();
    }),
  }),

  // Workflow error logs from n8n
  logs: router({
    list: publicProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
        search: z.string().optional(),
        workflowName: z.string().optional(),
        errorNode: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getWorkflowErrors(input || {});
      }),
    stats: publicProcedure.query(async () => {
      return await getWorkflowErrorStats();
    }),
  }),
  
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
        
        const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
        
        // Map to expected format for charts
        return dailyData.map(day => ({
          date: day.date,
          total_leads: day.totalOptins,
          total_spend_meta: day.metaSpend,
          total_spend_google: day.googleSpend,
          roas: day.roas,
        }));
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

  // Debug pages for viewing raw data
  debug: router({
    // Get paginated leads with filters
    leads: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getLeadsPaginated(input || {});
      }),

    // Get paginated purchases with filters
    purchases: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getPurchasesPaginated(input || {});
      }),

    // Get paginated Google campaigns with filters
    googleCampaigns: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getGoogleCampaignsPaginated(input || {});
      }),

    // Get paginated Meta campaigns with filters
    metaCampaigns: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getMetaCampaignsPaginated(input || {});
      }),

    // Get all activities for a contact
    contactActivities: publicProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getContactActivities(input.contactId);
      }),

    // Get activity summary for a contact
    contactActivitySummary: publicProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getContactActivitySummary(input.contactId);
      }),

    // Get timeline of key events for a contact
    contactTimeline: publicProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getContactTimeline(input.contactId);
      }),
  }),

  // Optimization Agent
  optimization: router({
    // Get ad-level recommendations
    adRecommendations: publicProcedure
      .query(async () => {
        return await analyzeAdPerformance();
      }),

    // Get funnel leak analysis
    funnelLeaks: publicProcedure
      .query(async () => {
        return await detectFunnelLeaks();
      }),

    // Get creative fatigue alerts
    creativeFatigue: publicProcedure
      .query(async () => {
        return await detectCreativeFatigue();
      }),

    // Get LLM-powered daily report with insights
    dailyReport: publicProcedure
      .query(async () => {
        // Fetch all optimization data
        const adRecommendations = await analyzeAdPerformance();
        const funnelLeaks = await detectFunnelLeaks();
        const creativeFatigue = await detectCreativeFatigue();

        // Calculate campaign metrics from ad performance data
        const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_7_DAYS);
        const { data: ads } = await supabase
          .from("ad_performance")
          .select("*")
          .eq("campaign_name", "31DWC2026")
          .gte("date", startDate)
          .lte("date", endDate);

        let total_spend = 0;
        let total_clicks = 0;
        let total_purchases = 0;

        if (ads) {
          for (const ad of ads) {
            total_spend += ad.spend || 0;
            total_clicks += ad.inline_link_clicks || 0;
            total_purchases += ad.purchases || 0;
          }
        }

        const click_to_purchase_rate = total_clicks > 0 ? total_purchases / total_clicks : 0;
        const avg_cpp = total_purchases > 0 ? total_spend / total_purchases : 0;

        // Generate LLM-powered insights
        const insights = await generateDailyReport(
          adRecommendations,
          funnelLeaks,
          creativeFatigue,
          {
            total_spend,
            total_clicks,
            total_purchases,
            click_to_purchase_rate,
            avg_cpp,
          }
        );

        return {
          insights,
          metrics: {
            total_spend,
            total_clicks,
            total_purchases,
            click_to_purchase_rate,
            avg_cpp,
          },
          recommendations: adRecommendations,
          funnel_leaks: funnelLeaks,
          creative_fatigue: creativeFatigue,
        };
      }),

    // Get detailed explanation for a specific recommendation
    explainRecommendation: publicProcedure
      .input(z.object({
        recommendationId: z.string(),
      }))
      .query(async ({ input }) => {
        // In a real implementation, fetch the recommendation from database
        // For now, we'll need to re-run the analysis
        const recommendations = await analyzeAdPerformance();
        const recommendation = recommendations.find((r) => r.id === input.recommendationId);

        if (!recommendation) {
          throw new Error("Recommendation not found");
        }

        return await explainRecommendation(recommendation);
      }),

    // Get explanation for a funnel leak
    explainFunnelLeak: publicProcedure
      .input(z.object({
        leakType: z.string(),
      }))
      .query(async ({ input }) => {
        const leaks = await detectFunnelLeaks();
        const leak = leaks.find((l) => l.type === input.leakType);

        if (!leak) {
          throw new Error("Funnel leak not found");
        }

        return await explainFunnelLeak(leak);
      }),
  }),
});

export type AppRouter = typeof appRouter;
