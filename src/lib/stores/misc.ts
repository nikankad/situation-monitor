/**
 * Shared state for data that has no store of its own - prediction markets, contracts
 * and whether the first load has finished
 */

import { writable } from 'svelte/store';
import type { Prediction, Contract } from '$lib/api';

export const predictions = writable<Prediction[]>([]);
export const contracts = writable<Contract[]>([]);
export const miscLoading = writable(true);

/** True once the critical stage (news and markets) has loaded, so pages can render */
export const appReady = writable(false);
