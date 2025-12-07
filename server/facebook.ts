import { ENV } from "./_core/env";

/**
 * Facebook Marketing API helper
 * Docs: https://developers.facebook.com/docs/marketing-api/
 */

const FACEBOOK_API_BASE = "https://graph.facebook.com/v21.0";

interface FacebookAudience {
  id: string;
  name: string;
  approximate_count_lower_bound?: number;
  approximate_count_upper_bound?: number;
  subtype?: string; // CUSTOM, LOOKALIKE, SAVED_AUDIENCE
  time_created?: string;
  time_updated?: string;
}

interface FacebookAdAccount {
  id: string;
  name: string;
  account_id: string;
}

/**
 * Check if Facebook API is configured
 */
export function isFacebookConfigured(): boolean {
  return !!(ENV.facebookAppId && ENV.facebookAppSecret && ENV.facebookAccessToken);
}

/**
 * Make authenticated request to Facebook API
 */
async function facebookRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!isFacebookConfigured()) {
    throw new Error("Facebook API not configured");
  }

  const url = new URL(`${FACEBOOK_API_BASE}${endpoint}`);
  url.searchParams.set("access_token", ENV.facebookAccessToken);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get all ad accounts accessible by the access token
 */
export async function getAdAccounts(): Promise<FacebookAdAccount[]> {
  const response = await facebookRequest<{ data: FacebookAdAccount[] }>("/me/adaccounts", {
    fields: "id,name,account_id",
  });

  return response.data;
}

/**
 * Get all audiences (custom audiences, lookalike audiences, saved audiences) for an ad account
 */
export async function getAudiences(adAccountId: string): Promise<FacebookAudience[]> {
  const response = await facebookRequest<{ data: FacebookAudience[] }>(`/${adAccountId}/customaudiences`, {
    fields: "id,name,approximate_count_lower_bound,approximate_count_upper_bound,subtype,time_created,time_updated",
    limit: "500", // Max 500 per request
  });

  return response.data;
}

/**
 * Get all audiences across all accessible ad accounts
 */
export async function getAllAudiences(): Promise<Array<FacebookAudience & { ad_account_id: string }>> {
  const adAccounts = await getAdAccounts();
  console.log(`[Facebook] Found ${adAccounts.length} ad accounts`);
  const allAudiences: Array<FacebookAudience & { ad_account_id: string }> = [];

  for (const adAccount of adAccounts) {
    try {
      console.log(`[Facebook] Fetching audiences for ${adAccount.id}...`);
      const audiences = await getAudiences(adAccount.id);
      console.log(`[Facebook] Found ${audiences.length} audiences for ${adAccount.id}`);
      audiences.forEach(audience => {
        allAudiences.push({
          ...audience,
          ad_account_id: adAccount.id,
        });
      });
    } catch (error) {
      console.error(`[Facebook] Failed to fetch audiences for ${adAccount.id}:`, error);
    }
  }

  console.log(`[Facebook] Total audiences collected: ${allAudiences.length}`);
  return allAudiences;
}
