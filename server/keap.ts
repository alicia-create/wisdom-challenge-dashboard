/**
 * Keap API Integration
 * 
 * Handles OAuth 2.0 authentication and API calls to Keap (Infusionsoft) REST API
 * Documentation: https://developer.infusionsoft.com/docs/rest/
 */

import { ENV } from './_core/env';
import { getDb } from './db';
import { keapTokens } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Keap OAuth 2.0 Configuration
const KEAP_CLIENT_ID = ENV.keapClientId;
const KEAP_CLIENT_SECRET = ENV.keapClientSecret;
const KEAP_APP_ID = ENV.keapAppId;
const KEAP_BASE_URL = 'https://api.infusionsoft.com/crm/rest/v1';
const KEAP_TOKEN_URL = 'https://api.infusionsoft.com/token';

// In-memory token cache
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Load tokens from database
 */
async function loadTokens(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Keap] Database not available, skipping token load');
      return;
    }

    const result = await db.select().from(keapTokens).where(eq(keapTokens.id, 1)).limit(1);
    
    if (result.length > 0) {
      const tokens = result[0];
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      tokenExpiresAt = tokens.expiresAt.getTime();
      console.log('[Keap] Tokens loaded from database');
    }
  } catch (error) {
    console.error('[Keap] Failed to load tokens from database:', error);
  }
}

/**
 * Save tokens to database
 */
async function saveTokens(): Promise<void> {
  if (!accessToken || !refreshToken || !tokenExpiresAt) {
    console.warn('[Keap] Cannot save tokens: missing required values');
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Keap] Database not available, skipping token save');
      return;
    }

    const expiresAt = new Date(tokenExpiresAt);
    
    // Upsert: insert or update if id=1 already exists
    await db.insert(keapTokens).values({
      id: 1,
      accessToken,
      refreshToken,
      expiresAt,
    }).onDuplicateKeyUpdate({
      set: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    console.log('[Keap] Tokens saved to database');
  } catch (error) {
    console.error('[Keap] Failed to save tokens to database:', error);
  }
}

// Load tokens on module initialization (async)
let tokensLoadPromise: Promise<void> | null = null;
tokensLoadPromise = loadTokens().catch(err => {
  console.error('[Keap] Failed to load tokens on init:', err);
});

/**
 * Ensure tokens are loaded before making API calls
 */
async function ensureTokensLoaded(): Promise<void> {
  if (tokensLoadPromise) {
    await tokensLoadPromise;
    tokensLoadPromise = null;
  }
}

/**
 * Check if we have valid credentials
 */
function hasCredentials(): boolean {
  return !!(KEAP_CLIENT_ID && KEAP_CLIENT_SECRET && KEAP_APP_ID);
}

/**
 * Check if access token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(): boolean {
  if (!tokenExpiresAt) return true;
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  return tokenExpiresAt < fiveMinutesFromNow;
}

/**
 * Exchange authorization code for access token (initial OAuth flow)
 * This should be called from a callback endpoint after user authorizes
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<void> {
  if (!hasCredentials()) {
    throw new Error('Keap credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: KEAP_CLIENT_ID!,
    client_secret: KEAP_CLIENT_SECRET!,
  });

  const response = await fetch(KEAP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  // Save tokens to file
  saveTokens();

  console.log('[Keap] Access token obtained successfully');
}

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken(): Promise<void> {
  if (!hasCredentials() || !refreshToken) {
    throw new Error('Cannot refresh token: missing credentials or refresh token');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: KEAP_CLIENT_ID!,
    client_secret: KEAP_CLIENT_SECRET!,
  });

  const response = await fetch(KEAP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  if (data.refresh_token) {
    refreshToken = data.refresh_token;
  }
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  // Save tokens to file
  saveTokens();

  console.log('[Keap] Access token refreshed successfully');
}

/**
 * Get valid access token (refresh if needed)
 */
async function getAccessToken(): Promise<string> {
  // Ensure tokens are loaded from database first
  await ensureTokensLoaded();

  if (!accessToken || isTokenExpired()) {
    if (refreshToken) {
      await refreshAccessToken();
    } else {
      throw new Error('No access token available. Please complete OAuth flow first.');
    }
  }
  return accessToken!;
}

/**
 * Make authenticated API call to Keap
 */
