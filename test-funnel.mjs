import { getFunnelMetrics } from './server/funnel.js';

const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);

try {
  const metrics = await getFunnelMetrics(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
  
  console.log('Funnel Metrics:', JSON.stringify(metrics, null, 2));
} catch (err) {
  console.error('Error:', err.message, err.stack);
}
