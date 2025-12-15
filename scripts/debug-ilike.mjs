import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function debug() {
  console.log('=== Debug ILIKE Behavior ===\n');
  
  // Test 1: Direct ILIKE with %wisdom%
  const { data: test1, count: count1 } = await supabase
    .from('analytics_events')
    .select('contact_id', { count: 'exact' })
    .ilike('comment', '%wisdom%');
  console.log(`ILIKE '%wisdom%': ${test1?.length} rows, count: ${count1}`);
  
  // Test 2: Direct ILIKE with %31daywisdom%
  const { data: test2, count: count2 } = await supabase
    .from('analytics_events')
    .select('contact_id', { count: 'exact' })
    .ilike('comment', '%31daywisdom%');
  console.log(`ILIKE '%31daywisdom%': ${test2?.length} rows, count: ${count2}`);
  
  // Test 3: Check if there's a limit being applied
  const { data: test3 } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%wisdom%')
    .limit(10000);
  const uniqueIds3 = new Set(test3?.map(e => e.contact_id) || []);
  console.log(`ILIKE '%wisdom%' with limit 10000: ${test3?.length} rows, ${uniqueIds3.size} unique contacts`);
  
  // Test 4: Check if there's a limit being applied
  const { data: test4 } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdom%')
    .limit(10000);
  const uniqueIds4 = new Set(test4?.map(e => e.contact_id) || []);
  console.log(`ILIKE '%31daywisdom%' with limit 10000: ${test4?.length} rows, ${uniqueIds4.size} unique contacts`);
  
  // Test 5: Check a specific contact that should match both
  const { data: test5 } = await supabase
    .from('analytics_events')
    .select('comment')
    .eq('contact_id', 550)
    .limit(5);
  console.log(`\nContact 550 comments:`);
  for (const e of test5 || []) {
    console.log(`  "${e.comment}"`);
    console.log(`    Contains "wisdom": ${e.comment?.toLowerCase().includes('wisdom')}`);
    console.log(`    Contains "31daywisdom": ${e.comment?.toLowerCase().includes('31daywisdom')}`);
  }
  
  // Test 6: Check if the issue is with the OR clause
  const { data: test6 } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%')
    .limit(10000);
  const uniqueIds6 = new Set(test6?.map(e => e.contact_id) || []);
  console.log(`\nOR clause (wisdom OR 31daywisdomchallenge): ${test6?.length} rows, ${uniqueIds6.size} unique contacts`);
  
  // Test 7: Check with 31daywisdom (without .com)
  const { data: test7 } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%31daywisdom%,comment.ilike.%31daywisdomchallenge%')
    .limit(10000);
  const uniqueIds7 = new Set(test7?.map(e => e.contact_id) || []);
  console.log(`OR clause (31daywisdom OR 31daywisdomchallenge): ${test7?.length} rows, ${uniqueIds7.size} unique contacts`);
}

debug().catch(console.error);
