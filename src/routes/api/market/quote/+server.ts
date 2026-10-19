import { error, json } from '@sveltejs/kit';
import { accounts } from '$lib/server/accounts';
import { fetchProvider } from '$lib/server/provider-fetch';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const symbol = url.searchParams.get('symbol');
	if (!symbol || !/^[A-Za-z0-9.^:_/-]{1,40}$/.test(symbol) || symbol.includes('://'))
		error(400, 'Invalid symbol');
	const key = accounts().getKey(locals.session!.user!.id!, 'finnhub');
	if (!key) error(409, 'Add your Finnhub API key in Settings');
	const upstream = new URL('https://finnhub.io/api/v1/quote');
	upstream.searchParams.set('symbol', symbol);
	const data = await fetchProvider(upstream, { 'X-Finnhub-Token': key });
	// Only return quote fields, never arbitrary provider response properties.
	return json(
		Object.fromEntries(
			['c', 'd', 'dp', 'h', 'l', 'o', 'pc', 't'].map((field) => [
				field,
				typeof data[field] === 'number' ? data[field] : 0
			])
		)
	);
};
