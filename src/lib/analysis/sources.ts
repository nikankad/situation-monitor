/**
 * Source classification - sorts a news source into fringe, alternative or mainstream
 */

import { SOURCE_TYPES } from '$lib/config/analysis';

export type SourceKind = 'fringe' | 'alternative' | 'mainstream';

export function classifySource(source: string): SourceKind | null {
	const lowerSource = source.toLowerCase();

	for (const fringeSource of SOURCE_TYPES.fringe) {
		if (lowerSource.includes(fringeSource)) return 'fringe';
	}
	for (const altSource of SOURCE_TYPES.alternative) {
		if (lowerSource.includes(altSource)) return 'alternative';
	}
	for (const msSource of SOURCE_TYPES.mainstream) {
		if (lowerSource.includes(msSource)) return 'mainstream';
	}
	return null;
}
