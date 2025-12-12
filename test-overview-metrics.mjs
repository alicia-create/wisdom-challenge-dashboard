import { getOverviewMetrics } from './server/supabase.ts';

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const startDate = thirtyDaysAgo.toISOString().split('T')[0];
const endDate = new Date().toISOString().split('T')[0];

console.log('Testing getOverviewMetrics with date range:', startDate, 'to', endDate);

const metrics = await getOverviewMetrics(startDate, endDate);
console.log('Total Leads:', metrics.totalLeads);
console.log('VIP Sales:', metrics.vipSales);
console.log('Total Revenue:', metrics.totalRevenue);
