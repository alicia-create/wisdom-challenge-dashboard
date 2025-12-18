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
  ALL: 'ALL',
} as const;

export type DateRange = typeof DATE_RANGES[keyof typeof DATE_RANGES];

/**
 * Get start and end dates for a given date range preset
 * Returns dates in YYYY-MM-DD format
 * Uses Los Angeles timezone (America/Los_Angeles, PST/PDT) for "today" calculation
 * Since DB is in PST, we work with YYYY-MM-DD strings directly to avoid timezone conversion issues
 */
export function getDateRangeValues(range: DateRange): { startDate: string; endDate: string } {
  // Get current date in Los Angeles timezone (PST/PDT)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const yearStr = parts.find(p => p.type === 'year')!.value;
  const monthStr = parts.find(p => p.type === 'month')!.value;
  const dayStr = parts.find(p => p.type === 'day')!.value;
  
  // Today in PST as YYYY-MM-DD string
  const todayStr = `${yearStr}-${monthStr}-${dayStr}`;
  
  // Helper to subtract days from a YYYY-MM-DD string
  const subtractDays = (dateStr: string, days: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  let startDateStr: string;
  let endDateStr: string;
  
  switch (range) {
    case DATE_RANGES.TODAY:
      startDateStr = todayStr;
      endDateStr = todayStr;
      break;
    case DATE_RANGES.YESTERDAY:
      startDateStr = subtractDays(todayStr, 1);
      endDateStr = subtractDays(todayStr, 1);
      break;
    case DATE_RANGES.LAST_7_DAYS:
      startDateStr = subtractDays(todayStr, 6); // Last 7 days including today
      endDateStr = todayStr;
      break;
    case DATE_RANGES.LAST_14_DAYS:
      startDateStr = subtractDays(todayStr, 13); // Last 14 days including today
      endDateStr = todayStr;
      break;
    case DATE_RANGES.LAST_30_DAYS:
      startDateStr = subtractDays(todayStr, 29); // Last 30 days including today
      endDateStr = todayStr;
      break;
    case DATE_RANGES.ALL:
      startDateStr = '2025-12-13'; // Campaign start date
      endDateStr = todayStr;
      break;
    default:
      startDateStr = '2025-12-13'; // Default to ALL
      endDateStr = todayStr;
  }
  
  return {
    startDate: startDateStr,
    endDate: endDateStr,
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
