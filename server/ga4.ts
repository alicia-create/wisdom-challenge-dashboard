import { BetaAnalyticsDataClient } from "@google-analytics/data";

let ga4Client: BetaAnalyticsDataClient | null = null;

/**
 * Get or create GA4 client instance
 */
function getGA4Client(): BetaAnalyticsDataClient | null {
  if (ga4Client) {
    return ga4Client;
  }

  const serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("[GA4] GA4_SERVICE_ACCOUNT_JSON not configured");
    return null;
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    ga4Client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
    console.log("[GA4] Client initialized successfully");
    return ga4Client;
  } catch (error) {
    console.error("[GA4] Failed to initialize client:", error);
    return null;
  }
}

/**
 * Check if GA4 is configured
 */
export function isGA4Configured(): boolean {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_JSON);
}

/**
 * Fetch landing page metrics from GA4
 * Returns metrics for each landing page, source, and campaign combination
 */
export async function fetchLandingPageMetrics(startDate: string, endDate: string) {
  const client = getGA4Client();
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!client || !propertyId) {
    throw new Error("GA4 not configured. Please set GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON.");
  }

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: "date" },
        { name: "landingPage" },
        { name: "sessionSource" },
        { name: "sessionCampaignName" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "conversions" },
        { name: "engagementRate" },
      ],
    });

    if (!response.rows || response.rows.length === 0) {
      console.log("[GA4] No data found for date range:", startDate, "to", endDate);
      return [];
    }

    const metrics = response.rows.map((row: any) => {
      const dimensionValues = row.dimensionValues || [];
      const metricValues = row.metricValues || [];

      return {
        date: dimensionValues[0]?.value || "",
        landing_page: dimensionValues[1]?.value || "",
        session_source: dimensionValues[2]?.value || "",
        session_campaign: dimensionValues[3]?.value || "",
        sessions: parseInt(metricValues[0]?.value || "0", 10),
        bounce_rate: parseFloat(metricValues[1]?.value || "0"),
        average_session_duration: parseFloat(metricValues[2]?.value || "0"),
        conversions: parseInt(metricValues[3]?.value || "0", 10),
        engagement_rate: parseFloat(metricValues[4]?.value || "0"),
      };
    });

    console.log(`[GA4] Fetched ${metrics.length} landing page metrics`);
    return metrics;
  } catch (error) {
    console.error("[GA4] Error fetching landing page metrics:", error);
    throw error;
  }
}

/**
 * Test GA4 connection
 * Returns true if connection is successful
 */
export async function testGA4Connection(): Promise<boolean> {
  const client = getGA4Client();
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!client || !propertyId) {
    return false;
  }

  try {
    // Try to fetch metadata to test connection
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "yesterday",
          endDate: "yesterday",
        },
      ],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      limit: 1,
    });

    console.log("[GA4] Connection test successful");
    return true;
  } catch (error) {
    console.error("[GA4] Connection test failed:", error);
    return false;
  }
}
