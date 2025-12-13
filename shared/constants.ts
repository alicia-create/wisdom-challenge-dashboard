/**
 * Global constants shared between client and server
 */

/**
 * Campaign name filter - only show data for this campaign
 * Used across all queries to filter ad_performance, leads, and orders
 */
export const CAMPAIGN_NAME_FILTER = '31DWC2026';

/**
 * Date formats
 */
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * Platforms
 */
export const PLATFORMS = {
  META: 'Meta',
  GOOGLE: 'Google',
} as const;

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];

/**
 * Date range presets
 */
export const DATE_RANGES = {
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
  LAST_7_DAYS: '7 DAYS',
  LAST_14_DAYS: '14 DAYS',
  LAST_30_DAYS: '30 DAYS',
} as const;

export type DateRange = typeof DATE_RANGES[keyof typeof DATE_RANGES];

/**
 * Get start and end dates for a given date range preset
 * Returns dates in YYYY-MM-DD format
 * Uses Los Angeles timezone (America/Los_Angeles, PST/PDT) for "today" calculation
 */
export function getDateRangeValues(range: DateRange): { startDate: string; endDate: string } {
  // Get current date in Los Angeles timezone (PST/PDT)
  // PST is UTC-8, PDT is UTC-7 (daylight saving)
  const now = new Date();
  
  // Use Intl API to get LA time
  const laTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const laDate = new Date(laTimeStr);
  const today = new Date(laDate.getFullYear(), laDate.getMonth(), laDate.getDate());
  
  let startDate: Date;
  let endDate: Date = new Date(today);
  endDate.setHours(23, 59, 59, 999); // Set to end of day
  
  switch (range) {
    case DATE_RANGES.TODAY:
      startDate = today;
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case DATE_RANGES.YESTERDAY:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case DATE_RANGES.LAST_7_DAYS:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
      break;
    case DATE_RANGES.LAST_14_DAYS:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 13); // Last 14 days including today
      break;
    case DATE_RANGES.LAST_30_DAYS:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29); // Last 30 days including today
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
