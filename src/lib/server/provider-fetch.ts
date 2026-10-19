import { error } from '@sveltejs/kit';

export async function fetchProvider(url: URL, headers?: HeadersInit) {
	let response: Response;
	try {
		response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
	} catch {
		error(502, 'Data provider unavailable');
	}
	// Never return provider error bodies: they may echo request credentials.
	if (!response.ok) {
		if (response.status === 429) error(429, 'Provider rate limit reached. Try again shortly.');
		if ([401, 403].includes(response.status))
			error(422, 'Provider rejected your API key. Check Settings.');
		error(502, 'Data provider request failed');
	}
	try {
		return await response.json();
	} catch {
		error(502, 'Invalid data provider response');
	}
}
