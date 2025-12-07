import { supabase } from '../server/supabase';

async function checkContactDates() {
  const { data, error } = await supabase
    .from('contacts')
    .select('created_at, email')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📅 Recent contact dates (most recent first):');
  data?.forEach((c, i) => {
    const date = new Date(c.created_at);
    console.log(`${i + 1}. ${date.toISOString().split('T')[0]} - ${c.email}`);
  });
}

checkContactDates().catch(console.error);
