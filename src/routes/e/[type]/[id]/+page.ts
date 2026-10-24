import { ENTITIES } from '$lib/config/entities';

export const prerender = true;

/** Every entity gets its own static page, so deep links work on a static host */
export function entries() {
	return ENTITIES.map(({ type, id }) => ({ type, id }));
}
