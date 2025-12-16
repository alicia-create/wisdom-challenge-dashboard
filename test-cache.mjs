// Test cache behavior
const cache = { cached: true };
console.log('Cache object:', cache);
console.log('Is truthy:', !!cache);
console.log('Has insights:', cache.insights !== null);
console.log('Spread result:', { ...cache, cached: true });

// The issue: if cache stores { cached: true } only, then spread returns just that
const emptyCache = { cached: true };
const result = { ...emptyCache, cached: true };
console.log('Result with empty cache:', result);
