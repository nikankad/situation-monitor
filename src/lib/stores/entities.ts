/**
 * Entity index store - what the current headlines say about each entity
 */

import { derived } from 'svelte/store';
import { allNewsItems } from './news';
import { buildEntityIndex } from '$lib/analysis/entity-index';

export const entityIndex = derived(allNewsItems, ($items) => buildEntityIndex($items));
