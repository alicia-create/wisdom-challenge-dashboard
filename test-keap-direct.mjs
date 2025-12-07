import { ENV } from './server/_core/env.ts';

console.log('Direct ENV test:');
console.log('keapClientId:', ENV.keapClientId || 'EMPTY');
console.log('keapClientId length:', ENV.keapClientId?.length || 0);
console.log('keapClientSecret:', ENV.keapClientSecret ? '***' + ENV.keapClientSecret.slice(-4) : 'EMPTY');
console.log('keapAppId:', ENV.keapAppId || 'EMPTY');

// Test the exact condition used in keap.ts
const KEAP_CLIENT_ID = ENV.keapClientId;
console.log('\nTesting condition:');
console.log('KEAP_CLIENT_ID:', KEAP_CLIENT_ID || 'EMPTY');
console.log('!KEAP_CLIENT_ID:', !KEAP_CLIENT_ID);
