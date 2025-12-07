import { getDb } from './server/db.js';
import { facebookAudiences } from './drizzle/schema.js';

const db = await getDb();
if (db) {
  const count = await db.select().from(facebookAudiences);
  console.log('✅ Total audiences in database:', count.length);
  console.log('\nFirst 5 audiences:');
  count.slice(0, 5).forEach(a => {
    console.log(`  - ${a.name}`);
    console.log(`    ID: ${a.audienceId}`);
    console.log(`    Size: ${a.sizeLowerBound?.toLocaleString()} - ${a.sizeUpperBound?.toLocaleString()}`);
    console.log(`    Account: ${a.adAccountId}`);
    console.log('');
  });
} else {
  console.log('❌ Database not available');
}
