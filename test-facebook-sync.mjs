import { syncFacebookAudiences } from './server/facebook-db.js';

console.log('[Test] Starting Facebook audience sync...');

try {
  const count = await syncFacebookAudiences();
  console.log(`[Test] ✅ Success! Synced ${count} audiences`);
} catch (error) {
  console.error('[Test] ❌ Error:', error.message);
  console.error(error.stack);
}
