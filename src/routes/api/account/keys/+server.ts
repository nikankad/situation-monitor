import { json } from '@sveltejs/kit';
import { accounts } from '$lib/server/accounts';
import { env } from '$env/dynamic/private';
import { parseEncryptionKey } from '$lib/server/crypto';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) => {
	let encryptionConfigured = false;
	try {
		parseEncryptionKey(env.API_KEY_ENCRYPTION_KEY);
		encryptionConfigured = true;
	} catch {
		/* Report setup state without exposing secrets. */
	}
	return json({ keys: accounts().listKeys(locals.session!.user!.id!), encryptionConfigured });
};
