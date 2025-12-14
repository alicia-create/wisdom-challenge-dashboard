import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('🔍 Testing Meta campaign breakdown for LAST_30_DAYS...\n');
  
  // Calculate date range (last 30 days)
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
  
  const { data: metaAds } = await supabase
    .from('ad_performance')
    .select('campaign_name, spend, link_clicks, reported_leads, reported_purchases')
    .ilike('platform', 'meta')
    .gte('date', startDateStr)
    .lte('date', endDateStr);
  
  console.log(`Total Meta ads in period: ${metaAds?.length || 0}\n`);
  
  // Group by campaign type
  const getCampaignType = (name) => {
    if (!name) return 'Other';
    if (name.includes('[SALES]')) return 'Sales';
    if (name.includes('[LEADS]')) return 'Leads';
    if (name.includes('[RMKT]')) return 'Retargeting';
    if (name.includes('[KLT]')) return 'Content';
    return 'Other';
  };
  
  const breakdown = {};
  metaAds?.forEach(ad => {
    const type = getCampaignType(ad.campaign_name);
    if (!breakdown[type]) {
      breakdown[type] = { spend: 0, clicks: 0, leads: 0, vips: 0, count: 0 };
    }
    breakdown[type].spend += parseFloat(ad.spend || 0);
    breakdown[type].clicks += parseInt(ad.link_clicks || 0);
    breakdown[type].leads += parseInt(ad.reported_leads || 0);
    breakdown[type].vips += parseInt(ad.reported_purchases || 0);
    breakdown[type].count += 1;
  });
  
  console.log('Breakdown by Campaign Type:');
  Object.entries(breakdown).forEach(([type, data]) => {
    console.log(`\n  ${type}:`);
    console.log(`    Ads: ${data.count}`);
    console.log(`    Spend: $${data.spend.toFixed(2)}`);
    console.log(`    Clicks: ${data.clicks}`);
    console.log(`    Leads: ${data.leads}`);
    console.log(`    VIPs: ${data.vips}`);
  });
  
  // Show sample campaigns from each type
  console.log('\n\nSample Campaigns:');
  const samplesByType = {};
  metaAds?.forEach(ad => {
    const type = getCampaignType(ad.campaign_name);
    if (!samplesByType[type]) samplesByType[type] = [];
    if (samplesByType[type].length < 2) {
      samplesByType[type].push(ad.campaign_name);
    }
  });
  
  Object.entries(samplesByType).forEach(([type, campaigns]) => {
    console.log(`\n  ${type}:`);
    campaigns.forEach(c => console.log(`    - ${c}`));
  });
}

test().catch(console.error);
