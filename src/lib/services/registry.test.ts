import { describe, it, expect } from 'vitest';
import { ServiceRegistry } from './registry';

describe('ServiceRegistry', () => {
	describe('get', () => {
		it('should return config for registered service', () => {
			const config = ServiceRegistry.get('GDELT');

			expect(config).not.toBeNull();
			expect(config?.id).toBe('gdelt');
			expect(config?.baseUrl).toBe('https://api.gdeltproject.org');
		});

		it('should return null for unknown service', () => {
			const config = ServiceRegistry.get('UNKNOWN');

			expect(config).toBeNull();
		});
	});

	describe('getServiceIds', () => {
		it('should return all registered service IDs', () => {
			const ids = ServiceRegistry.getServiceIds();

			expect(ids).toContain('GDELT');
			expect(ids).toContain('COINGECKO');
			expect(ids).toContain('FRED');
			expect(ids).toContain('USGS');
			expect(ids).toContain('CORS_PROXY');
		});
	});

	describe('has', () => {
		it('should return true for registered services', () => {
			expect(ServiceRegistry.has('GDELT')).toBe(true);
			expect(ServiceRegistry.has('COINGECKO')).toBe(true);
		});

		it('should return false for unknown services', () => {
			expect(ServiceRegistry.has('UNKNOWN')).toBe(false);
		});
	});

	describe('getCorsProxies', () => {
		it('should return list of CORS proxies', () => {
			const proxies = ServiceRegistry.getCorsProxies();

			expect(proxies).toBeInstanceOf(Array);
			expect(proxies.length).toBeGreaterThan(0);
			expect(proxies[0]).toContain('situation-monitor-proxy');
		});
	});

	describe('getAll', () => {
		it('should return all service configurations', () => {
			const all = ServiceRegistry.getAll();

			expect(all.GDELT).toBeDefined();
			expect(all.COINGECKO).toBeDefined();
		});
	});

	describe('service configurations', () => {
		it('should have valid cache config for GDELT', () => {
			const config = ServiceRegistry.get('GDELT');

			expect(config?.cache?.ttl).toBe(3 * 60 * 1000);
			expect(config?.cache?.staleWhileRevalidate).toBe(true);
		});

		it('should have valid circuit breaker config for COINGECKO', () => {
			const config = ServiceRegistry.get('COINGECKO');

			expect(config?.circuitBreaker?.failureThreshold).toBe(3);
			expect(config?.circuitBreaker?.resetTimeout).toBe(120000);
		});

		it('should have longer TTL for FRED (weekly data)', () => {
			const config = ServiceRegistry.get('FRED');

			expect(config?.cache?.ttl).toBe(60 * 60 * 1000); // 1 hour
		});
	});
});
