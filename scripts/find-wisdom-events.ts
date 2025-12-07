import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findWisdomEvents() {
  console.log('🔍 Searching for "wisdom" in analytics_events...\n');

  // Search in comment field
  const { data: wisdomInComment, error: commentError } = await supabase
    .from('analytics_events')
    .select('*')
    .ilike('comment', '%wisdom%')
    .limit(10);

  if (!commentError && wisdomInComment && wisdomInComment.length > 0) {
    console.log('✅ Found events with "wisdom" in comment field:');
    console.log(JSON.stringify(wisdomInComment, null, 2));
    console.log('\n');
  } else {
    console.log('❌ No events found with "wisdom" in comment field\n');
  }

  // Search in value field
  const { data: wisdomInValue, error: valueError } = await supabase
    .from('analytics_events')
    .select('*')
    .ilike('value', '%wisdom%')
    .limit(10);

  if (!valueError && wisdomInValue && wisdomInValue.length > 0) {
    console.log('✅ Found events with "wisdom" in value field:');
    console.log(JSON.stringify(wisdomInValue, null, 2));
    console.log('\n');
  } else {
    console.log('❌ No events found with "wisdom" in value field\n');
  }

  // Get all unique funnel URLs from comments
  const { data: allEvents, error: allError } = await supabase
    .from('analytics_events')
    .select('comment')
    .limit(1000);

  if (!allError && allEvents) {
    const funnelUrls = new Set<string>();
    allEvents.forEach(event => {
      if (event.comment) {
        const match = event.comment.match(/Funnel:\s*(https?:\/\/[^\s)]+)/i);
        if (match) {
          funnelUrls.add(match[1]);
        }
      }
    });

    console.log('📋 All unique funnel URLs found:');
    funnelUrls.forEach(url => console.log(`  - ${url}`));
    console.log('\n');
  }

  // Get unique event names
  const { data: eventNames, error: namesError } = await supabase
    .from('analytics_events')
    .select('name, type')
    .limit(1000);

  if (!namesError && eventNames) {
    const uniqueNames = new Map<string, Set<string>>();
    eventNames.forEach(event => {
      if (!uniqueNames.has(event.name)) {
        uniqueNames.set(event.name, new Set());
      }
      uniqueNames.get(event.name)!.add(event.type);
    });

    console.log('📋 Unique event names and types:');
    uniqueNames.forEach((types, name) => {
      console.log(`  - ${name} (types: ${Array.from(types).join(', ')})`);
    });
  }
}

findWisdomEvents().catch(console.error);
