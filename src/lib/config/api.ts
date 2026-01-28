/**
 * API Configuration
 */

import { browser } from '$app/environment';
import { isAllowedProxyUrl } from '$lib/services/security';

/**
 * Finnhub API key
 * Get your free key at: https://finnhub.io/
 * Free tier: 60 calls/minute
 */
export const FINNHUB_API_KEY = browser
	? (import.meta.env?.VITE_FINNHUB_API_KEY ?? '')
	: (process.env.VITE_FINNHUB_API_KEY ?? '');

export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * FRED API key (St. Louis Fed)
 * Get your free key at: https://fred.stlouisfed.org/docs/api/api_key.html
 * Free tier: Unlimited requests
 */
export const FRED_API_KEY = browser
	? (import.meta.env?.VITE_FRED_API_KEY ?? '')
	: (process.env.VITE_FRED_API_KEY ?? '');

export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Check if we're in development mode
 * Uses import.meta.env which is available in both browser and test environments
 */
const isDev = browser ? (import.meta.env?.DEV ?? false) : false;

/**
 * CORS proxy URL for external API requests
 * Uses custom Cloudflare Worker for CORS handling
 * Security: Only allows requests to whitelisted domains
 */
export const CORS_PROXY_URL = 'https://situation-monitor-proxy.seanthielen-e.workers.dev/?url=' as const;

/**
 * Fetch with CORS proxy - validates URLs against whitelist
 * Security: Only allows requests to whitelisted domains to prevent SSRF attacks
 * @param url - URL to fetch through proxy
 * @returns Response from proxy or error response if URL is not allowed
 */
export async function fetchWithProxy(url: string): Promise<Response> {
	// Validate URL is allowed for proxying (prevents SSRF attacks)
	if (!isAllowedProxyUrl(url)) {
		logger.error('API', `Blocked proxy request to non-whitelisted domain: ${url}`);
		return new Response(JSON.stringify({ error: 'URL not in allowed domain list' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const encodedUrl = encodeURIComponent(url);

	try {
		const response = await fetch(CORS_PROXY_URL + encodedUrl);
		if (response.ok) {
			return response;
		}

		logger.warn('API', `Proxy request failed (${response.status}): ${url}`);
		return response;
	} catch (error) {
		logger.error('API', `Proxy request error for ${url}:`, error);
		// Return a failed response rather than throwing
		return new Response(JSON.stringify({ error: 'Proxy request failed', details: String(error) }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

/**
 * API request delays (ms) to avoid rate limiting
 */
export const API_DELAYS = {
	betweenCategories: 500,
	betweenRetries: 1000
} as const;

/**
 * Cache TTLs (ms)
 */
export const CACHE_TTLS = {
	weather: 10 * 60 * 1000, // 10 minutes
	news: 5 * 60 * 1000, // 5 minutes
	markets: 60 * 1000, // 1 minute
	default: 5 * 60 * 1000 // 5 minutes
} as const;

/**
 * Debug/logging configuration
 */
export const DEBUG = {
	enabled: isDev,
	logApiCalls: isDev,
	logCacheHits: false
} as const;

/**
 * Conditional logger - only logs in development
 */
export const logger = {
	log: (prefix: string, ...args: unknown[]) => {
		if (DEBUG.logApiCalls) {
			console.log(`[${prefix}]`, ...args);
		}
	},
	warn: (prefix: string, ...args: unknown[]) => {
		console.warn(`[${prefix}]`, ...args);
	},
	error: (prefix: string, ...args: unknown[]) => {
		console.error(`[${prefix}]`, ...args);
	}
};
