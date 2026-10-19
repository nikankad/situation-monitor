import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export function isAuthConfigured() {
	return Boolean(
		env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET && (env.AUTH_SECRET?.length ?? 0) >= 32
	);
}

export const { handle: authentication } = SvelteKitAuth(async () => ({
	providers: [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })],
	secret: env.AUTH_SECRET,
	trustHost: dev || env.AUTH_TRUST_HOST === 'true',
	pages: { signIn: '/login', error: '/login' },
	session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
	callbacks: {
		signIn({ account, profile }) {
			return account?.provider === 'google' && profile?.email_verified === true;
		},
		jwt({ token, account }) {
			// Google subject IDs are stable across sign-ins; emails can change.
			if (account) token.sub = `google:${account.providerAccountId}`;
			return token;
		},
		session({ session, token }) {
			if (session.user && token.sub) session.user.id = token.sub;
			return session;
		}
	}
}));
