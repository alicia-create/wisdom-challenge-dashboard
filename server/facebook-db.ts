import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { facebookAudiences, type InsertFacebookAudience } from "../drizzle/schema";
import { getAllAudiences } from "./facebook";

/**
 * Sync Facebook Audiences from API to database
 * Replaces all existing audiences with fresh data from API
 */
export async function syncFacebookAudiences(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Facebook DB] Cannot sync: database not available");
    return 0;
  }

  console.log("[Facebook DB] Starting audience sync...");
  
  // Fetch all audiences from Facebook API
  const apiAudiences = await getAllAudiences();
  console.log(`[Facebook DB] Fetched ${apiAudiences.length} audiences from API`);

  // Clear existing audiences
  await db.delete(facebookAudiences);
  console.log("[Facebook DB] Cleared existing audiences");

  // Insert new audiences in batches to avoid max_allowed_packet error
  if (apiAudiences.length > 0) {
    const audiencesToInsert: InsertFacebookAudience[] = apiAudiences.map(audience => ({
      audienceId: audience.id,
      name: audience.name,
      adAccountId: audience.ad_account_id,
      sizeLowerBound: audience.approximate_count_lower_bound,
      sizeUpperBound: audience.approximate_count_upper_bound,
      subtype: audience.subtype,
      timeCreated: audience.time_created ? new Date(audience.time_created) : null,
      timeUpdated: audience.time_updated ? new Date(audience.time_updated) : null,
    }));

    // Insert one at a time to avoid max_allowed_packet errors
    // This is slower but guarantees success with large datasets
    let inserted = 0;
    let skipped = 0;
    for (const audience of audiencesToInsert) {
      try {
        await db.insert(facebookAudiences).values(audience);
        inserted++;
        if (inserted % 100 === 0) {
          console.log(`[Facebook DB] Progress: ${inserted}/${audiencesToInsert.length} audiences inserted (${Math.round(inserted / audiencesToInsert.length * 100)}%)`);
        }
      } catch (error) {
        skipped++;
        console.warn(`[Facebook DB] Skipped audience ${audience.audienceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    console.log(`[Facebook DB] ✅ Total inserted: ${inserted} audiences`);
    if (skipped > 0) {
      console.log(`[Facebook DB] ⚠️ Skipped: ${skipped} audiences due to errors`);
    }
  }

  return apiAudiences.length;
}

/**
 * Get all Facebook Audiences from database
 */
export async function getFacebookAudiencesFromDb() {
  const db = await getDb();
  if (!db) {
    console.warn("[Facebook DB] Cannot fetch: database not available");
    return [];
  }

  return db.select().from(facebookAudiences);
}

/**
 * Get Facebook Audiences by ad account ID
 */
export async function getFacebookAudiencesByAccount(adAccountId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Facebook DB] Cannot fetch: database not available");
    return [];
  }

  return db.select().from(facebookAudiences).where(eq(facebookAudiences.adAccountId, adAccountId));
}
