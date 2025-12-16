import { COOKIE_NAME } from "@shared/const";
import { DATE_RANGES, getDateRangeValues, type DateRange } from "@shared/constants";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDailyKpis,
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
  getFunnelConversionMetrics,
} from "./supabase";
import { getOverviewMetricsOptimized } from "./supabase-optimized";
import { getDailyMetricsFromEdgeFunction, transformDailyMetricsForUI } from "./supabase-daily";
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
import { isGA4Configured } from "./ga4";
import {
  syncGA4Metrics,
  getAggregatedGA4Metrics,
  getLatestGA4SyncDate,
} from "./ga4-db";
import {
  analyzeAdPerformance,
  detectFunnelLeaks,
  detectCreativeFatigue,
} from "./optimization-engine";
import { cache } from "./cache";
import {
  generateDailyReport,
  explainRecommendation,
  explainFunnelLeak,
} from "./optimization-llm";
import { getRecentAlerts, checkAllAlerts } from "./alert-service";
import { getProductsWithSales } from "./products";import {
  createInvite,
  getAllInvites,
  revokeInvite,
  deleteInvite,
} from "./invites";
import {
  generateDailySummary,
  upsertDiaryEntry,
  getDiaryEntry,
  getDiaryEntries,
  createDiaryAction,
  getDiaryActions,
  updateDiaryAction,
  updateDiaryActionStatus,
} from "./diary";
import { invokeLLM } from "./_core/llm";
import { getFunnelMetrics, getVSLMetrics } from "./funnel";
import { getPaidAdsContactIds, getOrganicContactIds } from "./wisdom-filter";


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
    // Clear server-side cache to force fresh data fetch
    clearCache: publicProcedure.mutation(async () => {
      console.log('[Cache] Clearing all overview cache entries');
      await cache.clear();
      return { success: true, message: 'Cache cleared successfully' };
    }),

    // Get unified dashboard metrics from SQL function (single optimized query)
    unifiedMetrics: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const startDate = input?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = input?.endDate || new Date().toISOString().split('T')[0];
        
        const cacheKey = `overview:unifiedMetrics:${startDate}:${endDate}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Unified Metrics] Returning cached result');
          return cached;
        }
        
        console.log(`[Unified Metrics] Fetching data for ${startDate} to ${endDate}`);
        
        const [metricsResult, journalsResult] = await Promise.all([
          supabase.rpc('get_dashboard_metrics', {
            p_start_date: startDate,
            p_end_date: endDate,
          }),
          supabase.rpc('get_journals_metrics', {
            p_start_date: startDate,
            p_end_date: endDate,
          }),
        ]);
        
        if (metricsResult.error) {
          console.error('[Unified Metrics] Error:', metricsResult.error);
          throw new Error(`Failed to fetch unified metrics: ${metricsResult.error.message}`);
        }
        
        // Combine metrics with journals data
        const result = {
          ...metricsResult.data,
          journals: journalsResult.data || {
            wisdomJournals: 0,
            extraJournals: 0,
            totalJournals: 0,
            journalGoal: 20000,
            journalProgress: 0,
            journalsRemaining: 20000,
          },
        };
        
        // Cache for 2 minutes
        await cache.set(cacheKey, result, 2 * 60 * 1000);
        
        return result;
      }),

    // Get aggregated overview metrics (total leads, spend, CPL, ROAS, etc.)
    metrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS); // Default to 30 days
        
        // Cache key includes date range for proper invalidation
        const cacheKey = `overview:metrics:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Overview Metrics] Returning cached result');
          return cached;
        }
        
        console.log('[Overview Metrics] Cache miss, fetching fresh data');
        const result = await getOverviewMetricsOptimized(startDate, endDate);
        
        // Cache for 5 minutes
        await cache.set(cacheKey, result, 5 * 60 * 1000);
        
        return result;
      }),

    // Get daily KPIs for charts (spend & leads trend, ROAS trend)
    dailyKpis: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate} = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        // Cache key includes date range
        const cacheKey = `overview:dailyKpis:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Daily KPIs] Returning cached result');
          return cached;
        }
        
        console.log('[Daily KPIs] Cache miss, fetching fresh data');
        const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
        
        // Map to expected format for charts
        const result = dailyData.map(day => ({
          date: day.date,
          total_leads: day.totalOptins,
          vip_sales: day.totalVipSales,
          total_spend_meta: day.metaSpend,
          total_spend_google: day.googleSpend,
          roas: day.roas,
        }));
        
        // Cache for 10 minutes
        await cache.set(cacheKey, result, 10 * 60 * 1000);
        
        console.log(`[Daily KPIs] Returning ${result.length} days of data`);
        return result;
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
        
        // Cache key includes date range
        const cacheKey = `overview:channelPerformance:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Channel Performance] Returning cached result');
          return cached;
        }
        
        console.log('[Channel Performance] Cache miss, fetching fresh data');
        const result = await getChannelPerformance(startDate, endDate);
        
        // Cache for 2 minutes (fresher data for better UX)
        await cache.set(cacheKey, result, 2 * 60 * 1000);
        
        return result;
      }),

    // Get conversion funnel metrics (Lead → Wisdom+ → Kingdom Seekers → ManyChat → Bot Alerts)
    funnelMetrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        // Cache key includes date range
        const cacheKey = `overview:funnelMetrics:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Funnel Metrics] Returning cached result');
          return cached;
        }
        
        console.log('[Funnel Metrics] Cache miss, fetching fresh data');
        const result = await getFunnelMetrics(startDate, endDate);
        
        // Cache for 2 minutes (fresher data for better UX)
        await cache.set(cacheKey, result, 2 * 60 * 1000);
        
        return result;
      }),

    // Get Paid Ads funnel metrics (31daywisdom.com)
    paidAdsFunnel: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        // Cache key includes date range
        const cacheKey = `overview:paidAdsFunnel:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Paid Ads Funnel] Returning cached result');
          return cached;
        }
        
        console.log('[Paid Ads Funnel] Cache miss, fetching fresh data');
        const paidAdsContactIds = await getPaidAdsContactIds(startDate, endDate);
        const result = await getFunnelMetrics(startDate, endDate, paidAdsContactIds);
        
        // Cache for 2 minutes (fresher data for better UX)
        await cache.set(cacheKey, result, 2 * 60 * 1000);
        
        return result;
      }),

    // Get Organic/Affiliate funnel metrics (NOT 31daywisdom.com)
    organicFunnel: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        // Cache key includes date range
        const cacheKey = `overview:organicFunnel:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[Organic Funnel] Returning cached result');
          return cached;
        }
        
        console.log('[Organic Funnel] Cache miss, fetching fresh data');
        const organicContactIds = await getOrganicContactIds(startDate, endDate);
        const result = await getFunnelMetrics(startDate, endDate, organicContactIds);
        
        // Cache for 2 minutes (fresher data for better UX)
        await cache.set(cacheKey, result, 2 * 60 * 1000);
        
        return result;
      }),

    // Get VSL performance metrics from Vidalytics
    vslMetrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        // Cache key includes date range
        const cacheKey = `overview:vslMetrics:${input?.dateRange || DATE_RANGES.LAST_30_DAYS}`;
        const cached = await cache.get<any>(cacheKey);
        
        if (cached) {
          console.log('[VSL Metrics] Returning cached result');
          return cached;
        }
        
        console.log('[VSL Metrics] Cache miss, fetching fresh data');
        const result = await getVSLMetrics(startDate, endDate);
        
        // Cache for 30 minutes (video analytics change less frequently)
        await cache.set(cacheKey, result, 30 * 60 * 1000);
        
        return result;
      }),
  }),

  // Daily Analysis queries
  dailyAnalysis: router({
    // Get daily metrics for spreadsheet view (using optimized edge function)
    metrics: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        try {
          // Use the optimized edge function
          const data = await getDailyMetricsFromEdgeFunction(startDate, endDate);
          return transformDailyMetricsForUI(data);
        } catch (error) {
          console.error('[Daily Analysis] Edge function failed, falling back to legacy:', error);
          // Fallback to legacy function if edge function fails
          return await getDailyAnalysisMetrics(startDate, endDate);
        }
      }),
    
    // Get raw daily metrics from edge function (new format)
    metricsV2: publicProcedure
      .input(z.object({
        dateRange: z.enum([DATE_RANGES.TODAY, DATE_RANGES.YESTERDAY, DATE_RANGES.LAST_7_DAYS, DATE_RANGES.LAST_14_DAYS, DATE_RANGES.LAST_30_DAYS]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { startDate, endDate } = input?.dateRange 
          ? getDateRangeValues(input.dateRange)
          : getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
        
        return await getDailyMetricsFromEdgeFunction(startDate, endDate);
      }),
  }),

  // Contacts queries
  contacts: router({
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', input.id)
          .single();
        
        if (error) throw new Error(error.message);
        
        // Check if contact has Wisdom+ purchase (order_total >= $31)
        const { data: wisdomOrders } = await supabase
          .from('orders')
          .select('id, order_total')
          .eq('contact_id', input.id)
          .gte('order_total', 31);
        
        // Check if contact has Kingdom Seekers purchase (product_id 8)
        const { data: ksOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('contact_id', input.id)
          .eq('product_id', 8);
        
        // Check if contact has ManyChat connected (manychat_id exists)
        const manychat_connected = !!contact.manychat_id;
        
        // Check if contact subscribed to bot alerts (gold.ntn.request_accepted event)
        const { data: botAlertEvents } = await supabase
          .from('analytics_events')
          .select('id')
          .eq('contact_id', input.id)
          .eq('name', 'manychat.add_tag')
          .contains('value', { tag: 'gold.ntn.request_accepted' });
        
        return {
          ...contact,
          wisdom_plus_purchased: (wisdomOrders && wisdomOrders.length > 0) || false,
          kingdom_seekers_purchased: (ksOrders && ksOrders.length > 0) || false,
          manychat_connected,
          bot_alerts_subscribed: (botAlertEvents && botAlertEvents.length > 0) || false,
        };
      }),

    getActivities: publicProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await getContactActivities(input.contactId);
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

    getByContactId: publicProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('contact_id', input.contactId)
          .order('created_at', { ascending: false });
        
        if (error) throw new Error(error.message);
        return data || [];
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
        productId: z.number().optional(),
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

    // Invalidate cache (manual refresh)
    invalidateCache: publicProcedure
      .mutation(async () => {
        const cacheKey = "optimization:dailyReport";
        cache.delete(cacheKey);
        console.log("[Optimization] Cache invalidated manually");
        return { success: true, message: "Cache cleared. Next request will generate fresh report." };
      }),

    // Get cache metadata (last updated timestamp)
    getCacheMetadata: publicProcedure
      .query(async () => {
        const cacheKey = "optimization:dailyReport";
        const metadata = cache.getMetadata(cacheKey);
        
        if (!metadata) {
          return { cached: false, lastUpdated: null, expiresAt: null };
        }

        return {
          cached: true,
          lastUpdated: metadata.createdAt,
          expiresAt: metadata.expiresAt,
        };
      }),

    // Get LLM-powered daily report with insights
    dailyReport: publicProcedure
      .query(async () => {
        // Check cache first (TTL: 30 minutes)
        const cacheKey = "optimization:dailyReport";
        const cached = cache.get<any>(cacheKey);
        
        if (cached) {
          console.log("[Optimization] Returning cached daily report");
          return { ...cached, cached: true };
        }

        console.log("[Optimization] Generating fresh daily report (cache miss)");

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

        const result = {
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
          cached: false,
        };

        // Cache the result for 30 minutes
        cache.set(cacheKey, result, 30 * 60 * 1000);

        return result;
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

    // Interactive chat for custom analysis
    chat: publicProcedure
      .input(z.object({
        question: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Get current campaign data for context
        const adRecommendations = await analyzeAdPerformance();
        const funnelLeaks = await detectFunnelLeaks();
        const creativeFatigue = await detectCreativeFatigue();

        // Calculate metrics
        const ads = await getAdPerformanceDetailed();
        let total_spend = 0;
        let total_clicks = 0;
        let total_purchases = 0;

        for (const ad of ads) {
          total_spend += ad.spend || 0;
          total_clicks += ad.inline_link_clicks || 0;
          total_purchases += ad.purchases || 0;
        }

        const click_to_purchase_rate = total_clicks > 0 ? total_purchases / total_clicks : 0;
        const avg_cpp = total_purchases > 0 ? total_spend / total_purchases : 0;

        // Build context for LLM
        const context = `
