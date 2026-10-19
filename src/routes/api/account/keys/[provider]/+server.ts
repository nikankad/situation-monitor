import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { accounts } from '$lib/server/accounts';
import { parseEncryptionKey } from '$lib/server/crypto';
import { keySchema, providerSchema, readJson } from '$lib/server/validation';
import type { RequestHandler } from './$types';

function provider(value: string) {
	const result = providerSchema.safeParse(value);
	if (!result.success) error(404, 'Unknown provider');
	return result.data;
}

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const id = provider(params.provider);
	const { key } = await readJson(request, keySchema);
	try {
		parseEncryptionKey(env.API_KEY_ENCRYPTION_KEY);
	} catch {
		error(503, 'API key encryption has not been configured');
	}
	accounts().saveKey(locals.session!.user!.id!, id, key);
	return json({ keys: accounts().listKeys(locals.session!.user!.id!) });
};

export const DELETE: RequestHandler = ({ params, locals }) => {
	accounts().deleteKey(locals.session!.user!.id!, provider(params.provider));
	return json({ keys: accounts().listKeys(locals.session!.user!.id!) });
};
