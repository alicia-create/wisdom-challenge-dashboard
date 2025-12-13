import { describe, it, expect, beforeEach } from 'vitest';
import { cache } from './cache';

describe('Intelligent Cache', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await cache.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', async () => {
      const key = 'test:key';
      const value = { foo: 'bar', count: 42 };

      await cache.set(key, value, 60 * 1000); // 1 minute TTL
      const retrieved = await cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await cache.get('non:existent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      const value = 'test value';

      expect(await cache.has(key)).toBe(false);

      await cache.set(key, value, 60 * 1000);
      expect(await cache.has(key)).toBe(true);
    });

    it('should delete values', async () => {
      const key = 'test:delete';
      const value = 'to be deleted';

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toBe(value);

      await cache.delete(key);
      expect(await cache.get(key)).toBeUndefined();
    });

    it('should clear all cache', async () => {
      await cache.set('key1', 'value1', 60 * 1000);
      await cache.set('key2', 'value2', 60 * 1000);

      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(true);

      await cache.clear();

      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });
  });

  describe('TTL Behavior', () => {
    it('should expire values after TTL', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';

      // Set with very short TTL (100ms)
      await cache.set(key, value, 100);

      // Should exist immediately
      expect(await cache.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(await cache.get(key)).toBeUndefined();
    });

    it('should not expire before TTL', async () => {
      const key = 'test:ttl:valid';
      const value = 'still valid';

      // Set with 1 second TTL
      await cache.set(key, value, 1000);

      // Wait 500ms (half the TTL)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should still exist
      expect(await cache.get(key)).toBe(value);
    });
  });

  describe('Data Types', () => {
    it('should handle strings', async () => {
      const key = 'test:string';
      const value = 'hello world';

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toBe(value);
    });

    it('should handle numbers', async () => {
      const key = 'test:number';
      const value = 42;

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toBe(value);
    });

    it('should handle objects', async () => {
      const key = 'test:object';
      const value = {
        name: 'John',
        age: 30,
        nested: { foo: 'bar' },
      };

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toEqual(value);
    });

    it('should handle arrays', async () => {
      const key = 'test:array';
      const value = [1, 2, 3, 'four', { five: 5 }];

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toEqual(value);
    });

    it('should handle null', async () => {
      const key = 'test:null';
      const value = null;

      await cache.set(key, value, 60 * 1000);
      expect(await cache.get(key)).toBeNull();
    });

    it('should handle boolean', async () => {
      const key = 'test:boolean';
      
      await cache.set(key, true, 60 * 1000);
      expect(await cache.get(key)).toBe(true);

      await cache.set(key, false, 60 * 1000);
      expect(await cache.get(key)).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache stats', () => {
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('backend');
      expect(['redis', 'memory']).toContain(stats.backend);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should cache dashboard metrics', async () => {
      const metricsKey = 'overview:metrics:TODAY';
      const metricsData = {
        totalLeads: 100,
        totalSales: 25,
        totalSpend: 1000,
        roas: 2.5,
      };

      // First request - cache miss
      let cached = await cache.get(metricsKey);
      expect(cached).toBeUndefined();

      // Store in cache
      await cache.set(metricsKey, metricsData, 5 * 60 * 1000); // 5 minutes

      // Second request - cache hit
      cached = await cache.get(metricsKey);
      expect(cached).toEqual(metricsData);
    });

    it('should cache daily KPIs', async () => {
      const kpisKey = 'overview:dailyKpis:7 DAYS';
      const kpisData = [
        { date: '2025-12-13', leads: 10, sales: 2 },
        { date: '2025-12-12', leads: 15, sales: 3 },
      ];

      await cache.set(kpisKey, kpisData, 10 * 60 * 1000); // 10 minutes
      
      const cached = await cache.get(kpisKey);
      expect(cached).toEqual(kpisData);
    });

    it('should invalidate cache on date range change', async () => {
      // Cache data for TODAY
      await cache.set('overview:metrics:TODAY', { leads: 10 }, 5 * 60 * 1000);
      
      // Cache data for 7 DAYS
      await cache.set('overview:metrics:7 DAYS', { leads: 70 }, 5 * 60 * 1000);

      // Both should exist
      expect(await cache.has('overview:metrics:TODAY')).toBe(true);
      expect(await cache.has('overview:metrics:7 DAYS')).toBe(true);

      // Invalidate TODAY
      await cache.delete('overview:metrics:TODAY');

      // Only 7 DAYS should remain
      expect(await cache.has('overview:metrics:TODAY')).toBe(false);
      expect(await cache.has('overview:metrics:7 DAYS')).toBe(true);
    });
  });
});
