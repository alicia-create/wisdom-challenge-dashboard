import { ENV } from './server/_core/env.ts';

console.log('Testing ENV loading...');
console.log('KEAP_CLIENT_ID from process.env:', process.env.KEAP_CLIENT_ID);
console.log('KEAP_CLIENT_ID from ENV:', ENV.keapClientId);
console.log('KEAP_CLIENT_SECRET from ENV:', ENV.keapClientSecret ? '***' + ENV.keapClientSecret.slice(-4) : 'NOT SET');
console.log('KEAP_APP_ID from ENV:', ENV.keapAppId);
