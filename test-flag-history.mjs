import { drizzle } from "drizzle-orm/mysql2";
import { adFlagHistory } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Insert sample flag history data for testing
const sampleFlags = [
  {
    adId: "6871658325033",
    adName: "🟡[3404] WC_Joel Osteen",
    campaignId: "campaign_123",
    campaignName: "31DWC2026 - SALES",
    adsetId: "6871620745833",
    adsetName: "Ad Set 1",
    date: new Date("2025-12-15"),
    strikeCount: 1,
    flagType: "low_lead_rate",
    severity: "info",
    status: "flagged",
    metricValue: "14.8",
    threshold: "25.0",
  },
  {
    adId: "6871658325033",
    adName: "🟡[3404] WC_Joel Osteen",
    campaignId: "campaign_123",
    campaignName: "31DWC2026 - SALES",
    adsetId: "6871620745833",
    adsetName: "Ad Set 1",
    date: new Date("2025-12-16"),
    strikeCount: 2,
    flagType: "low_lead_rate",
    severity: "warning",
    status: "flagged",
    metricValue: "13.2",
    threshold: "25.0",
  },
  {
    adId: "6871658325033",
    adName: "🟡[3404] WC_Joel Osteen",
    campaignId: "campaign_123",
    campaignName: "31DWC2026 - SALES",
    adsetId: "6871620745833",
    adsetName: "Ad Set 1",
    date: new Date("2025-12-17"),
    strikeCount: 3,
    flagType: "low_lead_rate",
    severity: "critical",
    status: "disabled",
    metricValue: "12.5",
    threshold: "25.0",
    resolvedAt: new Date("2025-12-17"),
  },
  {
    adId: "6871997451633",
    adName: "[3405] WC_John Bevere",
    campaignId: "campaign_123",
    campaignName: "31DWC2026 - SALES",
    adsetId: "6871991485633",
    adsetName: "Ad Set 2",
    date: new Date("2025-12-16"),
    strikeCount: 1,
    flagType: "low_connect_rate",
    severity: "info",
    status: "flagged",
    metricValue: "33.3",
    threshold: "50.0",
  },
  {
    adId: "6871997451633",
    adName: "[3405] WC_John Bevere",
    campaignId: "campaign_123",
    campaignName: "31DWC2026 - SALES",
    adsetId: "6871991485633",
    adsetName: "Ad Set 2",
    date: new Date("2025-12-17"),
    strikeCount: 2,
    flagType: "low_connect_rate",
    severity: "warning",
    status: "recovered",
    metricValue: "55.8",
    threshold: "50.0",
    resolvedAt: new Date("2025-12-17"),
  },
];

console.log("Inserting sample flag history data...");

for (const flag of sampleFlags) {
  await db.insert(adFlagHistory).values(flag);
  console.log(`✓ Inserted flag for ${flag.adName} (Strike ${flag.strikeCount}/3)`);
}

console.log("\n✅ Sample data inserted successfully!");
console.log("Visit /flag-history to see the results");

process.exit(0);
