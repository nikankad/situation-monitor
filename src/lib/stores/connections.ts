import { writable } from 'svelte/store';
import type { KeyStatus } from '$lib/account';
export const connections = writable<KeyStatus[]>([]);
