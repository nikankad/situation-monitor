/**
 * Shared GDELT request gate
 *
 * GDELT asks clients to send at most one request every 5 seconds and answers
 * with HTTP 429 otherwise. Every GDELT call goes through this queue so that the
 * news panels and the map's conflict layer don't trip the limit.
 */

import { fetchWithProxy } from '$lib/config/api';

const MIN_INTERVAL_MS = 5500;
// The proxy shares its outbound IP with other clients, so GDELT can answer 429 even
// when this app is within its limit; back off and retry a couple of times.
const RETRY_DELAYS_MS = [8000, 15000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Job {
	url: string;
	resolve: (response: Response) => void;
	reject: (error: unknown) => void;
}

const highPriority: Job[] = [];
const lowPriority: Job[] = [];
let pumping = false;
let lastRequestStart = 0;

async function send(url: string): Promise<Response> {
	for (let attempt = 0; ; attempt++) {
		const wait = lastRequestStart + MIN_INTERVAL_MS - Date.now();
		if (wait > 0) await sleep(wait);
		lastRequestStart = Date.now();

		const response = await fetchWithProxy(url);
		if (response.status !== 429 || attempt >= RETRY_DELAYS_MS.length) return response;
		await sleep(RETRY_DELAYS_MS[attempt]);
	}
}

async function pump(): Promise<void> {
	if (pumping) return;
	pumping = true;
	let job: Job | undefined;
	while ((job = highPriority.shift() ?? lowPriority.shift())) {
		try {
			job.resolve(await send(job.url));
		} catch (error) {
			job.reject(error);
		}
	}
	pumping = false;
}

/**
 * Queue a GDELT request. 'high' jobs run before any waiting 'low' jobs.
 */
export function fetchGdelt(url: string, priority: 'high' | 'low' = 'low'): Promise<Response> {
	return new Promise((resolve, reject) => {
		(priority === 'high' ? highPriority : lowPriority).push({ url, resolve, reject });
		void pump();
	});
}

export interface GdeltArticle {
	title: string;
	url: string;
	seendate: string;
	domain: string;
	socialimage?: string;
}

/**
 * Query the GDELT DOC 2.0 article list. Returns [] on any failure.
 */
export async function fetchGdeltArticles(options: {
	query: string;
	timespan: string;
	maxRecords: number;
	priority?: 'high' | 'low';
}): Promise<GdeltArticle[]> {
	const params = new URLSearchParams({
		query: `${options.query} sourcelang:english`,
		timespan: options.timespan,
		mode: 'artlist',
		maxrecords: String(options.maxRecords),
		format: 'json',
		sort: 'date'
	});

	const response = await fetchGdelt(
		`https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
		options.priority
	);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	// GDELT answers with plain text (not JSON) for rate limits and bad queries
	const text = await response.text();
	try {
		const data = JSON.parse(text) as { articles?: GdeltArticle[] };
		return data.articles ?? [];
	} catch {
		throw new Error(`Non-JSON response: ${text.slice(0, 100)}`);
	}
}
