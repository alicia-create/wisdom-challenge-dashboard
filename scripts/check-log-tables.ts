import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogTables() {
  console.log('Checking for error/log tables in Supabase...\n');
  
  const tables = ['error_logs', 'system_logs', 'logs', 'application_logs', 'webhook_logs'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (!error) {
      console.log(`✓ Found table: ${table}`);
      if (data && data.length > 0) {
        console.log('  Columns:', Object.keys(data[0]).join(', '));
        console.log('  Sample record:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('  (table exists but is empty)');
      }
      console.log('');
    }
  }
  
  console.log('Done checking tables');
}

checkLogTables().catch(console.error);
