/**
 * CacheManager - Two-tier caching with memory (L1) and localStorage (L2)
 */

export interface CacheEntry<T = unknown> {
	data: T;
	timestamp: number;
	ttl: number;
	staleUntil: number;
}

export interface CacheResult<T = unknown> {
	data: T;
	fromCache: 'memory' | 'storage';
	isStale: boolean;
}

export interface CacheManagerOptions {
	prefix?: string;
	maxMemorySize?: number;
	debug?: boolean;
}

export interface CacheStats {
	memoryEntries: number;
	storageEntries: number;
	storageSizeKB: number;
}

export class CacheManager {
	private memoryCache: Map<string, CacheEntry>;
	private readonly storagePrefix: string;
	private readonly maxMemorySize: number;
	private readonly debug: boolean;

	constructor(options: CacheManagerOptions = {}) {
		this.memoryCache = new Map();
		this.storagePrefix = options.prefix || 'sm_cache_';
		this.maxMemorySize = options.maxMemorySize || 100;
		this.debug = options.debug || false;
	}

	/**
	 * Generate a cache key from URL and params
	 */
	generateKey(url: string, params: Record<string, string | number | boolean> = {}): string {
		const sortedParams = Object.keys(params)
			.sort()
			.map((k) => `${k}=${params[k]}`)
			.join('&');
		return `${url}${sortedParams ? '?' + sortedParams : ''}`;
	}

	/**
	 * Get from cache - checks memory first, then localStorage
	 */
	get<T = unknown>(key: string): CacheResult<T> | null {
		// L1: Memory check
		if (this.memoryCache.has(key)) {
			const entry = this.memoryCache.get(key) as CacheEntry<T>;
			if (this.isValid(entry)) {
				this.log(`Cache HIT (memory): ${key.substring(0, 50)}...`);
				return { data: entry.data, fromCache: 'memory', isStale: this.isStale(entry) };
			}
			this.memoryCache.delete(key);
		}

		// L2: Storage check
		if (typeof localStorage === 'undefined') {
			this.log(`Cache MISS (no localStorage): ${key.substring(0, 50)}...`);
			return null;
		}

		try {
			const stored = localStorage.getItem(this.storagePrefix + this.hashKey(key));
			if (stored) {
				const entry = JSON.parse(stored) as CacheEntry<T>;
				if (this.isValid(entry)) {
					// Promote to memory cache
					this.setMemory(key, entry);
					this.log(`Cache HIT (storage): ${key.substring(0, 50)}...`);
					return { data: entry.data, fromCache: 'storage', isStale: this.isStale(entry) };
				}
				localStorage.removeItem(this.storagePrefix + this.hashKey(key));
			}
		} catch (e) {
			// Storage read error - continue without cache
			this.log(`Storage read error: ${(e as Error).message}`);
		}

		this.log(`Cache MISS: ${key.substring(0, 50)}...`);
		return null;
	}

	/**
	 * Set in both caches
	 */
	set<T = unknown>(key: string, data: T, ttl: number, staleWhileRevalidate = true): void {
		const now = Date.now();
		const entry: CacheEntry<T> = {
			data,
			timestamp: now,
			ttl,
			staleUntil: staleWhileRevalidate ? now + ttl * 2 : now + ttl
		};

		this.setMemory(key, entry);
		this.setStorage(key, entry);
		this.log(`Cache SET: ${key.substring(0, 50)}... (TTL: ${ttl / 1000}s)`);
	}

	/**
	 * Memory cache with LRU eviction
	 */
	private setMemory<T>(key: string, entry: CacheEntry<T>): void {
		// LRU eviction - remove oldest entry if at capacity
		if (this.memoryCache.size >= this.maxMemorySize) {
			const firstKey = this.memoryCache.keys().next().value;
			if (firstKey) {
				this.memoryCache.delete(firstKey);
			}
		}
		this.memoryCache.set(key, entry as CacheEntry);
	}

	/**
	 * Storage with error handling and quota management
	 */
	private setStorage<T>(key: string, entry: CacheEntry<T>): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		try {
			const serialized = JSON.stringify(entry);
			localStorage.setItem(this.storagePrefix + this.hashKey(key), serialized);
		} catch (e) {
			if ((e as Error).name === 'QuotaExceededError') {
				this.pruneStorage();
				try {
					localStorage.setItem(this.storagePrefix + this.hashKey(key), JSON.stringify(entry));
				} catch {
					this.log(`Storage quota exceeded, could not save: ${key.substring(0, 30)}...`);
				}
			}
		}
	}

	/**
	 * Check if entry is still valid (not beyond stale period)
	 */
	private isValid(entry: CacheEntry): boolean {
		return Date.now() < entry.staleUntil;
	}

	/**
	 * Check if entry is stale (past TTL but still within stale period)
	 */
	private isStale(entry: CacheEntry): boolean {
		return Date.now() > entry.timestamp + entry.ttl;
	}

	/**
	 * Hash long keys to fit in localStorage key limits
	 */
	private hashKey(key: string): string {
		let hash = 0;
		for (let i = 0; i < key.length; i++) {
			const char = key.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}

	/**
	 * Remove oldest cache entries to free up space
	 */
	private pruneStorage(): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		const keys: Array<{ key: string; timestamp: number }> = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(this.storagePrefix)) {
				try {
					const entry = JSON.parse(localStorage.getItem(key) || '') as CacheEntry;
					keys.push({ key, timestamp: entry.timestamp });
				} catch {
					// Invalid entry - remove it
					localStorage.removeItem(key);
				}
			}
		}
		// Sort by timestamp (oldest first) and remove half
		keys.sort((a, b) => a.timestamp - b.timestamp);
		keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k.key));
		this.log(`Pruned ${Math.ceil(keys.length / 2)} old cache entries`);
	}

	/**
	 * Invalidate cache entries matching a pattern
	 */
	invalidate(pattern: string): void {
		let count = 0;

		// Clear from memory
		for (const [key] of this.memoryCache) {
			if (key.includes(pattern)) {
				this.memoryCache.delete(key);
				count++;
			}
		}

		// Clear from storage
		if (typeof localStorage !== 'undefined') {
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				if (key?.startsWith(this.storagePrefix)) {
					localStorage.removeItem(key);
					count++;
				}
			}
		}

		this.log(`Invalidated ${count} entries matching: ${pattern}`);
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.memoryCache.clear();

		if (typeof localStorage !== 'undefined') {
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				if (key?.startsWith(this.storagePrefix)) {
					localStorage.removeItem(key);
				}
			}
		}

		this.log('Cache cleared');
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		let storageCount = 0;
		let storageSize = 0;

		if (typeof localStorage !== 'undefined') {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(this.storagePrefix)) {
					storageCount++;
					storageSize += (localStorage.getItem(key) || '').length;
				}
			}
		}

		return {
			memoryEntries: this.memoryCache.size,
			storageEntries: storageCount,
			storageSizeKB: Math.round((storageSize / 1024) * 100) / 100
		};
	}

	/**
	 * Debug logging
	 */
	private log(message: string): void {
		if (this.debug) {
			console.log(`[CacheManager] ${message}`);
		}
	}
}

// Export singleton instance
export const cacheManager = new CacheManager({ prefix: 'sm_' });
