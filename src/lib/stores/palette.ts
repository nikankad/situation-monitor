/**
 * Command palette state - whether the entity search is open
 */

import { writable } from 'svelte/store';

export const paletteOpen = writable(false);
