import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  const startDate = '2025-11-13';
  const endDate = '2025-12-16';
  
  const [metricsResult, journalsResult] = await Promise.all([
    supabase.rpc('get_dashboard_metrics', {
      p_start_date: startDate,
      p_end_date: endDate,
    }),
    supabase.rpc('get_journals_metrics', {
      p_start_date: startDate,
      p_end_date: endDate,
    }),
  ]);
  
  console.log('Journals result:', JSON.stringify(journalsResult, null, 2));
  console.log('Has journals data:', !!journalsResult.data);
  
  const result = {
    ...metricsResult.data,
    journals: journalsResult.data || {
      wisdomJournals: 0,
      extraJournals: 0,
      totalJournals: 0,
      journalGoal: 20000,
      journalProgress: 0,
      journalsRemaining: 20000,
    },
  };
  
  console.log('Combined result journals:', JSON.stringify(result.journals, null, 2));
}

test();
