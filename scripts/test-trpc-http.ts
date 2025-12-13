async function testTRPCEndpoint() {
  const testCases = [
    { name: 'TODAY', input: { dateRange: 'TODAY' } },
    { name: 'YESTERDAY', input: { dateRange: 'YESTERDAY' } },
    { name: '7 DAYS', input: { dateRange: '7 DAYS' } },
  ];

  for (const testCase of testCases) {
    const encodedInput = encodeURIComponent(JSON.stringify(testCase.input));
    const url = `http://localhost:3000/api/trpc/overview.dailyKpis?input=${encodedInput}`;
    
    console.log(`\nTesting: ${testCase.name}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    const days = data.result.data.json;
    console.log(`  Returned ${days.length} days`);
    console.log(`  Dates: ${days.map((d: any) => d.date).join(', ')}`);
    
    if (testCase.name === 'TODAY' && days.length > 1) {
      console.log(`  ❌ ERROR: TODAY should return 0 or 1 day, got ${days.length}`);
    } else if (testCase.name === 'YESTERDAY' && days.length > 1) {
      console.log(`  ❌ ERROR: YESTERDAY should return 0 or 1 day, got ${days.length}`);
    } else if (testCase.name === '7 DAYS' && days.length > 7) {
      console.log(`  ❌ ERROR: 7 DAYS should return at most 7 days, got ${days.length}`);
    } else {
      console.log(`  ✅ OK`);
    }
  }
}

testTRPCEndpoint().catch(console.error);
