import { getDateRangeValues, DATE_RANGES } from '../shared/constants';

console.log('Testing date range calculation...\n');
console.log('Today:', new Date().toISOString().split('T')[0]);
console.log('');

const range = getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
console.log('LAST_30_DAYS range:');
console.log('  Start:', range.startDate);
console.log('  End:', range.endDate);
