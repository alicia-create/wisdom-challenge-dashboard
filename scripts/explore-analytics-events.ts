import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreAnalyticsEvents() {
  console.log('🔍 Exploring analytics_events table structure...\n');

  // Get sample records
  const { data: sampleRecords, error: sampleError } = await supabase
    .from('analytics_events')
    .select('*')
    .limit(5);

  if (sampleError) {
    console.error('❌ Error fetching sample records:', sampleError);
    return;
  }

  console.log('📊 Sample Records (first 5):');
  console.log(JSON.stringify(sampleRecords, null, 2));
  console.log('\n');

  // Get unique event types
  const { data: eventTypes, error: eventTypesError } = await supabase
    .from('analytics_events')
    .select('event_type')
    .limit(1000);

  if (!eventTypesError && eventTypes) {
    const uniqueEventTypes = [...new Set(eventTypes.map(e => e.event_type))];
    console.log('📋 Unique Event Types:');
    uniqueEventTypes.forEach(type => console.log(`  - ${type}`));
    console.log('\n');
  }

  // Search for "wisdom" in event data
  const { data: wisdomEvents, error: wisdomError } = await supabase
    .from('analytics_events')
    .select('*')
    .or('event_type.ilike.%wisdom%,event_data.ilike.%wisdom%,metadata.ilike.%wisdom%')
    .limit(10);

  if (!wisdomError && wisdomEvents) {
    console.log('🎯 Events containing "wisdom":');
    console.log(JSON.stringify(wisdomEvents, null, 2));
    console.log('\n');
  }

  // Get total count
  const { count, error: countError } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`📈 Total analytics_events records: ${count}`);
  }

  // Check if there's a user_id or contact_id field
  if (sampleRecords && sampleRecords.length > 0) {
    console.log('\n🔑 Available fields in analytics_events:');
    Object.keys(sampleRecords[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof sampleRecords[0][key]}`);
    });
  }
}

exploreAnalyticsEvents().catch(console.error);
