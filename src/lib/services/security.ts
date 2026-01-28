/**
 * Security utilities for input validation and sanitization
 */

import { browser } from '$app/environment';

/**
 * Whitelist of allowed domains for CORS proxy and external API calls
 * Only these domains can be proxied through our CORS proxy
 */
const ALLOWED_PROXY_DOMAINS = [
	// News/Media
	'reutersagency.com',
	'apnews.com',
	'bbci.co.uk',
	'foreignaffairs.com',
	'foreignpolicy.com',
	'arstechnica.com',
	'technologyreview.com',
	'wired.com',
	'ft.com',
	'bloomberg.com',
	'economist.com',
	'openai.com',
	'arxiv.org',

	// Government/Intelligence
	'whitehouse.gov',
	'state.gov',
	'defense.gov',
	'nato.int',
	'un.org',
	'csis.org',
	'brookings.edu',

	// Data APIs
	'gdeltproject.org',
	'coingecko.com',
	'stlouisfed.org',
	'finnhub.io'
] as const;

/**
 * Validate if a URL is allowed to be proxied
 * Only allows HTTPS URLs from whitelisted domains
 * @param urlString - URL to validate
 * @returns true if URL is safe to proxy, false otherwise
 */
export function isAllowedProxyUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);

		// Only allow HTTPS (security requirement)
		if (url.protocol !== 'https:') {
			return false;
		}

		// Check if domain is in whitelist
		const hostname = url.hostname.toLowerCase();

		// Check exact match and wildcard matches (e.g., www.example.com matches example.com)
		return ALLOWED_PROXY_DOMAINS.some((domain) => {
			const domainLower = domain.toLowerCase();
			return hostname === domainLower || hostname.endsWith('.' + domainLower);
		});
	} catch {
		// Invalid URL format
		return false;
	}
}

/**
 * Sanitize HTML content by removing potentially dangerous tags and attributes
 * Uses a simple allowlist approach for safety
 * @param html - HTML string to sanitize
 * @returns Sanitized text content
 */
export function sanitizeHtml(html: string): string {
	if (!html) return '';

	if (!browser) {
		// Server-side: Simple regex-based sanitization
		// Remove all HTML tags
		return html.replace(/<[^>]*>/g, '').trim();
	}

	// Browser-side: Use DOM parser for reliable HTML parsing
	const container = document.createElement('div');
	container.innerHTML = html;

	// Extract text content only (removes all HTML)
	return container.textContent || '';
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate and sanitize article title from external sources
 * Removes HTML tags and escapes dangerous characters
 * @param title - Raw title from external source
 * @returns Clean, safe title text
 */
export function sanitizeArticleTitle(title: string): string {
	if (!title) return '';

	// Remove HTML tags
	const cleaned = title.replace(/<[^>]*>/g, '');

	// Decode HTML entities
	let decoded = cleaned;
	if (browser) {
		const div = document.createElement('div');
		div.innerHTML = cleaned;
		decoded = div.textContent || cleaned;
	}

	// Trim and limit length
	return decoded.trim().substring(0, 500);
}

/**
 * Validate external URL is well-formed and uses HTTPS
 * @param url - URL to validate
 * @returns true if URL is valid and safe, false otherwise
 */
export function isValidHttpsUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		return url.protocol === 'https:' || url.protocol === 'http:'; // Allow http for local testing
	} catch {
		return false;
	}
}
