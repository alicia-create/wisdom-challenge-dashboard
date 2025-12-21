import { boolean, date, datetime, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Lead table - tracks all leads from ClickFunnels with UTM attribution
 * This is a reference schema for Supabase external database
 * We won't create this in MySQL, but define it for TypeScript types
 */
export const leads = mysqlTable("Lead", {
  id: int("id").autoincrement().primaryKey(),
  contactId: varchar("contact_id", { length: 255 }),
  email: varchar("email", { length: 320 }),
  name: text("name"),
  phone: varchar("phone", { length: 50 }),
  createdAt: datetime("created_at").notNull(),
  welcomeEmailClicked: boolean("welcome_email_clicked").default(false),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
});

export type Lead = typeof leads.$inferSelect;

/**
 * Order table - tracks VIP purchases and high-ticket sales
 * This is a reference schema for Supabase external database
 */
export const orders = mysqlTable("Order", {
  id: int("id").autoincrement().primaryKey(),
  contactId: varchar("contact_id", { length: 255 }),
  email: varchar("email", { length: 320 }),
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }).notNull(),
  productName: text("product_name"),
  createdAt: datetime("created_at").notNull(),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
});

export type Order = typeof orders.$inferSelect;

/**
 * Ad Performance table - aggregated metrics from Meta and Google Ads
 * This is a reference schema for Supabase external database
 */
export const adPerformance = mysqlTable("ad_performance", {
  id: int("id").autoincrement().primaryKey(),
  date: datetime("date").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // 'Meta' or 'Google'
  spend: decimal("spend", { precision: 10, scale: 2 }).notNull(),
  clicks: int("clicks").default(0),
  impressions: int("impressions").default(0),
  linkClicks: int("link_clicks").default(0),
  reportedLeads: int("reported_leads").default(0),
  reportedPurchases: int("reported_purchases").default(0),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
});

export type AdPerformance = typeof adPerformance.$inferSelect;

/**
 * Daily Attendance table - tracks challenge participation
 * This is a reference schema for Supabase external database
 */
export const dailyAttendance = mysqlTable("daily_attendance", {
  id: int("id").autoincrement().primaryKey(),
  date: datetime("date").notNull(),
  attendanceType: varchar("attendance_type", { length: 100 }).notNull(),
  count: int("count").default(0),
});

export type DailyAttendance = typeof dailyAttendance.$inferSelect;

/**
 * Daily KPIs table - pre-aggregated daily metrics
 * This is a reference schema for Supabase external database
 */
export const dailyKpis = mysqlTable("daily_kpis", {
  id: int("id").autoincrement().primaryKey(),
  date: datetime("date").notNull().unique(),
  totalLeads: int("total_leads").default(0),
  totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).default("0"),
  cpl: decimal("cpl", { precision: 10, scale: 2 }),
  vipSales: int("vip_sales").default(0),
  vipRevenue: decimal("vip_revenue", { precision: 10, scale: 2 }).default("0"),
  cpp: decimal("cpp", { precision: 10, scale: 2 }),
  roas: decimal("roas", { precision: 10, scale: 4 }),
  vipTakeRate: decimal("vip_take_rate", { precision: 5, scale: 2 }),
  welcomeEmailClicks: int("welcome_email_clicks").default(0),
});

export type DailyKpi = typeof dailyKpis.$inferSelect;

/**
 * Keap OAuth Tokens table - stores access and refresh tokens for Keap API
 * Singleton table (only one row with id=1)
 */
