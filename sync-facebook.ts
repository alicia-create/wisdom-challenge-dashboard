import { syncFacebookAudiences } from './server/facebook-db';

console.log('[Sync] Starting Facebook audience sync...');
console.log('[Sync] This may take a few minutes for thousands of audiences...\n');

syncFacebookAudiences()
  .then(count => {
    console.log(`\n[Sync] ✅ Success! Synced ${count} audiences to database`);
    process.exit(0);
  })
  .catch(err => {
    console.error('\n[Sync] ❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
