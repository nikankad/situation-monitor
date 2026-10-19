import { json, redirect, type Handle } from '@sveltejs/kit';
import { authentication, isAuthConfigured } from './auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Also protect JSON mutations: SvelteKit's default form CSRF check does not cover them.
	if (!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
		if (event.request.headers.get('origin') !== event.url.origin) {
			return json({ error: 'Cross-origin request rejected' }, { status: 403 });
		}
	}

	const authorize: typeof resolve = async (authenticatedEvent) => {
		authenticatedEvent.locals.session = await authenticatedEvent.locals.auth();
		if (authenticatedEvent.route.id !== '/login' && !authenticatedEvent.locals.session?.user?.id) {
			if (authenticatedEvent.url.pathname.startsWith('/api/')) {
				return json({ error: 'Sign in required' }, { status: 401 });
			}
			redirect(303, '/login');
		}
		const response = await resolve(authenticatedEvent);
		response.headers.set('Cache-Control', 'private, no-store');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		return response;
	};

	if (!isAuthConfigured()) {
		event.locals.auth = async () => null;
		if (event.url.pathname.startsWith('/auth/')) {
			return json({ error: 'Google sign-in has not been configured' }, { status: 503 });
		}
		return authorize(event);
	}
	return authentication({ event, resolve: authorize });
};
