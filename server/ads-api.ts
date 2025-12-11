import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { supabase } from "./supabase";
import { CAMPAIGN_NAME_FILTER } from "@shared/constants";

/**
 * Test Meta Ads API connection
 */
async function testMetaAPI(accessToken: string, adAccountId: string) {
  const url = `https://graph.facebook.com/v18.0/${adAccountId}?fields=name,account_status&access_token=${accessToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message}`);
  }
  
  return {
    success: true,
    accountName: data.name,
    accountStatus: data.account_status,
  };
}

/**
 * Test Google Ads API connection
 */
async function testGoogleAdsAPI(refreshToken: string, customerId: string) {
  // For now, just validate the format
  // Full Google Ads API integration requires google-ads-api npm package
  if (!refreshToken.startsWith("1//")) {
    throw new Error("Invalid refresh token format");
  }
  
  if (!/^\d{3}-\d{3}-\d{4}$/.test(customerId)) {
    throw new Error("Invalid customer ID format (should be XXX-XXX-XXXX)");
  }
  
  return {
    success: true,
    customerId,
  };
}

/**
 * Fetch Meta Ads data and save to ad_performance table
 */
async function syncMetaAdsData(accessToken: string, adAccountId: string, startDate: string, endDate: string) {
  // Convert dates to Meta API format (YYYY-MM-DD)
  const since = startDate;
  const until = endDate;
  
  // Fetch insights at ad level
  const url = `https://graph.facebook.com/v18.0/${adAccountId}/insights?level=ad&time_range={"since":"${since}","until":"${until}"}&fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,clicks,impressions,inline_link_clicks,actions&access_token=${accessToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message}`);
  }
  
  // Transform and insert into ad_performance
  const rows = data.data || [];
  let insertedCount = 0;
  
  for (const row of rows) {
    // Extract conversions from actions array
    let conversions = 0;
    if (row.actions) {
      const purchaseAction = row.actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
      conversions = purchaseAction ? parseInt(purchaseAction.value) : 0;
    }
    
    const { error } = await supabase.from('ad_performance').insert({
      date: since, // Use start date for simplicity (Meta returns aggregated data)
      platform: 'meta',
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      adset_id: row.adset_id,
      adset_name: row.adset_name,
      ad_id: row.ad_id,
      ad_name: row.ad_name,
      spend: parseFloat(row.spend || '0'),
      clicks: parseInt(row.clicks || '0'),
      impressions: parseInt(row.impressions || '0'),
      inline_link_clicks: parseInt(row.inline_link_clicks || '0'),
      conversions,
      landing_page_view_per_link_click: null, // Meta specific field
    });
    
    if (!error) insertedCount++;
  }
  
  return insertedCount;
}

/**
 * Fetch Google Ads data (placeholder - requires google-ads-api package)
 */
async function syncGoogleAdsData(refreshToken: string, customerId: string, startDate: string, endDate: string) {
  // TODO: Implement Google Ads API integration
  // Requires: npm install google-ads-api
  // For now, return 0 to indicate no data synced
  console.log('[Google Ads] Sync not yet implemented, requires google-ads-api package');
  return 0;
}

export const adsRouter = router({
  testMetaConnection: publicProcedure
    .input(z.object({
      accessToken: z.string(),
      adAccountId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return testMetaAPI(input.accessToken, input.adAccountId);
    }),
  
  testGoogleConnection: publicProcedure
    .input(z.object({
      refreshToken: z.string(),
      customerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return testGoogleAdsAPI(input.refreshToken, input.customerId);
    }),
  
  syncAdData: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      metaConfig: z.object({
        accessToken: z.string(),
        adAccountId: z.string(),
      }).optional(),
      googleConfig: z.object({
        refreshToken: z.string(),
        customerId: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      let metaRows = 0;
      let googleRows = 0;
      
      // Sync Meta data if configured
      if (input.metaConfig) {
        metaRows = await syncMetaAdsData(
          input.metaConfig.accessToken,
          input.metaConfig.adAccountId,
          input.startDate,
          input.endDate
        );
      }
      
      // Sync Google data if configured
      if (input.googleConfig) {
        googleRows = await syncGoogleAdsData(
          input.googleConfig.refreshToken,
          input.googleConfig.customerId,
          input.startDate,
          input.endDate
        );
      }
      
      return {
        metaRows,
        googleRows,
        totalRows: metaRows + googleRows,
      };
    }),
});
