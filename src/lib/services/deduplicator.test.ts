import { describe, it, expect, beforeEach } from 'vitest';
import { RequestDeduplicator } from './deduplicator';

describe('RequestDeduplicator', () => {
	let deduplicator: RequestDeduplicator;

	beforeEach(() => {
		deduplicator = new RequestDeduplicator();
	});

	describe('dedupe', () => {
		it('should return same promise for concurrent requests', async () => {
			let callCount = 0;
			const requestFn = () =>
				new Promise<string>((resolve) => {
					callCount++;
					setTimeout(() => resolve('result'), 100);
				});

			// Start two concurrent requests
			const promise1 = deduplicator.dedupe('test-key', requestFn);
			const promise2 = deduplicator.dedupe('test-key', requestFn);

			// Both should be the same promise
			expect(promise1).toBe(promise2);

			// Request function should only be called once
			expect(callCount).toBe(1);

			// Both should resolve to same value
			const [result1, result2] = await Promise.all([promise1, promise2]);
			expect(result1).toBe('result');
			expect(result2).toBe('result');
		});

		it('should make new request after previous completes', async () => {
			let callCount = 0;
			const requestFn = () =>
				new Promise<number>((resolve) => {
					callCount++;
					resolve(callCount);
				});

			// First request
			const result1 = await deduplicator.dedupe('test-key', requestFn);
			expect(result1).toBe(1);

			// Second request (first is done)
			const result2 = await deduplicator.dedupe('test-key', requestFn);
			expect(result2).toBe(2);

			expect(callCount).toBe(2);
		});

		it('should track different keys separately', async () => {
			let callCount = 0;
			const requestFn = () =>
				new Promise<number>((resolve) => {
					callCount++;
					resolve(callCount);
				});

			// Concurrent requests with different keys
			const [result1, result2] = await Promise.all([
				deduplicator.dedupe('key-1', requestFn),
				deduplicator.dedupe('key-2', requestFn)
			]);

			expect(callCount).toBe(2);
			expect(result1).not.toBe(result2);
		});
	});

	describe('isInFlight', () => {
		it('should return true for in-flight requests', () => {
			deduplicator.dedupe('test-key', () => new Promise((resolve) => setTimeout(resolve, 1000)));

			expect(deduplicator.isInFlight('test-key')).toBe(true);
		});

		it('should return false after request completes', async () => {
			await deduplicator.dedupe('test-key', () => Promise.resolve('done'));

			expect(deduplicator.isInFlight('test-key')).toBe(false);
		});
	});

	describe('getCount', () => {
		it('should return number of in-flight requests', () => {
			deduplicator.dedupe('key-1', () => new Promise((resolve) => setTimeout(resolve, 1000)));
			deduplicator.dedupe('key-2', () => new Promise((resolve) => setTimeout(resolve, 1000)));

			expect(deduplicator.getCount()).toBe(2);
		});
	});

	describe('clear', () => {
		it('should clear all tracked requests', () => {
			deduplicator.dedupe('key-1', () => new Promise((resolve) => setTimeout(resolve, 1000)));
			deduplicator.dedupe('key-2', () => new Promise((resolve) => setTimeout(resolve, 1000)));

			deduplicator.clear();

			expect(deduplicator.getCount()).toBe(0);
		});
	});

	describe('error handling', () => {
		it('should clean up after rejected promise', async () => {
			const requestFn = () => Promise.reject(new Error('test error'));

			try {
				await deduplicator.dedupe('test-key', requestFn);
			} catch {
				// Expected to throw
			}

			// Should be cleaned up
			expect(deduplicator.isInFlight('test-key')).toBe(false);
		});
	});
});