export const keapTokens = mysqlTable("keap_tokens", {
  id: int("id").primaryKey().default(1),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type KeapToken = typeof keapTokens.$inferSelect;
export type InsertKeapToken = typeof keapTokens.$inferInsert;

/**
 * Facebook Audiences table - stores custom audiences, lookalike audiences, and saved audiences
 * Synced periodically from Facebook Marketing API
 */
export const facebookAudiences = mysqlTable("facebook_audiences", {
  id: int("id").autoincrement().primaryKey(),
  audienceId: varchar("audience_id", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  adAccountId: varchar("ad_account_id", { length: 255 }).notNull(),
  sizeLowerBound: int("size_lower_bound"),
  sizeUpperBound: int("size_upper_bound"),
  subtype: varchar("subtype", { length: 50 }), // CUSTOM, LOOKALIKE, SAVED_AUDIENCE
  timeCreated: datetime("time_created"),
  timeUpdated: datetime("time_updated"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

export type FacebookAudience = typeof facebookAudiences.$inferSelect;
export type InsertFacebookAudience = typeof facebookAudiences.$inferInsert;

/**
 * Alerts table - tracks automated alert history for critical metrics
 * Stores when alerts were triggered and sent to avoid duplicate notifications
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alert_type", ["high_cpp", "low_click_to_purchase", "high_frequency"]).notNull(),
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  message: text("message").notNull(),
  notificationSent: boolean("notification_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Invites table - tracks invitation tokens for non-whitelisted users
 * Allows admin to generate invite links for specific emails
 */
export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdBy: varchar("created_by", { length: 320 }).notNull(), // Email of admin who created invite
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // 7 days from creation
  usedAt: timestamp("used_at"),
  revokedAt: timestamp("revoked_at"),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

/**
 * Diary Entries table - stores daily summaries with auto-generated metrics
 * Each entry represents one day's performance snapshot
 */
export const diaryEntries = mysqlTable("diary_entries", {
  id: int("id").autoincrement().primaryKey(),
  date: datetime("date").notNull().unique(), // One entry per day
  summaryType: varchar("summary_type", { length: 50 }).default("daily").notNull(), // daily, weekly, monthly
  metricsJson: text("metrics_json").notNull(), // JSON with spend, CPA, CPL, VIP take rate by campaign type
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = typeof diaryEntries.$inferInsert;

/**
 * Diary Actions table - tracks all changes and tasks related to ads/campaigns
 * Sources: manual input, LLM suggestions, Meta API sync, scheduled tasks
 */
export const diaryActions = mysqlTable("diary_actions", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entry_id"), // Optional link to diary_entries.id
  actionType: mysqlEnum("action_type", [
    "manual",
    "llm_suggestion",
    "meta_api_sync",
    "scheduled"
  ]).notNull(),
  category: varchar("category", { length: 100 }), // Ad Change, Budget Adjustment, Creative Swap, Campaign Launch, etc.
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "verified",
    "cancelled"
  ]).default("pending").notNull(),
  source: varchar("source", { length: 255 }), // "Optimization Agent", "Meta API", "Manual", etc.
  adId: varchar("ad_id", { length: 255 }), // Optional link to specific ad
  adName: varchar("ad_name", { length: 500 }), // Ad name for easy identification
  campaignId: varchar("campaign_id", { length: 255 }), // Optional link to campaign
  campaignName: varchar("campaign_name", { length: 500 }), // Campaign name for easy identification
  scheduledFor: datetime("scheduled_for"), // For scheduled tasks
  createdBy: varchar("created_by", { length: 320 }), // Email of user who created action
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  verifiedAt: timestamp("verified_at"),
});

export type DiaryAction = typeof diaryActions.$inferSelect;
export type InsertDiaryAction = typeof diaryActions.$inferInsert;

/**
 * Ad Flag History table - tracks strike progression for ads over time
 * Logs every time an ad receives a flag/strike from optimization engine
 */
export const adFlagHistory = mysqlTable("ad_flag_history", {
  id: int("id").autoincrement().primaryKey(),
  adId: varchar("ad_id", { length: 255 }).notNull(),
  adName: varchar("ad_name", { length: 500 }).notNull(),
  campaignId: varchar("campaign_id", { length: 255 }),
  campaignName: varchar("campaign_name", { length: 500 }),
  adsetId: varchar("adset_id", { length: 255 }),
  adsetName: varchar("adset_name", { length: 500 }),
  date: datetime("date").notNull(), // Date of the flag
  strikeCount: int("strike_count").notNull(), // 1, 2, or 3
  flagType: varchar("flag_type", { length: 100 }).notNull(), // "low_cpp", "low_lead_rate", "low_connect_rate", etc.
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  status: mysqlEnum("status", [
    "flagged",      // Currently has strikes
    "recovered",    // Had strikes but recovered
    "disabled"      // Was disabled due to strikes
  ]).default("flagged").notNull(),
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }), // The actual metric value that triggered flag
  threshold: decimal("threshold", { precision: 10, scale: 2 }), // The threshold it failed to meet
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"), // When status changed to recovered/disabled
});

export type AdFlagHistory = typeof adFlagHistory.$inferSelect;
export type InsertAdFlagHistory = typeof adFlagHistory.$inferInsert;


