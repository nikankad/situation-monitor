/**
 * ServiceRegistry - Service configurations for all external APIs
 */

export interface CacheConfig {
	ttl: number;
	staleWhileRevalidate: boolean;
}

export interface CircuitBreakerConfig {
	failureThreshold: number;
	resetTimeout: number;
}

export interface ServiceConfig {
	id: string;
	baseUrl: string | null;
	timeout: number;
	retries: number;
	cache?: CacheConfig;
	circuitBreaker?: CircuitBreakerConfig;
	proxies?: string[];
}

export type ServiceId = 'GDELT' | 'COINGECKO' | 'FRED' | 'USGS' | 'CORS_PROXY';

const SERVICE_CONFIG: Record<ServiceId, ServiceConfig> = {
	GDELT: {
		id: 'gdelt',
		baseUrl: 'https://api.gdeltproject.org',
		timeout: 15000,
		retries: 1,
		cache: {
			ttl: 3 * 60 * 1000, // 3 minutes (real-time news)
			staleWhileRevalidate: true
		},
		circuitBreaker: {
			failureThreshold: 2,
			resetTimeout: 60000 // 1 minute
		}
	},

	COINGECKO: {
		id: 'coingecko',
		baseUrl: 'https://api.coingecko.com',
		timeout: 10000,
		retries: 2,
		cache: {
			ttl: 60 * 1000, // 1 minute (crypto volatility)
			staleWhileRevalidate: false
		},
		circuitBreaker: {
			failureThreshold: 3,
			resetTimeout: 120000 // 2 minutes (API can be flaky)
		}
	},

	FRED: {
		id: 'fred',
		baseUrl: 'https://fred.stlouisfed.org',
		timeout: 10000,
		retries: 2,
		cache: {
			ttl: 60 * 60 * 1000, // 1 hour (weekly data)
			staleWhileRevalidate: true
		},
		circuitBreaker: {
			failureThreshold: 3,
			resetTimeout: 60000
		}
	},

	USGS: {
		id: 'usgs',
		baseUrl: 'https://earthquake.usgs.gov',
		timeout: 10000,
		retries: 2,
		cache: {
			ttl: 5 * 60 * 1000, // 5 minutes
			staleWhileRevalidate: true
		},
		circuitBreaker: {
			failureThreshold: 3,
			resetTimeout: 60000
		}
	},

	CORS_PROXY: {
		id: 'cors_proxy',
		baseUrl: null, // Uses proxy URLs from list
		proxies: [
			'https://situation-monitor-proxy.seanthielen-e.workers.dev/?url=',
			'https://api.allorigins.win/raw?url='
		],
		timeout: 12000,
		retries: 1, // Already has proxy fallback
		cache: {
			ttl: 5 * 60 * 1000,
			staleWhileRevalidate: true
		},
		circuitBreaker: {
			failureThreshold: 5,
			resetTimeout: 120000
		}
	}
};

export class ServiceRegistry {
	/**
	 * Get configuration for a service
	 */
	static get(serviceId: ServiceId | string): ServiceConfig | null {
		return SERVICE_CONFIG[serviceId as ServiceId] || null;
	}

	/**
	 * Get all service IDs
	 */
	static getServiceIds(): ServiceId[] {
		return Object.keys(SERVICE_CONFIG) as ServiceId[];
	}

	/**
	 * Get all service configurations
	 */
	static getAll(): Record<ServiceId, ServiceConfig> {
		return { ...SERVICE_CONFIG };
	}

	/**
	 * Check if a service is registered
	 */
	static has(serviceId: string): serviceId is ServiceId {
		return Object.hasOwn(SERVICE_CONFIG, serviceId);
	}

	/**
	 * Get CORS proxies list
	 */
	static getCorsProxies(): string[] {
		return SERVICE_CONFIG.CORS_PROXY.proxies || [];
	}
}

export { SERVICE_CONFIG };
