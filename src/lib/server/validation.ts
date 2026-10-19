import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { PANELS } from '$lib/config/panels';
import { PROVIDERS } from '$lib/account';

export const providerSchema = z.enum(PROVIDERS);
export const keySchema = z
	.object({
		key: z
			.string()
			.trim()
			.min(8)
			.max(512)
			.regex(/^[\x21-\x7e]+$/)
	})
	.strict();
const text = z.string().max(200);
const symbols = z.array(text).max(100);
const panel = z.string().refine((id) => Object.hasOwn(PANELS, id));
const marketCategory = z.object({ enabled: symbols, order: symbols }).strict();
const monitor = z
	.object({
		id: text,
		name: text,
		keywords: z.array(text).max(100),
		enabled: z.boolean(),
		color: z
			.string()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		location: z
			.object({ name: text, lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) })
			.optional(),
		createdAt: z.number(),
		updatedAt: z.number().optional(),
		matchCount: z.number().int().nonnegative()
	})
	.strict();

export const preferencesSchema = z
	.object({
		situationMonitorPanels: z.record(panel, z.boolean()).nullable().optional(),
		panelOrder: z
			.array(panel)
			.max(Object.keys(PANELS).length)
			.refine((ids) => new Set(ids).size === ids.length)
			.nullable()
			.optional(),
		panelSizes: z
			.record(
				panel,
				z
					.object({
						width: z.number().min(0).max(10000).optional(),
						height: z.number().min(0).max(10000).optional()
					})
					.strict()
			)
			.nullable()
			.optional(),
		situationMonitorFeatures: z
			.object({ newsSummarization: z.boolean() })
			.strict()
			.nullable()
			.optional(),
		marketSettings: z
			.object({
				indices: marketCategory,
				sectors: marketCategory,
				commodities: marketCategory,
				crypto: marketCategory,
				custom: marketCategory
			})
			.strict()
			.nullable()
			.optional(),
		customMarkets: z
			.array(z.object({ symbol: text, name: text }).strict())
			.max(100)
			.nullable()
			.optional(),
		situationMonitorCustomKeywords: z
			.object({ custom: z.array(text).max(500), enabled: z.boolean() })
			.strict()
			.nullable()
			.optional(),
		customMonitors: z.array(monitor).max(20).nullable().optional(),
		refreshSettings: z
			.object({
				autoRefreshEnabled: z.boolean(),
				autoRefreshInterval: z.number().int().min(60000).max(86400000),
				lastRefresh: z.number().nullable()
			})
			.strict()
			.nullable()
			.optional()
	})
	.strict();

export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		error(415, 'Expected JSON');
	// Bound streamed bodies as well as requests with a Content-Length header.
	const reader = request.body?.getReader();
	if (!reader) error(400, 'Missing request body');
	let bytes = 0;
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		bytes += value.byteLength;
		if (bytes > 65536) {
			await reader.cancel();
			error(413, 'Request too large');
		}
		chunks.push(value);
	}
	let input: unknown;
	try {
		input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		error(400, 'Invalid JSON');
	}
	const result = schema.safeParse(input);
	if (!result.success) error(400, 'Invalid request data');
	return result.data;
}
