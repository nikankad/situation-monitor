/**
 * ServiceClient - Unified fetch client with caching, retries, and circuit breaker
 */

import { CacheManager } from './cache';
import { CircuitBreakerRegistry, type CircuitBreaker } from './circuit-breaker';
import { RequestDeduplicator } from './deduplicator';
import { ServiceRegistry, type ServiceConfig, type ServiceId } from './registry';
import { ServiceError, NetworkError, TimeoutError, CircuitOpenError } from './errors';

export interface RequestOptions {
	params?: Record<string, string | number | boolean>;
	useCache?: boolean;
	retries?: number;
	timeout?: number;
	accept?: string;
	headers?: Record<string, string>;
	fetchOptions?: RequestInit;
	responseType?: 'json' | 'text';
}

export interface RequestResult<T = unknown> {
	data: T;
	fromCache: false | 'memory' | 'storage' | 'fallback' | 'stale-fallback';
	stale?: boolean;
	circuitOpen?: boolean;
	attempt?: number;
	error?: string;
}

export interface ServiceClientOptions {
	debug?: boolean;
}

export interface HealthStatus {
	circuitBreakers: Record<string, ReturnType<CircuitBreaker['getState']>>;
	openCircuits: number;
	inFlightRequests: number;
	cacheStats: ReturnType<CacheManager['getStats']>;
}

export class ServiceClient {
	private readonly cache: CacheManager;
	private readonly circuitBreakers: CircuitBreakerRegistry;
	private readonly deduplicator: RequestDeduplicator;
	private readonly debug: boolean;

	constructor(options: ServiceClientOptions = {}) {
		this.cache = new CacheManager({ prefix: 'sm_', debug: options.debug });
		this.circuitBreakers = new CircuitBreakerRegistry();
		this.deduplicator = new RequestDeduplicator();
		this.debug = options.debug || false;
	}

	/**
	 * Main request method - handles caching, circuit breaker, deduplication
	 */
	async request<T = unknown>(
		serviceId: ServiceId | string,
		endpoint: string,
		options: RequestOptions = {}
	): Promise<RequestResult<T>> {
		const config = ServiceRegistry.get(serviceId);
		if (!config) {
			throw new ServiceError(`Unknown service: ${serviceId}`, serviceId);
		}

		const url = this.buildUrl(config, endpoint, options.params);
		const cacheKey = this.cache.generateKey(url, options.params);

		// 1. Check cache first (unless explicitly disabled)
		if (options.useCache !== false && config.cache) {
			const cached = this.cache.get<T>(cacheKey);
			if (cached && !cached.isStale) {
				return { data: cached.data, fromCache: cached.fromCache, stale: false };
			}
			if (cached && cached.isStale && config.cache.staleWhileRevalidate) {
				// Return stale data immediately, revalidate in background
				this.revalidateInBackground(serviceId, endpoint, options, cacheKey, config);
				return { data: cached.data, fromCache: cached.fromCache, stale: true };
			}
		}

		// 2. Check circuit breaker
		const breaker = this.circuitBreakers.get(serviceId, config.circuitBreaker);
		if (!breaker.canRequest()) {
			// Circuit is open - try to return cached data
			const cached = this.cache.get<T>(cacheKey);
			if (cached) {
				return { data: cached.data, fromCache: 'fallback', circuitOpen: true };
			}
			throw new CircuitOpenError(serviceId);
		}

		// 3. Deduplicate concurrent requests
		return this.deduplicator.dedupe(cacheKey, () =>
			this.executeRequest<T>(serviceId, url, options, cacheKey, breaker, config)
		);
	}

