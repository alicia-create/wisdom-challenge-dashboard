/**
 * Test cache performance by measuring response times
 * First request should be slow (cache MISS), second should be fast (cache HIT)
 */

async function testCachePerformance() {
  const baseUrl = 'http://localhost:3000/api/trpc';
  const endpoint = 'overview.metrics';
  const params = new URLSearchParams({
    batch: '1',
    input: JSON.stringify({ "0": { "json": { "dateRange": "30 DAYS" } } })
  });

  console.log('🧪 Testing cache performance...\n');

  // Test 1: First request (cache MISS)
  console.log('📊 Request 1 (Cache MISS expected):');
  const start1 = Date.now();
  const response1 = await fetch(`${baseUrl}/${endpoint}?${params}`);
  const data1 = await response1.json();
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Data received: ${JSON.stringify(data1).length} bytes\n`);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test 2: Second request (cache HIT)
  console.log('📊 Request 2 (Cache HIT expected):');
  const start2 = Date.now();
  const response2 = await fetch(`${baseUrl}/${endpoint}?${params}`);
  const data2 = await response2.json();
  const time2 = Date.now() - start2;
  console.log(`   Response time: ${time2}ms`);
  console.log(`   Data received: ${JSON.stringify(data2).length} bytes\n`);

  // Calculate improvement
  const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
  const speedup = (time1 / time2).toFixed(1);

  console.log('📈 Performance Summary:');
  console.log(`   Cache MISS: ${time1}ms`);
  console.log(`   Cache HIT:  ${time2}ms`);
  console.log(`   Improvement: ${improvement}% faster`);
  console.log(`   Speedup: ${speedup}x\n`);

  if (time2 < time1) {
    console.log('✅ Cache is working correctly!');
  } else {
    console.log('⚠️  Cache might not be working as expected');
  }
}

testCachePerformance().catch(console.error);
