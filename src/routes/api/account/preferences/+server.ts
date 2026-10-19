import { json } from '@sveltejs/kit';
import { accounts } from '$lib/server/accounts';
import { preferencesSchema, readJson } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const patch = await readJson(request, preferencesSchema);
	accounts().patchPreferences(locals.session!.user!.id!, patch);
	return json({ saved: true });
};
