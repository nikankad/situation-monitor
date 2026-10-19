import { accounts } from '$lib/server/accounts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	user: locals.session!.user!,
	preferences: accounts().getPreferences(locals.session!.user!.id!),
	connections: accounts().listKeys(locals.session!.user!.id!)
});
