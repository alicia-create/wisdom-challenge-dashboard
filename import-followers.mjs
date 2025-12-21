import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CSV data
const csvData = [
  { date: '2025-12-13', facebook: 55795, instagram: 82832, youtube: 58068 },
  { date: '2025-12-14', facebook: 55828, instagram: 82840, youtube: 58088 },
  { date: '2025-12-15', facebook: 55894, instagram: 82862, youtube: 58142 },
  { date: '2025-12-16', facebook: 55999, instagram: 82907, youtube: 58237 },
  { date: '2025-12-17', facebook: 56132, instagram: 82973, youtube: 58413 },
  { date: '2025-12-18', facebook: 56275, instagram: 83031, youtube: 58605 },
];

console.log(`Importing ${csvData.length} records into Supabase...`);

for (const record of csvData) {
  console.log(`\nProcessing ${record.date}...`);
  
  // Delete existing records for this date
  const { error: deleteError } = await supabase
    .from('socialmedia_metrics')
    .delete()
    .eq('date', record.date)
    .eq('entity_type', 'channel')
    .eq('metric_name', 'followers')
    .in('entity_id', ['facebook', 'instagram', 'youtube']);
  
  if (deleteError) {
    console.error(`  ❌ Error deleting existing records:`, deleteError);
    continue;
  }
  
  // Insert new records
  const rows = [
    {
      date: record.date,
      entity_type: 'channel',
      entity_id: 'facebook',
      metric_name: 'followers',
      metric_value: record.facebook,
      metric_type: 'subscribers',
      comment: 'Imported from CSV',
      synced_at: new Date().toISOString(),
    },
    {
      date: record.date,
      entity_type: 'channel',
      entity_id: 'instagram',
      metric_name: 'followers',
      metric_value: record.instagram,
      metric_type: 'subscribers',
      comment: 'Imported from CSV',
      synced_at: new Date().toISOString(),
    },
    {
      date: record.date,
      entity_type: 'channel',
      entity_id: 'youtube',
      metric_name: 'followers',
      metric_value: record.youtube,
      metric_type: 'subscribers',
      comment: 'Imported from CSV',
      synced_at: new Date().toISOString(),
    },
  ];
  
  const { error: insertError } = await supabase
    .from('socialmedia_metrics')
    .insert(rows);
  
  if (insertError) {
    console.error(`  ❌ Error inserting records:`, insertError);
  } else {
    console.log(`  ✅ Inserted: FB ${record.facebook}, IG ${record.instagram}, YT ${record.youtube}`);
  }
}

console.log('\n✅ Import complete!');
