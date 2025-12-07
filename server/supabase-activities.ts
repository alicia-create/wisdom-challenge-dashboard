import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Get all activities for a specific contact from analytics_events table
 */
export async function getContactActivities(contactId: number) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error(`[Supabase] Error fetching activities for contact ${contactId}:`, error);
    throw new Error(`Failed to fetch contact activities: ${error.message}`);
  }

  return data || [];
}

/**
 * Get activity summary for a contact (grouped by type)
 */
export async function getContactActivitySummary(contactId: number) {
  const activities = await getContactActivities(contactId);

  // Group by type
  const summary = {
    totalActivities: activities.length,
    byType: {} as Record<string, number>,
    byName: {} as Record<string, number>,
    firstActivity: activities[activities.length - 1],
    lastActivity: activities[0],
  };

  activities.forEach(activity => {
    // Count by type
    summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;
    
    // Count by name
    summary.byName[activity.name] = (summary.byName[activity.name] || 0) + 1;
  });

  return summary;
}

/**
 * Get timeline of key events for a contact
 */
export async function getContactTimeline(contactId: number) {
  const activities = await getContactActivities(contactId);

  // Filter to key events only
  const keyEventNames = [
    'lead_acquired',
    'purchase_completed',
    'order_completed',
    'form_submission',
    'event_attendance',
    'attendee.checked_in',
    'utm_tracked',
  ];

  const timeline = activities
    .filter(a => keyEventNames.includes(a.name))
    .map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp,
      name: activity.name,
      type: activity.type,
      value: activity.value,
      comment: activity.comment,
      icon: getEventIcon(activity.name),
      color: getEventColor(activity.type),
    }));

  return timeline;
}

/**
 * Helper to get icon for event type
 */
function getEventIcon(eventName: string): string {
  const iconMap: Record<string, string> = {
    'lead_acquired': '👤',
    'purchase_completed': '💰',
    'order_completed': '🛒',
    'form_submission': '📝',
    'event_attendance': '📅',
    'attendee.checked_in': '✅',
    'utm_tracked': '🔗',
  };

  return iconMap[eventName] || '📊';
}

/**
 * Helper to get color for event type
 */
function getEventColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    'lead': 'blue',
    'purchase': 'green',
    'action': 'purple',
    'analytics': 'gray',
  };

  return colorMap[eventType] || 'gray';
}
