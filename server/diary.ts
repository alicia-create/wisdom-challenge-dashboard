import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { diaryEntries, diaryActions, dailyKpis } from "../drizzle/schema";
import type { InsertDiaryEntry, InsertDiaryAction } from "../drizzle/schema";

/**
 * Daily Summary Metrics Structure
 * Matches format from Ads Diary document
 */
export interface DailySummaryMetrics {
  date: string; // YYYY-MM-DD
  totalFbUs: {
    spent: number;
    purchases: number;
    cpa: number;
    leads: number;
    cpl: number;
    vipTakeRate: number;
  };
  salesCampaigns: {
    spent: number;
    purchases: number;
    cpa: number;
    leads: number;
    cpl: number;
    vipTakeRate: number;
  };
  leadsCampaigns: {
    spent: number;
    purchases: number;
    cpa: number;
    leads: number;
    cpl: number;
    vipTakeRate: number;
  };
  latamSalesCampaigns: {
    spent: number;
    purchases: number;
    cpa: number;
    leads: number;
    cpl: number;
    vipTakeRate: number;
  };
}

/**
 * Generate daily summary from daily_kpis table
 * Groups metrics by campaign type based on utm_campaign patterns
 */
export async function generateDailySummary(date: Date): Promise<DailySummaryMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Query daily_kpis for the specific date
  const dateStr = date.toISOString().split("T")[0];
  const kpis = await db
    .select()
    .from(dailyKpis)
    .where(eq(dailyKpis.date, new Date(dateStr)))
    .limit(1);

  if (kpis.length === 0) {
    // Return empty metrics if no data for this date
    return {
      date: dateStr,
      totalFbUs: createEmptyMetrics(),
      salesCampaigns: createEmptyMetrics(),
      leadsCampaigns: createEmptyMetrics(),
      latamSalesCampaigns: createEmptyMetrics(),
    };
  }

  const kpi = kpis[0];
  
  // For now, use total metrics as "Total FB US"
  // TODO: Add campaign-specific grouping when utm_campaign data is available
  const totalMetrics = {
    spent: Number(kpi?.totalSpend || 0),
    purchases: kpi?.vipSales || 0,
    cpa: kpi?.cpp ? Number(kpi.cpp) : 0,
    leads: kpi?.totalLeads || 0,
    cpl: kpi?.cpl ? Number(kpi.cpl) : 0,
    vipTakeRate: kpi?.vipTakeRate ? Number(kpi.vipTakeRate) : 0,
  };

  return {
    date: dateStr,
    totalFbUs: totalMetrics,
    salesCampaigns: createEmptyMetrics(), // TODO: Filter by sales campaign patterns
    leadsCampaigns: createEmptyMetrics(), // TODO: Filter by leads campaign patterns
    latamSalesCampaigns: createEmptyMetrics(), // TODO: Filter by LATAM patterns
  };
}

function createEmptyMetrics() {
  return {
    spent: 0,
    purchases: 0,
    cpa: 0,
    leads: 0,
    cpl: 0,
    vipTakeRate: 0,
  };
}

/**
 * Create or update diary entry for a specific date
 */
export async function upsertDiaryEntry(date: Date, metrics: DailySummaryMetrics): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dateStr = date.toISOString().split("T")[0];
  
  // Check if entry exists
  const existing = await db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.date, new Date(dateStr)))
    .limit(1);

  const entry: InsertDiaryEntry = {
    date: new Date(dateStr),
    summaryType: "daily",
    metricsJson: JSON.stringify(metrics),
  };

  if (existing.length > 0) {
    // Update existing entry
    await db
      .update(diaryEntries)
      .set({
        metricsJson: entry.metricsJson,
        updatedAt: new Date(),
      })
      .where(eq(diaryEntries.id, existing[0]!.id));
    return existing[0]!.id;
  } else {
    // Insert new entry
    const result = await db.insert(diaryEntries).values(entry);
    return Number((result as any).insertId || 0);
  }
}

/**
 * Get diary entry for a specific date
 */
export async function getDiaryEntry(date: Date) {
  const db = await getDb();
  if (!db) return null;

  const dateStr = date.toISOString().split("T")[0];
  const entries = await db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.date, new Date(dateStr)))
    .limit(1);

  if (entries.length === 0) return null;

  const entry = entries[0]!;
  return {
    ...entry,
    metrics: JSON.parse(entry.metricsJson) as DailySummaryMetrics,
  };
}

/**
 * Get diary entries for a date range
 */
export async function getDiaryEntries(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const entries = await db
    .select()
    .from(diaryEntries)
    .where(
      and(
        gte(diaryEntries.date, startDate),
        lte(diaryEntries.date, endDate)
      )
    )
    .orderBy(desc(diaryEntries.date));

  return entries.map(entry => ({
    ...entry,
    metrics: JSON.parse(entry.metricsJson) as DailySummaryMetrics,
  }));
}

/**
 * Create a diary action (manual, LLM suggestion, Meta API sync, scheduled)
 */
export async function createDiaryAction(action: InsertDiaryAction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(diaryActions).values(action);
  return Number((result as any).insertId || 0);
}

/**
 * Get diary actions for a specific entry
 */
export async function getDiaryActions(entryId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(diaryActions);
  
  if (entryId) {
    query = query.where(eq(diaryActions.entryId, entryId)) as any;
  }

  const actions = await query.orderBy(desc(diaryActions.createdAt)).limit(limit);
  return actions;
}

/**
 * Update diary action status
 */
export async function updateDiaryActionStatus(
  actionId: number,
  status: "pending" | "in_progress" | "completed" | "verified" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { status };
  
  if (status === "completed") {
    updates.completedAt = new Date();
  } else if (status === "verified") {
    updates.verifiedAt = new Date();
  }

  await db
    .update(diaryActions)
    .set(updates)
    .where(eq(diaryActions.id, actionId));
}