async function keapRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const url = `${KEAP_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Keap API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ============================================================================
// TAG ENDPOINTS
// ============================================================================

export interface KeapTag {
  id: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface KeapTagsResponse {
  tags: KeapTag[];
  count?: number;
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<KeapTag[]> {
  const response = await keapRequest<KeapTagsResponse>('/tags');
  return response.tags || [];
}

/**
 * Get contacts with a specific tag
 */
export interface KeapContact {
  id: number;
  given_name?: string;
  family_name?: string;
  email_addresses?: Array<{ email: string; field: string }>;
  phone_numbers?: Array<{ number: string; field: string }>;
  date_created?: string;
  last_updated?: string;
  tag_ids?: number[];
}

export interface KeapContactsResponse {
  contacts: KeapContact[];
  count: number;
  next?: string;
  previous?: string;
}

export async function getContactsByTag(
  tagId: number,
  limit: number = 1000,
  offset: number = 0
): Promise<KeapContactsResponse> {
  const endpoint = `/tags/${tagId}/contacts?limit=${limit}&offset=${offset}`;
  return keapRequest<KeapContactsResponse>(endpoint);
}

/**
 * Get count of contacts with a specific tag
 */
export async function getTagContactCount(tagId: number): Promise<number> {
  const response = await getContactsByTag(tagId, 1, 0);
  return response.count;
}

/**
 * Get counts for multiple tags (optimized)
 */
export async function getTagCounts(tagIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  
  // Fetch counts in parallel
  const promises = tagIds.map(async (tagId) => {
    try {
      const count = await getTagContactCount(tagId);
      counts.set(tagId, count);
    } catch (error) {
      console.error(`[Keap] Failed to get count for tag ${tagId}:`, error);
      counts.set(tagId, 0);
    }
  });

  await Promise.all(promises);
  return counts;
}

// ============================================================================
// EMAIL ENGAGEMENT METRICS
// ============================================================================

/**
 * Calculate email engagement metrics based on tags
 */
export async function getEmailEngagementMetrics() {
  // Tag IDs from keap-tags-mapping.md
  const REMINDER_OPTIN = 14827;
  const REPLAY_OPTIN = 14831;
  const PROMO_OPTIN = 14835;
  const REMINDER_OPTOUT = 14829;
  const REPLAY_OPTOUT = 14833;
  const PROMO_OPTOUT = 14837;
  const CLICKED_NTN = 14859;

  const tagIds = [
    REMINDER_OPTIN,
    REPLAY_OPTIN,
    PROMO_OPTIN,
    REMINDER_OPTOUT,
    REPLAY_OPTOUT,
    PROMO_OPTOUT,
    CLICKED_NTN,
  ];

  const counts = await getTagCounts(tagIds);

  const reminderOptins = counts.get(REMINDER_OPTIN) || 0;
  const replayOptins = counts.get(REPLAY_OPTIN) || 0;
  const promoOptins = counts.get(PROMO_OPTIN) || 0;
  const reminderOptouts = counts.get(REMINDER_OPTOUT) || 0;
  const replayOptouts = counts.get(REPLAY_OPTOUT) || 0;
  const promoOptouts = counts.get(PROMO_OPTOUT) || 0;
  const emailClickers = counts.get(CLICKED_NTN) || 0;

  // Broadcast subscribers = anyone opted in to at least one email type
  // (Note: this is an approximation - actual count would require checking contacts with ANY of these tags)
  const broadcastSubscribers = Math.max(reminderOptins, replayOptins, promoOptins);

  return {
    broadcastSubscribers,
    reminderOptins,
    replayOptins,
    promoOptins,
    reminderOptouts,
    replayOptouts,
    promoOptouts,
    emailClickers,
    // Click rate would need total emails sent (not available from tags alone)
    // clickRate: (emailClickers / totalSent) * 100
  };
}

// ============================================================================
// LEAD QUALITY METRICS (LIST DEFENDER)
// ============================================================================

/**
 * Get lead quality distribution from List Defender tags
 */
export async function getLeadQualityMetrics() {
  // Traffic Light Status
  const GREEN = 14789;
  const YELLOW = 14793;
  const RED = 14791;

  // Engagement Levels
  const HIGH_ENGAGEMENT = 14799;
  const LOW_ENGAGEMENT = 14801;
  const NEVER_ENGAGED = 14805;
  const SLIPPING = 14807;
  const NEVER_SENT = 14803;

  // Risk Flags
  const DISPOSABLE = 14783;
  const SUSPICIOUS = 14787;
  const INVALID_STRUCTURE = 14761;
  const MISSING_DNS = 14763;
  const MISSING_MX = 14765;
  const INVALID_MX = 14767;
  const NOT_FOUND = 14769;

  const tagIds = [
    GREEN, YELLOW, RED,
    HIGH_ENGAGEMENT, LOW_ENGAGEMENT, NEVER_ENGAGED, SLIPPING, NEVER_SENT,
    DISPOSABLE, SUSPICIOUS,
    INVALID_STRUCTURE, MISSING_DNS, MISSING_MX, INVALID_MX, NOT_FOUND,
  ];

  const counts = await getTagCounts(tagIds);

  const green = counts.get(GREEN) || 0;
  const yellow = counts.get(YELLOW) || 0;
  const red = counts.get(RED) || 0;
  const total = green + yellow + red;

  const invalidEmails = 
    (counts.get(INVALID_STRUCTURE) || 0) +
    (counts.get(MISSING_DNS) || 0) +
    (counts.get(MISSING_MX) || 0) +
    (counts.get(INVALID_MX) || 0) +
    (counts.get(NOT_FOUND) || 0);

  return {
    trafficLight: {
      green,
      yellow,
      red,
      total,
      greenPercent: total > 0 ? (green / total) * 100 : 0,
      yellowPercent: total > 0 ? (yellow / total) * 100 : 0,
      redPercent: total > 0 ? (red / total) * 100 : 0,
    },
    engagement: {
      high: counts.get(HIGH_ENGAGEMENT) || 0,
      low: counts.get(LOW_ENGAGEMENT) || 0,
      neverEngaged: counts.get(NEVER_ENGAGED) || 0,
      slipping: counts.get(SLIPPING) || 0,
      neverSent: counts.get(NEVER_SENT) || 0,
    },
    riskFlags: {
      disposable: counts.get(DISPOSABLE) || 0,
      suspicious: counts.get(SUSPICIOUS) || 0,
      invalidEmails,
    },
  };
}

// ============================================================================
// WISDOM CHALLENGE TAG DISTRIBUTION
// ============================================================================

/**
 * Get Wisdom Challenge tag distribution
 */
export async function getWisdomTagDistribution() {
  const VIP_BUYER_HISTORICAL = 14753;
  const VIP_BUYER_TRIGGER = 14749;
  const JOURNAL_BUYER = 14813;
  const KINGDOM_SEEKER_TRIAL = 14857;
  const OPTIN_HISTORICAL = 14705;
  const OPTIN_TRIGGER = 14703;

  const tagIds = [
    VIP_BUYER_HISTORICAL,
    VIP_BUYER_TRIGGER,
    JOURNAL_BUYER,
    KINGDOM_SEEKER_TRIAL,
    OPTIN_HISTORICAL,
    OPTIN_TRIGGER,
  ];

  const counts = await getTagCounts(tagIds);

  const vipBuyers = (counts.get(VIP_BUYER_HISTORICAL) || 0) + (counts.get(VIP_BUYER_TRIGGER) || 0);
  const totalOptins = (counts.get(OPTIN_HISTORICAL) || 0) + (counts.get(OPTIN_TRIGGER) || 0);

  return {
    totalOptins,
    vipBuyers,
    journalBuyers: counts.get(JOURNAL_BUYER) || 0,
    kingdomSeekerTrials: counts.get(KINGDOM_SEEKER_TRIAL) || 0,
    vipTakeRate: totalOptins > 0 ? (vipBuyers / totalOptins) * 100 : 0,
  };
}

// ============================================================================
// MANUAL TOKEN SETUP (FOR TESTING)
// ============================================================================

/**
 * Manually set tokens (for testing or if you already have tokens)
 * In production, tokens should be stored in database
 */
export function setTokens(access: string, refresh: string, expiresIn: number = 3600) {
  accessToken = access;
  refreshToken = refresh;
  tokenExpiresAt = Date.now() + (expiresIn * 1000);
  console.log('[Keap] Tokens set manually');
}

/**
 * Get OAuth authorization URL for user to grant access
 */
export function getAuthorizationUrl(redirectUri: string, state?: string): string {
  if (!KEAP_CLIENT_ID) {
    throw new Error('KEAP_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: KEAP_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'full', // Request full access
  });

  if (state) {
    params.append('state', state);
  }

  return `https://accounts.infusionsoft.com/app/oauth/authorize?${params.toString()}`;
}

/**
 * Check if Keap integration is configured and ready
 */
export function isKeapConfigured(): boolean {
  return hasCredentials() && !!accessToken;
}
