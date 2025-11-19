import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime, decimal } from "drizzle-orm/mysql-core";

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
