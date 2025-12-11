import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { supabase } from "./supabase";
import { ENV } from "./_core/env";

/**
 * OAuth 2.0 configuration for Meta (Facebook) Marketing API
 */
const META_APP_ID = process.env.FACEBOOK_APP_ID || '';
const META_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
// Use the current deployment URL for OAuth redirects
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://3000-ig1e1vbns4a47yob3iskw-8dc196dc.manusvm.computer';
  }
  return 'https://3000-ig1e1vbns4a47yob3iskw-8dc196dc.manusvm.computer';
};

// Backend OAuth callback routes
const META_REDIRECT_URI = `${getBaseUrl()}/api/oauth/facebook/callback`;

/**
 * OAuth 2.0 configuration for Google Ads API
 * TODO: Add Google OAuth credentials to environment variables
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = `${getBaseUrl()}/api/oauth/google/callback`;

/**
 * Get Meta OAuth authorization URL
 */
export function getMetaAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    state: state || 'meta_oauth',
    scope: 'ads_read,ads_management',
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state: state || 'google_oauth',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Meta authorization code for access token
 */
export async function exchangeMetaCode(code: string) {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    redirect_uri: META_REDIRECT_URI,
    code,
  });
  
  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Meta OAuth Error: ${data.error.message}`);
  }
  
  // Get long-lived token (60 days)
  const longLivedParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    fb_exchange_token: data.access_token,
  });
  
  const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams.toString()}`);
  const longLivedData = await longLivedResponse.json();
  
  if (longLivedData.error) {
    throw new Error(`Meta Long-Lived Token Error: ${longLivedData.error.message}`);
  }
  
  return {
    accessToken: longLivedData.access_token,
    expiresIn: longLivedData.expires_in, // seconds
  };
}

/**
 * Exchange Google authorization code for access token
 */
export async function exchangeGoogleCode(code: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    code,
    grant_type: 'authorization_code',
  });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Google OAuth Error: ${data.error_description || data.error}`);
  }
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in, // seconds
  };
}

/**
 * Get Meta ad account info
 */
export async function getMetaAdAccount(accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message}`);
  }
  
  // Return first ad account
  const account = data.data?.[0];
  if (!account) {
    throw new Error('No ad accounts found');
  }
  
  return {
    adAccountId: account.id,
    accountName: account.name,
    accountStatus: account.account_status,
  };
}

/**
 * Save OAuth token to database
 */
export async function saveOAuthToken(platform: 'meta' | 'google', tokenData: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  adAccountId?: string;
  accountName?: string;
}) {
  const expiresAt = tokenData.expiresIn 
    ? new Date(Date.now() + tokenData.expiresIn * 1000)
    : null;
  
  // Upsert token (insert or update if exists)
  const { error } = await supabase
    .from('api_tokens')
    .upsert({
      platform,
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken || null,
      expires_at: expiresAt?.toISOString() || null,
      ad_account_id: tokenData.adAccountId || null,
      account_name: tokenData.accountName || null,
    }, {
      onConflict: 'platform',
    });
  
  if (error) {
    throw new Error(`Failed to save token: ${error.message}`);
  }
}

/**
 * Get stored OAuth token from database
 */
export async function getStoredToken(platform: 'meta' | 'google') {
  const { data, error } = await supabase
    .from('api_tokens')
    .select('*')
    .eq('platform', platform)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to get token: ${error.message}`);
  }
  
  return data || null;
}

/**
 * tRPC router for OAuth operations
 */
export const oauthRouter = router({
  // Get Meta OAuth URL
  getMetaAuthUrl: publicProcedure.query(() => {
    return { url: getMetaAuthUrl() };
  }),
  
  // Get Google OAuth URL
  getGoogleAuthUrl: publicProcedure.query(() => {
    return { url: getGoogleAuthUrl() };
  }),
  
  // Handle Meta OAuth callback
  handleMetaCallback: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Exchange code for token
      const { accessToken, expiresIn } = await exchangeMetaCode(input.code);
      
      // Get ad account info
      const { adAccountId, accountName } = await getMetaAdAccount(accessToken);
      
      // Save to database
      await saveOAuthToken('meta', {
        accessToken,
        expiresIn,
        adAccountId,
        accountName,
      });
      
      return {
        success: true,
        accountName,
        adAccountId,
      };
    }),
  
  // Handle Google OAuth callback
  handleGoogleCallback: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Exchange code for token
      const { accessToken, refreshToken, expiresIn } = await exchangeGoogleCode(input.code);
      
      // Save to database
      await saveOAuthToken('google', {
        accessToken,
        refreshToken,
        expiresIn,
      });
      
      return {
        success: true,
      };
    }),
  
  // Get connection status
  getConnectionStatus: publicProcedure.query(async () => {
    const metaToken = await getStoredToken('meta');
    const googleToken = await getStoredToken('google');
    
    return {
      meta: {
        connected: !!metaToken,
        accountName: metaToken?.account_name || null,
        adAccountId: metaToken?.ad_account_id || null,
        expiresAt: metaToken?.expires_at || null,
      },
      google: {
        connected: !!googleToken,
        expiresAt: googleToken?.expires_at || null,
      },
    };
  }),
  
  // Disconnect (delete token)
  disconnect: publicProcedure
    .input(z.object({
      platform: z.enum(['meta', 'google']),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('api_tokens')
        .delete()
        .eq('platform', input.platform);
      
      if (error) {
        throw new Error(`Failed to disconnect: ${error.message}`);
      }
      
      return { success: true };
    }),
});
