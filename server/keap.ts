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
// API returns contact wrapped in an object with date_applied
export interface KeapTaggedContact {
  contact: {
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  date_applied: string;
}

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
  contacts: KeapTaggedContact[]; // When fetching by tag, contacts are wrapped
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
 * Fetch ALL contacts for a tag with pagination
 */
async function getAllContactsForTag(tagId: number): Promise<Set<number>> {
  const allContacts = new Set<number>();
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  console.log(`[Keap] Fetching all contacts for tag ${tagId}...`);

  while (hasMore) {
    try {
      const response = await getContactsByTag(tagId, limit, offset);
      console.log(`[Keap] Tag ${tagId} - offset ${offset}: got ${response.contacts.length} contacts`);
      
      // Debug: log first contact structure
      if (response.contacts.length > 0 && offset === 0) {
        console.log(`[Keap] First contact structure:`, JSON.stringify(response.contacts[0], null, 2));
      }
      
      // Add contacts to set
      // API returns: { contact: { id, email, ... }, date_applied }
      for (const item of response.contacts) {
        if (item && item.contact && item.contact.id) {
          allContacts.add(item.contact.id);
        } else {
          console.warn(`[Keap] Tag ${tagId} - invalid contact:`, item);
        }
      }

      // Check if there are more contacts
      hasMore = response.contacts.length === limit;
      offset += limit;

      // Safety limit: don't fetch more than 10k contacts per tag
      if (offset >= 10000) {
        console.warn(`[Keap] Reached safety limit for tag ${tagId}, stopping at ${offset} contacts`);
        break;
      }
    } catch (error) {
      console.error(`[Keap] Failed to fetch contacts for tag ${tagId} at offset ${offset}:`, error);
      break;
    }
  }

  console.log(`[Keap] Tag ${tagId} - total unique contacts: ${allContacts.size}`);
  return allContacts;
}

/**
 * Get contacts that have ANY of the specified tags (union)
 * This is used to filter by Wisdom tags
 * Uses pagination to fetch ALL contacts, not just first 1000
 */
export async function getContactsWithAnyTags(tagIds: number[]): Promise<Set<number>> {
  if (tagIds.length === 0) return new Set();

  // Fetch ALL contacts for each tag with pagination
  const contactSets = await Promise.all(
    tagIds.map(tagId => getAllContactsForTag(tagId))
  );

  // Find union of all sets
  const union = new Set<number>();
  for (const set of contactSets) {
    for (const id of Array.from(set)) {
      union.add(id);
    }
  }

  console.log(`[Keap] Wisdom contacts total: ${union.size}`);
  return union;
}

/**
 * Get count of contacts that have ANY of the specified tags
 */
export async function getCountWithAnyTags(tagIds: number[]): Promise<number> {
  const contacts = await getContactsWithAnyTags(tagIds);
  return contacts.size;
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
 * Wisdom Challenge tag IDs for filtering
 * Anyone with ANY of these tags is considered part of the Wisdom Challenge
 * Note: Trigger tags are excluded as they only activate automations
 */
const WISDOM_TAGS = [
  14705, // Historical - 31DWC - 2601 - Optin
  14739, // Status - 31DWC - 2601 - NTN General Opt In
  14741, // Status - 31DWC - 2601 - NTN VIP Opt In
];

/**
 * Calculate email engagement metrics based on tags
 * Returns both total and Wisdom-filtered metrics
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

  // Get Wisdom-filtered metrics
  // Fetch contacts with Wisdom tags (anyone with ANY Wisdom tag)
  const wisdomContacts = await getContactsWithAnyTags(WISDOM_TAGS);
  
  // Get contacts for each email tag
  const [reminderOptinContacts, replayOptinContacts, promoOptinContacts, clickedContacts] = await Promise.all([
    getContactsByTag(REMINDER_OPTIN, 1000, 0),
    getContactsByTag(REPLAY_OPTIN, 1000, 0),
    getContactsByTag(PROMO_OPTIN, 1000, 0),
    getContactsByTag(CLICKED_NTN, 1000, 0),
  ]);

  // Filter by Wisdom contacts
  const wisdomReminderOptins = reminderOptinContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomReplayOptins = replayOptinContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomPromoOptins = promoOptinContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomEmailClickers = clickedContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  
  const wisdomBroadcastSubscribers = Math.max(wisdomReminderOptins, wisdomReplayOptins, wisdomPromoOptins);
  const wisdomClickRate = wisdomBroadcastSubscribers > 0 
    ? (wisdomEmailClickers / wisdomBroadcastSubscribers) * 100 
    : 0;

  return {
    // Total metrics (all contacts)
    broadcastSubscribers,
    reminderOptins,
    replayOptins,
    promoOptins,
    reminderOptouts,
    replayOptouts,
    promoOptouts,
    emailClickers,
    
    // Wisdom-filtered metrics
    wisdomBroadcastSubscribers,
    wisdomReminderOptins,
    wisdomReplayOptins,
    wisdomPromoOptins,
    wisdomEmailClickers,
    wisdomClickRate,
  };
}

// ============================================================================
// LEAD QUALITY METRICS (LIST DEFENDER)
// ============================================================================

/**
 * Get lead quality distribution from List Defender tags
 * Returns both total and Wisdom-filtered metrics
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

  // Get Wisdom-filtered metrics
  const wisdomContacts = await getContactsWithAnyTags(WISDOM_TAGS);
  
  // Fetch contacts for each List Defender tag
  const [greenContacts, yellowContacts, redContacts, highEngContacts, lowEngContacts, neverEngContacts, slippingContacts, neverSentContacts, disposableContacts, suspiciousContacts] = await Promise.all([
    getContactsByTag(GREEN, 1000, 0),
    getContactsByTag(YELLOW, 1000, 0),
    getContactsByTag(RED, 1000, 0),
    getContactsByTag(HIGH_ENGAGEMENT, 1000, 0),
    getContactsByTag(LOW_ENGAGEMENT, 1000, 0),
    getContactsByTag(NEVER_ENGAGED, 1000, 0),
    getContactsByTag(SLIPPING, 1000, 0),
    getContactsByTag(NEVER_SENT, 1000, 0),
    getContactsByTag(DISPOSABLE, 1000, 0),
    getContactsByTag(SUSPICIOUS, 1000, 0),
  ]);

  // Filter by Wisdom contacts
  const wisdomGreen = greenContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomYellow = yellowContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomRed = redContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length;
  const wisdomTotal = wisdomGreen + wisdomYellow + wisdomRed;

  return {
    // Total metrics (all contacts)
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
    
    // Wisdom-filtered metrics
    wisdomTrafficLight: {
      green: wisdomGreen,
      yellow: wisdomYellow,
      red: wisdomRed,
      total: wisdomTotal,
      greenPercent: wisdomTotal > 0 ? (wisdomGreen / wisdomTotal) * 100 : 0,
      yellowPercent: wisdomTotal > 0 ? (wisdomYellow / wisdomTotal) * 100 : 0,
      redPercent: wisdomTotal > 0 ? (wisdomRed / wisdomTotal) * 100 : 0,
    },
    wisdomEngagement: {
      high: highEngContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
      low: lowEngContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
      neverEngaged: neverEngContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
      slipping: slippingContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
      neverSent: neverSentContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
    },
    wisdomRiskFlags: {
      disposable: disposableContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
      suspicious: suspiciousContacts.contacts.filter(c => wisdomContacts.has(c.contact.id)).length,
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
