/**
 * RequestDeduplicator - Prevent duplicate in-flight requests
 */

export class RequestDeduplicator {
	private inFlight: Map<string, Promise<unknown>> = new Map();

	/**
	 * Get an existing in-flight request promise if one exists
	 */
	get<T>(key: string): Promise<T> | null {
		return (this.inFlight.get(key) as Promise<T>) || null;
	}

	/**
	 * Track a new in-flight request
	 */
	track<T>(key: string, promise: Promise<T>): Promise<T> {
		this.inFlight.set(key, promise);

		// Clean up when promise resolves or rejects
		promise
			.finally(() => this.inFlight.delete(key))
			.catch(() => {
				// Prevent unhandled rejection
			});

		return promise;
	}

	/**
	 * Deduplicate: return existing promise or track new one
	 */
	dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
		const existing = this.get<T>(key);
		if (existing) {
			console.log(`[Deduplicator] Reusing in-flight request: ${key.substring(0, 50)}...`);
			return existing;
		}
		return this.track(key, requestFn());
	}

	/**
	 * Check if a request is currently in-flight
	 */
	isInFlight(key: string): boolean {
		return this.inFlight.has(key);
	}

	/**
	 * Get count of in-flight requests
	 */
	getCount(): number {
		return this.inFlight.size;
	}

	/**
	 * Get all in-flight keys (for debugging)
	 */
	getInFlightKeys(): string[] {
		return Array.from(this.inFlight.keys());
	}

	/**
	 * Clear all tracked requests (use with caution)
	 */
	clear(): void {
		this.inFlight.clear();
	}
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();
