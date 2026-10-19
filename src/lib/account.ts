export const PROVIDERS = ['finnhub', 'fred'] as const;
export type Provider = (typeof PROVIDERS)[number];
export interface KeyStatus {
	provider: Provider;
	hint: string;
	updatedAt: number;
}
export type Preferences = Record<string, unknown>;
