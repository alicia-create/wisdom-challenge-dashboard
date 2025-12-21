import { supabase } from './supabase';

/**
 * Social Media Metrics - Manual tracking of followers
 * Uses existing socialmedia_metrics table in Supabase
 */

export interface SocialMediaFollowersInput {
  date: string; // YYYY-MM-DD format
  facebookFollowers: number;
  instagramFollowers: number;
  youtubeFollowers: number;
  comment?: string;
}

export interface SocialMediaFollowersRecord {
  date: string;
  facebookFollowers: number;
  instagramFollowers: number;
  youtubeFollowers: number;
  comment?: string;
}

/**
 * Insert or update social media followers for a specific date
 * Creates 3 rows in socialmedia_metrics table (one per platform)
 */
export async function upsertSocialMediaFollowers(input: SocialMediaFollowersInput) {
  const { date, facebookFollowers, instagramFollowers, youtubeFollowers, comment } = input;
  
  // Delete existing entries for this date
  await supabase
    .from('socialmedia_metrics')
    .delete()
    .eq('date', date)
    .eq('entity_type', 'channel')
    .eq('metric_name', 'followers')
    .in('entity_id', ['facebook', 'instagram', 'youtube']);
  
  // Insert new entries (use entity_type='channel' for all social platforms)
  const rows = [
    {
      date,
      entity_type: 'channel',
      entity_id: 'facebook',
      metric_name: 'followers',
      metric_value: facebookFollowers,
      metric_type: 'subscribers', // Use 'subscribers' as it's allowed by metric_type_check
      comment,
      synced_at: new Date().toISOString(),
    },
    {
      date,
      entity_type: 'channel',
      entity_id: 'instagram',
      metric_name: 'followers',
      metric_value: instagramFollowers,
      metric_type: 'subscribers',
      comment,
      synced_at: new Date().toISOString(),
    },
    {
      date,
      entity_type: 'channel',
      entity_id: 'youtube',
      metric_name: 'followers',
      metric_value: youtubeFollowers,
      metric_type: 'subscribers',
      comment,
      synced_at: new Date().toISOString(),
    },
  ];
  
  const { error } = await supabase
    .from('socialmedia_metrics')
    .insert(rows);
  
  if (error) {
    console.error('[Social Media] Error upserting followers:', error);
    throw new Error(`Failed to save social media followers: ${error.message}`);
  }
  
  return { success: true };
}

/**
 * Get all social media followers records, grouped by date
 */
export async function getSocialMediaFollowers(): Promise<SocialMediaFollowersRecord[]> {
  const { data, error } = await supabase
    .from('socialmedia_metrics')
    .select('*')
    .eq('entity_type', 'channel')
    .eq('metric_name', 'followers')
    .in('entity_id', ['facebook', 'instagram', 'youtube'])
    .order('date', { ascending: false });
  
  if (error) {
    console.error('[Social Media] Error fetching followers:', error);
    throw new Error(`Failed to fetch social media followers: ${error.message}`);
  }
  
  // Group by date
  const grouped = new Map<string, SocialMediaFollowersRecord>();
  
  for (const row of data || []) {
    const date = row.date;
    if (!grouped.has(date)) {
      grouped.set(date, {
        date,
        facebookFollowers: 0,
        instagramFollowers: 0,
        youtubeFollowers: 0,
        comment: row.comment || undefined,
      });
    }
    
    const record = grouped.get(date)!;
    if (row.entity_id === 'facebook') {
      record.facebookFollowers = Number(row.metric_value);
    } else if (row.entity_id === 'instagram') {
      record.instagramFollowers = Number(row.metric_value);
    } else if (row.entity_id === 'youtube') {
      record.youtubeFollowers = Number(row.metric_value);
    }
  }
  
  return Array.from(grouped.values());
}

/**
 * Delete social media followers record for a specific date
 */
export async function deleteSocialMediaFollowers(date: string) {
  const { error } = await supabase
    .from('socialmedia_metrics')
    .delete()
    .eq('date', date)
    .eq('entity_type', 'channel')
    .eq('metric_name', 'followers')
    .in('entity_id', ['facebook', 'instagram', 'youtube']);
  
  if (error) {
    console.error('[Social Media] Error deleting followers:', error);
    throw new Error(`Failed to delete social media followers: ${error.message}`);
  }
  
  return { success: true };
}
