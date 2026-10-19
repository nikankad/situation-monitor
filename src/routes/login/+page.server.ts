import { redirect } from '@sveltejs/kit';
import { isAuthConfigured } from '../../auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.session?.user?.id) redirect(303, '/');
	return { configured: isAuthConfigured(), error: url.searchParams.has('error') };
};