Current Campaign Metrics (Last 30 Days):
- Total Spend: $${total_spend.toFixed(2)}
- Total Clicks: ${total_clicks}
- Total Purchases: ${total_purchases}
- Click-to-Purchase Rate: ${(click_to_purchase_rate * 100).toFixed(2)}%
- Average CPP: $${avg_cpp.toFixed(2)}

Active Recommendations: ${adRecommendations.length}
Funnel Leaks Detected: ${funnelLeaks.length}
Creative Fatigue Alerts: ${creativeFatigue.length}
`;

        // Call LLM with user question + context
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert marketing analyst for the 31-Day Wisdom Challenge campaign. Answer questions about campaign performance, provide actionable insights, and suggest optimizations based on the data provided.${context}`,
            },
            {
              role: "user",
              content: input.question,
            },
          ],
        });

        const answer = response.choices[0]?.message?.content || "Unable to generate response";

        return {
          question: input.question,
          answer,
          context: {
            total_spend,
            total_clicks,
            total_purchases,
            click_to_purchase_rate,
            avg_cpp,
          },
        };
      }),
  }),

  // Google Analytics 4 Integration
  ga4: router({
    // Check if GA4 is configured
    isConfigured: publicProcedure.query(() => {
      return { configured: isGA4Configured() };
    }),

    // Sync GA4 metrics for a date range
    sync: publicProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const insertedCount = await syncGA4Metrics(input.startDate, input.endDate);
        return {
          success: true,
          insertedCount,
          message: `Synced ${insertedCount} GA4 metrics`,
        };
      }),

    // Get aggregated GA4 metrics
    getMetrics: publicProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        const metrics = await getAggregatedGA4Metrics(input.startDate, input.endDate);
        return metrics || [];
      }),

    // Get latest sync date
    getLatestSync: publicProcedure.query(async () => {
      const latestDate = await getLatestGA4SyncDate();
      return { latestDate };
    }),
  }),

  // Alert System
  alerts: router({
    // Get recent alerts from database
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 10;
        return await getRecentAlerts(limit);
      }),

    // Manually trigger alert checks (for testing)
    checkNow: publicProcedure
      .mutation(async () => {
        await checkAllAlerts();
        return { success: true, message: "Alert checks completed" };
      }),
  }),

  // Products
  products: router({
    // Get all products with sales count and revenue
    list: publicProcedure.query(async () => {
      return await getProductsWithSales();
    }),
  }),

  // Invites (admin only)
  invites: router({
    // Create a new invite
    create: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        expiresInDays: z.number().min(1).max(30).default(7),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can create invites
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create invites");
        }

        const result = await createInvite(
          input.email,
          ctx.user.email || "unknown",
          input.expiresInDays
        );

        return result;
      }),

    // Get all invites (admin only)
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admin can view invites
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view invites");
      }

      return await getAllInvites();
    }),

    // Revoke an invite
    revoke: protectedProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can revoke invites
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can revoke invites");
        }

        await revokeInvite(input.inviteId);
        return { success: true };
      }),

    // Delete an invite
    delete: protectedProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can delete invites
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete invites");
        }

        await deleteInvite(input.inviteId);
        return { success: true };
      }),
  }),

  // Ads Diary router
  diary: router({
    // Get daily summary for a specific date
    getDailySummary: protectedProcedure
      .input(z.object({ date: z.string() })) // YYYY-MM-DD
      .query(async ({ input }) => {
        const date = new Date(input.date);
        const metrics = await generateDailySummary(date);
        return metrics;
      }),

    // Get diary entry for a specific date (includes metrics + actions)
    getEntry: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const date = new Date(input.date);
        const entry = await getDiaryEntry(date);
        
        if (!entry) {
          // Generate fresh summary if no entry exists
          const metrics = await generateDailySummary(date);
          return {
            date: input.date,
            metrics,
            actions: [],
          };
        }

        const actions = await getDiaryActions(entry.id);
        return {
          ...entry,
          actions,
        };
      }),

    // Get diary entries for a date range
    getEntries: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const entries = await getDiaryEntries(start, end);
        
        // Get actions for each entry
        const entriesWithActions = await Promise.all(
          entries.map(async (entry) => {
            const actions = await getDiaryActions(entry.id);
            return { ...entry, actions };
          })
        );
        
        return entriesWithActions;
      }),

    // Create a manual action
    createAction: protectedProcedure
      .input(
        z.object({
          date: z.string().optional(),
          category: z.string(),
          description: z.string(),
          status: z.enum(["pending", "in_progress", "completed", "verified", "cancelled"]).optional(),
          source: z.string().optional(),
          adId: z.string().optional(),
          adName: z.string().optional(),
          campaignId: z.string().optional(),
          campaignName: z.string().optional(),
          scheduledFor: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // If date provided, ensure diary entry exists
        let entryId: number | undefined;
        if (input.date) {
          const date = new Date(input.date);
          const metrics = await generateDailySummary(date);
          entryId = await upsertDiaryEntry(date, metrics);
        }

        const action = await createDiaryAction({
          entryId,
          actionType: input.source === "llm_suggestion" ? "llm_suggestion" : "manual",
          category: input.category,
          description: input.description,
          status: input.status || "pending",
          source: input.source || "Manual",
          adId: input.adId,
          adName: input.adName,
          campaignId: input.campaignId,
          campaignName: input.campaignName,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
          createdBy: ctx.user.email || "unknown",
        });

        return action;
      }),

    // Update action status
    updateActionStatus: protectedProcedure
      .input(
        z.object({
          actionId: z.number(),
          status: z.enum(["pending", "in_progress", "completed", "verified", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateDiaryActionStatus(input.actionId, input.status);
        return { success: true };
      }),

    // Update action (full update)
    updateAction: protectedProcedure
      .input(
        z.object({
          actionId: z.number(),
          category: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["pending", "in_progress", "completed", "verified", "cancelled"]).optional(),
          adId: z.string().optional(),
          adName: z.string().optional(),
          campaignId: z.string().optional(),
          campaignName: z.string().optional(),
          scheduledFor: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await updateDiaryAction({
          ...input,
        });
        return result;
      }),

    // Get all actions (with optional filters)
    getActions: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional(),
          entryId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getDiaryActions(input.entryId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
