/**
 * CircuitBreaker - Circuit breaker pattern for failing services
 */

export const CircuitBreakerStates = {
	CLOSED: 'CLOSED', // Normal operation - requests flow through
	OPEN: 'OPEN', // Blocking requests - service is failing
	HALF_OPEN: 'HALF_OPEN' // Testing recovery - allowing limited requests
} as const;

export type CircuitBreakerState = (typeof CircuitBreakerStates)[keyof typeof CircuitBreakerStates];

export interface CircuitBreakerOptions {
	failureThreshold?: number;
	resetTimeout?: number;
	halfOpenMaxRequests?: number;
}

export interface CircuitBreakerStatus {
	state: CircuitBreakerState;
	failures: number;
	successes: number;
	lastFailure: number | null;
	canRequest: boolean;
	timeSinceLastFailure: number | null;
	timeUntilRetry: number;
}

export class CircuitBreaker {
	readonly serviceId: string;
	private readonly failureThreshold: number;
	private readonly resetTimeout: number;
	private readonly halfOpenMaxRequests: number;

	private _state: CircuitBreakerState = CircuitBreakerStates.CLOSED;
	private failures = 0;
	private successes = 0;
	private lastFailureTime: number | null = null;
	private halfOpenRequests = 0;

	constructor(serviceId: string, options: CircuitBreakerOptions = {}) {
		this.serviceId = serviceId;
		this.failureThreshold = options.failureThreshold || 3;
		this.resetTimeout = options.resetTimeout || 30000;
		this.halfOpenMaxRequests = options.halfOpenMaxRequests || 1;
	}

	get state(): CircuitBreakerState {
		return this._state;
	}

	/**
	 * Check if a request can proceed
	 */
	canRequest(): boolean {
		switch (this._state) {
			case CircuitBreakerStates.CLOSED:
				return true;

			case CircuitBreakerStates.OPEN:
				// Check if reset timeout has passed
				if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
					this._state = CircuitBreakerStates.HALF_OPEN;
					this.halfOpenRequests = 0;
					console.log(`[CircuitBreaker] ${this.serviceId}: OPEN -> HALF_OPEN (testing recovery)`);
					return true;
				}
				return false;

			case CircuitBreakerStates.HALF_OPEN:
				return this.halfOpenRequests < this.halfOpenMaxRequests;

			default:
				return false;
		}
	}

	/**
	 * Record a successful request
	 */
	recordSuccess(): void {
		this.successes++;

		if (this._state === CircuitBreakerStates.HALF_OPEN) {
			// Recovery confirmed - close the circuit
			this._state = CircuitBreakerStates.CLOSED;
			console.log(`[CircuitBreaker] ${this.serviceId}: HALF_OPEN -> CLOSED (recovered)`);
		}

		this.failures = 0;
		this.halfOpenRequests = 0;
	}

	/**
	 * Record a failed request
	 */
	recordFailure(): void {
		this.failures++;
		this.lastFailureTime = Date.now();

		if (this._state === CircuitBreakerStates.HALF_OPEN) {
			// Recovery failed - reopen the circuit
			this._state = CircuitBreakerStates.OPEN;
			console.warn(`[CircuitBreaker] ${this.serviceId}: HALF_OPEN -> OPEN (recovery failed)`);
		} else if (this.failures >= this.failureThreshold) {
			// Threshold reached - open the circuit
			this._state = CircuitBreakerStates.OPEN;
			console.warn(
				`[CircuitBreaker] ${this.serviceId}: CLOSED -> OPEN (${this.failures} failures)`
			);
		}
	}

	/**
	 * Track a half-open request
	 */
	trackHalfOpenRequest(): void {
		if (this._state === CircuitBreakerStates.HALF_OPEN) {
			this.halfOpenRequests++;
		}
	}

	/**
	 * Get current state information
	 */
	getState(): CircuitBreakerStatus {
		return {
			state: this._state,
			failures: this.failures,
			successes: this.successes,
			lastFailure: this.lastFailureTime,
			canRequest: this.canRequest(),
			timeSinceLastFailure: this.lastFailureTime ? Date.now() - this.lastFailureTime : null,
			timeUntilRetry:
				this._state === CircuitBreakerStates.OPEN && this.lastFailureTime
					? Math.max(0, this.resetTimeout - (Date.now() - this.lastFailureTime))
					: 0
		};
	}

	/**
	 * Force reset the circuit breaker
	 */
	reset(): void {
		this._state = CircuitBreakerStates.CLOSED;
		this.failures = 0;
		this.successes = 0;
		this.lastFailureTime = null;
		this.halfOpenRequests = 0;
		console.log(`[CircuitBreaker] ${this.serviceId}: Reset to CLOSED`);
	}
}

/**
 * Registry to manage circuit breakers for multiple services
 */
export class CircuitBreakerRegistry {
	private breakers: Map<string, CircuitBreaker> = new Map();

	/**
	 * Get or create a circuit breaker for a service
	 */
	get(serviceId: string, options: CircuitBreakerOptions = {}): CircuitBreaker {
		if (!this.breakers.has(serviceId)) {
			this.breakers.set(serviceId, new CircuitBreaker(serviceId, options));
		}
		return this.breakers.get(serviceId)!;
	}

	/**
	 * Get status of all circuit breakers
	 */
	getStatus(): Record<string, CircuitBreakerStatus> {
		const status: Record<string, CircuitBreakerStatus> = {};
		for (const [id, breaker] of this.breakers) {
			status[id] = breaker.getState();
		}
		return status;
	}

	/**
	 * Reset all circuit breakers
	 */
	resetAll(): void {
		for (const breaker of this.breakers.values()) {
			breaker.reset();
		}
	}

	/**
	 * Get count of open circuits
	 */
	getOpenCount(): number {
		let count = 0;
		for (const breaker of this.breakers.values()) {
			if (breaker.state === CircuitBreakerStates.OPEN) count++;
		}
		return count;
	}
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
