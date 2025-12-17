import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, adFlagHistory, InsertAdFlagHistory, AdFlagHistory } from "../drizzle/schema";
import { ENV } from './_core/env';
import { hasAccess } from './auth-guard';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  // Check access before allowing user creation/update
  if (user.email) {
    const allowed = await hasAccess(user.email);
    if (!allowed) {
      throw new Error(
        `Access denied for ${user.email}. Only @pedroadao.com emails or invited users can access this dashboard. Contact the administrator for an invite.`
      );
    }
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Flag History Helpers

export async function saveFlagHistory(flag: InsertAdFlagHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save flag history: database not available");
    return;
  }

  try {
    await db.insert(adFlagHistory).values(flag);
  } catch (error) {
    console.error("[Database] Failed to save flag history:", error);
    throw error;
  }
}

export async function getFlagHistory(filters?: {
  adId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: "flagged" | "recovered" | "disabled";
}): Promise<AdFlagHistory[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get flag history: database not available");
    return [];
  }

  try {
    let query = db.select().from(adFlagHistory);

    // Apply filters (simplified - in production use Drizzle's where() properly)
    const results = await query;
    
    // Filter in memory for now (can optimize with Drizzle where() later)
    return results.filter(row => {
      if (filters?.adId && row.adId !== filters.adId) return false;
      if (filters?.startDate && new Date(row.date) < filters.startDate) return false;
      if (filters?.endDate && new Date(row.date) > filters.endDate) return false;
      if (filters?.status && row.status !== filters.status) return false;
      return true;
    });
  } catch (error) {
    console.error("[Database] Failed to get flag history:", error);
    return [];
  }
}

export async function updateFlagStatus(
  adId: string,
  date: Date,
  newStatus: "recovered" | "disabled"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update flag status: database not available");
    return;
  }

  try {
    // Update all flags for this ad on this date
    await db
      .update(adFlagHistory)
      .set({ 
        status: newStatus,
        resolvedAt: new Date()
      })
      .where(sql`ad_id = ${adId} AND DATE(date) = DATE(${date.toISOString()})`);
  } catch (error) {
    console.error("[Database] Failed to update flag status:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
