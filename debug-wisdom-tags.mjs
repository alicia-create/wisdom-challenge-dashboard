import { getTagContactCount } from './server/keap.ts';

const WISDOM_TAGS = [
  { id: 14705, name: 'Historical - 31DWC - 2601 - Optin' },
  { id: 14703, name: 'Trigger - 31DWC - 2601 - Optin' },
  { id: 14739, name: 'Status - 31DWC - 2601 - NTN General Opt In' },
  { id: 14741, name: 'Status - 31DWC - 2601 - NTN VIP Opt In' },
];

console.log('Checking Wisdom tag counts...\n');

for (const tag of WISDOM_TAGS) {
  try {
    const count = await getTagContactCount(tag.id);
    console.log(`✓ Tag ${tag.id} (${tag.name}): ${count} contacts`);
  } catch (error) {
    console.error(`✗ Tag ${tag.id} (${tag.name}): ERROR - ${error.message}`);
  }
}

console.log('\nDone!');
process.exit(0);
