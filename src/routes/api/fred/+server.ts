import { error, json } from '@sveltejs/kit';
import { accounts } from '$lib/server/accounts';
import { fetchProvider } from '$lib/server/provider-fetch';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const series = url.searchParams.get('series_id');
	if (!series || !/^[A-Za-z0-9_]{1,80}$/.test(series)) error(400, 'Invalid FRED series');
	const key = accounts().getKey(locals.session!.user!.id!, 'fred');
	if (!key) error(409, 'Add your FRED API key in Settings');
	const upstream = new URL('https://api.stlouisfed.org/fred/series/observations');
	upstream.search = new URLSearchParams({
		series_id: series,
		api_key: key,
		file_type: 'json',
		sort_order: 'desc',
		limit: '100'
	}).toString();
	const data = await fetchProvider(upstream);
	return json({
		observations: (Array.isArray(data.observations) ? data.observations : []).map(
			(item: { date: string; value: string }) => ({ date: item.date, value: item.value })
		)
	});
};
