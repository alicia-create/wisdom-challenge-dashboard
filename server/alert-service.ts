import { getDb } from "./db";
import { alerts } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { supabase } from "./supabase";
import { CAMPAIGN_NAME_FILTER, DATE_RANGES, getDateRangeValues } from "@shared/constants";
import { eq, and, isNull, gte } from "drizzle-orm";

/**
 * Alert thresholds based on optimization rules
 */
const ALERT_THRESHOLDS = {
  HIGH_CPP: 60, // Cost Per Purchase above $60
  LOW_CLICK_TO_PURCHASE: 0.05, // Click-to-Purchase Rate below 5%
  HIGH_FREQUENCY: 3.0, // Creative Frequency above 3.0
} as const;

/**
 * Check if an alert was already sent in the last 24 hours
 * Returns true if alert should be sent (no recent alert exists)
 */
async function shouldSendAlert(
  alertType: "high_cpp" | "low_click_to_purchase" | "high_frequency",
  metricValue: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentAlerts = await db
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.alertType, alertType),
        gte(alerts.createdAt, oneDayAgo),
        isNull(alerts.resolvedAt)
      )
    )
    .limit(1);

  // If no recent unresolved alert exists, we should send a new one
  return recentAlerts.length === 0;
}

/**
 * Create alert record in database
 */
async function createAlert(
  alertType: "high_cpp" | "low_click_to_purchase" | "high_frequency",
  metricValue: number,
  threshold: number,
  message: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Alert Service] Database not available");
    return;
  }

  try {
    await db.insert(alerts).values({
      alertType,
      metricValue: metricValue.toString(),
      threshold: threshold.toString(),
      message,
      notificationSent: true,
      createdAt: new Date(),
    });
    console.log(`[Alert Service] Created alert: ${alertType}`);
  } catch (error) {
    console.error("[Alert Service] Failed to create alert:", error);
  }
}

/**
 * Check for high CPP (Cost Per Purchase > $60)
 */
async function checkHighCPP(): Promise<void> {
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_7_DAYS);

  const { data: ads } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", startDate)
    .lte("date", endDate);

  if (!ads || ads.length === 0) return;

  let total_spend = 0;
  let total_purchases = 0;

  for (const ad of ads) {
    total_spend += ad.spend || 0;
    total_purchases += ad.purchases || 0;
  }

  if (total_purchases === 0) return; // No purchases yet, can't calculate CPP

  const cpp = total_spend / total_purchases;

  if (cpp > ALERT_THRESHOLDS.HIGH_CPP) {
    const shouldSend = await shouldSendAlert("high_cpp", cpp);
    
    if (shouldSend) {
      const message = `⚠️ ALERT: Cost Per Purchase is $${cpp.toFixed(2)} (Target: $30-$60)\n\nCampaign: ${CAMPAIGN_NAME_FILTER}\nLast 7 Days: ${total_purchases} purchases, $${total_spend.toLocaleString()} spend\n\nAction Required: Review funnel leaks and ad performance in the Optimization Agent.`;
      
      await notifyOwner({
        title: "🚨 High Cost Per Purchase Alert",
        content: message,
      });

      await createAlert("high_cpp", cpp, ALERT_THRESHOLDS.HIGH_CPP, message);
      
      console.log(`[Alert Service] High CPP alert sent: $${cpp.toFixed(2)}`);
    }
  }
}

/**
 * Check for low Click-to-Purchase Rate (< 5%)
 */
async function checkLowClickToPurchase(): Promise<void> {
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_7_DAYS);

  const { data: ads } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", startDate)
    .lte("date", endDate);

  if (!ads || ads.length === 0) return;

  let total_clicks = 0;
  let total_purchases = 0;

  for (const ad of ads) {
    total_clicks += ad.inline_link_clicks || 0;
    total_purchases += ad.purchases || 0;
  }

  if (total_clicks === 0) return; // No clicks yet

  const clickToPurchaseRate = total_purchases / total_clicks;

  if (clickToPurchaseRate < ALERT_THRESHOLDS.LOW_CLICK_TO_PURCHASE) {
    const shouldSend = await shouldSendAlert("low_click_to_purchase", clickToPurchaseRate);
    
    if (shouldSend) {
      const message = `⚠️ ALERT: Click-to-Purchase Rate is ${(clickToPurchaseRate * 100).toFixed(2)}% (Target: 10%)\n\nCampaign: ${CAMPAIGN_NAME_FILTER}\nLast 7 Days: ${total_purchases} purchases from ${total_clicks.toLocaleString()} clicks\n\nAction Required: Check funnel leaks in the Optimization Agent. Likely issues:\n- Landing page not loading (Click-to-Page leak)\n- Lead capture form issues (Click-to-Lead leak)\n- Purchase page problems (Lead-to-Purchase leak)`;
      
      await notifyOwner({
        title: "🚨 Low Click-to-Purchase Rate Alert",
        content: message,
      });

      await createAlert("low_click_to_purchase", clickToPurchaseRate, ALERT_THRESHOLDS.LOW_CLICK_TO_PURCHASE, message);
      
      console.log(`[Alert Service] Low Click-to-Purchase alert sent: ${(clickToPurchaseRate * 100).toFixed(2)}%`);
    }
  }
}

/**
 * Check for high creative frequency (> 3.0)
 */
async function checkHighFrequency(): Promise<void> {
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_7_DAYS);

  const { data: ads } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", startDate)
    .lte("date", endDate);

  if (!ads || ads.length === 0) return;

  // Find ads with high frequency
  const highFrequencyAds = ads.filter((ad) => (ad.frequency || 0) > ALERT_THRESHOLDS.HIGH_FREQUENCY);

  if (highFrequencyAds.length > 0) {
    const avgFrequency = highFrequencyAds.reduce((sum, ad) => sum + (ad.frequency || 0), 0) / highFrequencyAds.length;
    
    const shouldSend = await shouldSendAlert("high_frequency", avgFrequency);
    
    if (shouldSend) {
      const message = `⚠️ ALERT: ${highFrequencyAds.length} ads showing creative fatigue (Frequency > 3.0)\n\nCampaign: ${CAMPAIGN_NAME_FILTER}\nAverage Frequency: ${avgFrequency.toFixed(2)}\n\nAction Required: Review Creative Fatigue section in Optimization Agent. Consider:\n- Refreshing creative assets\n- Expanding audience targeting\n- Pausing fatigued ads`;
      
      await notifyOwner({
        title: "🚨 Creative Fatigue Alert",
        content: message,
      });

      await createAlert("high_frequency", avgFrequency, ALERT_THRESHOLDS.HIGH_FREQUENCY, message);
      
      console.log(`[Alert Service] High Frequency alert sent: ${highFrequencyAds.length} ads affected`);
    }
  }
}

/**
 * Run all alert checks
 * This function should be called periodically (e.g., every 30 minutes)
 */
export async function checkAllAlerts(): Promise<void> {
  console.log("[Alert Service] Running alert checks...");
  
  try {
    await Promise.all([
      checkHighCPP(),
      checkLowClickToPurchase(),
      checkHighFrequency(),
    ]);
    
    console.log("[Alert Service] Alert checks completed");
  } catch (error) {
    console.error("[Alert Service] Error running alert checks:", error);
  }
}

/**
 * Get recent alerts from database
 */
export async function getRecentAlerts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const recentAlerts = await db
    .select()
    .from(alerts)
    .orderBy(alerts.createdAt)
    .limit(limit);

  return recentAlerts;
}
