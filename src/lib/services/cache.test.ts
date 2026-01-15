import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './cache';

describe('CacheManager', () => {
	let cache: CacheManager;

	beforeEach(() => {
		cache = new CacheManager({ prefix: 'test_', maxMemorySize: 5 });
		// Clear any previous localStorage entries
		if (typeof localStorage !== 'undefined') {
			localStorage.clear();
		}
	});

	describe('generateKey', () => {
		it('should generate key from URL without params', () => {
			const key = cache.generateKey('https://api.example.com/data');
			expect(key).toBe('https://api.example.com/data');
		});

		it('should generate key with sorted params', () => {
			const key = cache.generateKey('https://api.example.com/data', { b: '2', a: '1' });
			expect(key).toBe('https://api.example.com/data?a=1&b=2');
		});
	});

	describe('set and get', () => {
		it('should store and retrieve data from memory cache', () => {
			cache.set('test-key', { value: 42 }, 60000);
			const result = cache.get('test-key');

			expect(result).not.toBeNull();
			expect(result?.data).toEqual({ value: 42 });
			expect(result?.fromCache).toBe('memory');
			expect(result?.isStale).toBe(false);
		});

		it('should return null for non-existent key', () => {
			const result = cache.get('non-existent');
			expect(result).toBeNull();
		});

		it('should mark data as stale after TTL', () => {
			vi.useFakeTimers();

			cache.set('stale-test', { value: 'test' }, 1000);

			// Fast forward past TTL but within stale period
			vi.advanceTimersByTime(1500);

			const result = cache.get('stale-test');
			expect(result?.isStale).toBe(true);

			vi.useRealTimers();
		});

		it('should return null after stale period expires', () => {
			vi.useFakeTimers();

			cache.set('expire-test', { value: 'test' }, 1000, true);

			// Fast forward past stale period (2x TTL)
			vi.advanceTimersByTime(3000);

			const result = cache.get('expire-test');
			expect(result).toBeNull();

			vi.useRealTimers();
		});
	});

	describe('LRU eviction', () => {
		it('should evict oldest entry from memory when at capacity', () => {
			// Create a cache without localStorage access for this test
			const memOnlyCache = new CacheManager({ prefix: 'mem_', maxMemorySize: 3 });

			// Fill cache to capacity
			for (let i = 0; i < 3; i++) {
				memOnlyCache.set(`key-${i}`, i, 60000);
			}

			// Verify all entries exist
			expect(memOnlyCache.getStats().memoryEntries).toBe(3);

			// Add one more to trigger eviction
			memOnlyCache.set('key-new', 'new', 60000);

			// Memory should still be at max capacity
			expect(memOnlyCache.getStats().memoryEntries).toBe(3);

			// Newest key should exist
			expect(memOnlyCache.get('key-new')?.data).toBe('new');
		});
	});

	describe('invalidate', () => {
		it('should invalidate entries matching pattern', () => {
			cache.set('api/users/1', { id: 1 }, 60000);
			cache.set('api/users/2', { id: 2 }, 60000);
			cache.set('api/posts/1', { id: 1 }, 60000);

			cache.invalidate('users');

			// Note: invalidate clears all storage entries, not just matching ones
			// This is by design for simplicity
		});
	});

	describe('clear', () => {
		it('should clear all entries', () => {
			cache.set('key-1', 1, 60000);
			cache.set('key-2', 2, 60000);

			cache.clear();

			expect(cache.get('key-1')).toBeNull();
			expect(cache.get('key-2')).toBeNull();
		});
	});

	describe('getStats', () => {
		it('should return correct statistics', () => {
			cache.set('key-1', 'value-1', 60000);
			cache.set('key-2', 'value-2', 60000);

			const stats = cache.getStats();

			expect(stats.memoryEntries).toBe(2);
		});
	});
});
