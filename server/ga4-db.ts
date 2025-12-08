import { getDb } from "./db";
import { fetchLandingPageMetrics } from "./ga4";
import { sql } from "drizzle-orm";

/**
 * Sync GA4 landing page metrics to database
 * Fetches metrics from GA4 API and stores them in ga4_landing_page_metrics table
 */
export async function syncGA4Metrics(startDate: string, endDate: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Fetch metrics from GA4
    const metrics = await fetchLandingPageMetrics(startDate, endDate);

    if (metrics.length === 0) {
      console.log("[GA4-DB] No metrics to sync");
      return 0;
    }

    // Insert metrics into database (using INSERT IGNORE to skip duplicates)
    let insertedCount = 0;
    for (const metric of metrics) {
      try {
        await db.execute(
          sql`INSERT IGNORE INTO ga4_landing_page_metrics 
           (date, landing_page, hostname, session_source, session_campaign, sessions, bounce_rate, average_session_duration, conversions, engagement_rate)
           VALUES (${metric.date}, ${metric.landing_page}, ${metric.hostname}, ${metric.session_source}, ${metric.session_campaign}, ${metric.sessions}, ${metric.bounce_rate}, ${metric.average_session_duration}, ${metric.conversions}, ${metric.engagement_rate})`
        );
        insertedCount++;
      } catch (error: any) {
        // Skip duplicate key errors
        if (error.code !== "ER_DUP_ENTRY") {
          console.error("[GA4-DB] Error inserting metric:", error);
        }
      }
    }

    console.log(`[GA4-DB] Synced ${insertedCount} metrics (${metrics.length} total fetched)`);
    return insertedCount;
  } catch (error) {
    console.error("[GA4-DB] Error syncing GA4 metrics:", error);
    throw error;
  }
}

/**
 * Get GA4 metrics for a specific landing page and date range
 */
export async function getGA4MetricsForPage(
  landingPage: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const result: any = await db.execute(
      sql`SELECT * FROM ga4_landing_page_metrics 
       WHERE landing_page = ${landingPage} AND date BETWEEN ${startDate} AND ${endDate}
       ORDER BY date DESC`
    );
    return result[0] || [];
  } catch (error) {
    console.error("[GA4-DB] Error fetching GA4 metrics:", error);
    return [];
  }
}

/**
 * Get aggregated GA4 metrics for all landing pages in a date range
 */
export async function getAggregatedGA4Metrics(startDate: string, endDate: string): Promise<any> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result: any = await db.execute(
      sql`SELECT 
         landing_page,
         hostname,
         SUM(sessions) as sessions,
         AVG(bounce_rate) as bounce_rate,
         AVG(average_session_duration) as avg_session_duration,
         SUM(conversions) as conversions,
         AVG(engagement_rate) as engagement_rate
       FROM ga4_landing_page_metrics 
       WHERE date BETWEEN ${startDate} AND ${endDate}
       GROUP BY landing_page, hostname
       ORDER BY sessions DESC`
    );
    return result[0] || [];
  } catch (error) {
    console.error("[GA4-DB] Error fetching aggregated GA4 metrics:", error);
    return null;
  }
}

/**
 * Get latest sync timestamp
 */
export async function getLatestGA4SyncDate(): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result: any = await db.execute(
      sql`SELECT MAX(date) as latest_date FROM ga4_landing_page_metrics`
    );
    const rows = result[0] || [];
    return rows[0]?.latest_date || null;
  } catch (error) {
    console.error("[GA4-DB] Error fetching latest sync date:", error);
    return null;
  }
}
