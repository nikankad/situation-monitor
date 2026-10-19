import type { Session } from '@auth/sveltekit';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
		}
	}
}

export {};