	/**
	 * Execute the actual request with retries
	 */
	private async executeRequest<T>(
		serviceId: string,
		url: string,
		options: RequestOptions,
		cacheKey: string,
		breaker: CircuitBreaker,
		config: ServiceConfig
	): Promise<RequestResult<T>> {
		const retries = options.retries ?? config.retries ?? 2;
		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				if (attempt > 0) {
					this.log(`Retry attempt ${attempt} for ${serviceId}`);
				}

				breaker.trackHalfOpenRequest();
				const data = await this.fetchWithTimeout<T>(url, options, config);
				breaker.recordSuccess();

				// Cache successful response
				if (config.cache) {
					this.cache.set(cacheKey, data, config.cache.ttl, config.cache.staleWhileRevalidate);
				}

				return { data, fromCache: false, attempt };
			} catch (error) {
				lastError = error as Error;
				this.log(`Request failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`);

				// Don't retry on certain errors
				if (
					error instanceof CircuitOpenError ||
					(error instanceof NetworkError &&
						(error.status === 404 || error.status === 401 || error.status === 403))
				) {
					break;
				}

				if (attempt < retries) {
					await this.delay(this.getBackoffDelay(attempt));
				}
			}
		}

		breaker.recordFailure();

		// Try returning stale cache on failure
		const cached = this.cache.get<T>(cacheKey);
		if (cached) {
			console.warn(
				`[ServiceClient] ${serviceId}: Returning stale cache after ${retries + 1} failed attempts`
			);
			return { data: cached.data, fromCache: 'stale-fallback', error: lastError?.message };
		}

		throw lastError;
	}

	/**
	 * Fetch with AbortController timeout
	 */
	private async fetchWithTimeout<T>(
		url: string,
		options: RequestOptions,
		config: ServiceConfig
	): Promise<T> {
		const controller = new AbortController();
		const timeout = options.timeout || config.timeout || 10000;
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const fetchOptions: RequestInit = {
				...options.fetchOptions,
				signal: controller.signal,
				headers: {
					Accept: options.accept || 'application/json',
					...options.headers
				}
			};

			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
			}

			// Handle different response types
			const contentType = response.headers.get('content-type') || '';
			if (
				options.responseType === 'text' ||
				contentType.includes('text/') ||
				contentType.includes('xml')
			) {
				return (await response.text()) as T;
			}
			return (await response.json()) as T;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new TimeoutError(url, timeout);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Build URL from config and endpoint
	 */
	private buildUrl(
		config: ServiceConfig,
		endpoint: string,
		params: Record<string, string | number | boolean> = {}
	): string {
		let baseUrl = config.baseUrl || '';

		// Handle full URLs (for CORS proxy passthrough)
		if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
			baseUrl = '';
		}

		const fullUrl = baseUrl + endpoint;
		const url = new URL(fullUrl);

		// Add query params
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});

		return url.toString();
	}

	/**
	 * Calculate exponential backoff delay with jitter
	 */
	private getBackoffDelay(attempt: number): number {
		// Base: 1s, 2s, 4s... + random 0-500ms jitter
		const baseDelay = Math.pow(2, attempt) * 1000;
		const jitter = Math.random() * 500;
		return Math.min(baseDelay + jitter, 10000); // Max 10 seconds
	}

	/**
	 * Delay helper
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Revalidate in background (fire and forget)
	 */
	private revalidateInBackground(
		serviceId: ServiceId | string,
		endpoint: string,
		options: RequestOptions,
		cacheKey: string,
		config: ServiceConfig
	): void {
		const breaker = this.circuitBreakers.get(serviceId, config.circuitBreaker);
		const url = this.buildUrl(config, endpoint, options.params);

		this.executeRequest(serviceId, url, { ...options, useCache: false }, cacheKey, breaker, config)
			.then(() => this.log(`Background revalidation complete: ${serviceId}`))
			.catch(() => this.log(`Background revalidation failed: ${serviceId}`));
	}

	/**
	 * Fetch through CORS proxy with fallback
	 */
	async fetchWithProxy<T = string>(targetUrl: string, options: RequestOptions = {}): Promise<T> {
		const proxies = ServiceRegistry.getCorsProxies();
		const config = ServiceRegistry.get('CORS_PROXY');
		if (!config) {
			throw new ServiceError('CORS_PROXY service not configured');
		}

		let lastError: Error | undefined;

		for (let i = 0; i < proxies.length; i++) {
			const proxy = proxies[i];
			const proxyUrl = proxy + encodeURIComponent(targetUrl);

			try {
				const response = await this.fetchWithTimeout<string>(
					proxyUrl,
					{
						...options,
						accept: 'application/rss+xml, application/xml, text/xml, */*',
						responseType: 'text'
					},
					config
				);

				// Validate response (check for error pages)
				if (
					response &&
					!response.includes('<!DOCTYPE html>') &&
					!response.includes('error code:')
				) {
					return response as T;
				}
			} catch (e) {
				this.log(`Proxy ${i + 1} failed: ${(e as Error).message}`);
				lastError = e as Error;
			}
		}

		throw lastError || new NetworkError('All CORS proxies failed');
	}

	/**
	 * Get health status of all services
	 */
	getHealthStatus(): HealthStatus {
		return {
			circuitBreakers: this.circuitBreakers.getStatus(),
			openCircuits: this.circuitBreakers.getOpenCount(),
			inFlightRequests: this.deduplicator.getCount(),
			cacheStats: this.cache.getStats()
		};
	}

	/**
	 * Clear cache for a specific service pattern
	 */
	clearServiceCache(pattern: string): void {
		this.cache.invalidate(pattern);
	}

	/**
	 * Reset all circuit breakers
	 */
	resetCircuitBreakers(): void {
		this.circuitBreakers.resetAll();
	}

	/**
	 * Debug logging
	 */
	private log(message: string): void {
		if (this.debug) {
			console.log(`[ServiceClient] ${message}`);
		}
	}
}

// Export singleton instance
export const serviceClient = new ServiceClient({ debug: false });
