/**
 * Custom error classes for service layer
 */

export class ServiceError extends Error {
	readonly serviceId: string | null;

	constructor(message: string, serviceId: string | null = null) {
		super(message);
		this.name = 'ServiceError';
		this.serviceId = serviceId;
	}
}

export class NetworkError extends Error {
	readonly status: number | null;

	constructor(message: string, status: number | null = null) {
		super(message);
		this.name = 'NetworkError';
		this.status = status;
	}
}

export class TimeoutError extends Error {
	readonly url: string;
	readonly timeout: number | null;

	constructor(url: string, timeout: number | null = null) {
		super(`Request timed out: ${url}`);
		this.name = 'TimeoutError';
		this.url = url;
		this.timeout = timeout;
	}
}

export class CircuitOpenError extends Error {
	readonly serviceId: string;

	constructor(serviceId: string) {
		super(`Circuit breaker open for service: ${serviceId}`);
		this.name = 'CircuitOpenError';
		this.serviceId = serviceId;
	}
}
