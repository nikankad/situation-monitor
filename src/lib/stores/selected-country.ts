/**
 * Selected country store - tracks which country is selected on the map
 */

import { writable } from 'svelte/store';

export interface SelectedCountry {
	name: string | null;
	code?: string;
	latitude?: number;
	longitude?: number;
}

function createSelectedCountryStore() {
	const { subscribe, set } = writable<SelectedCountry>({
		name: null
	});

	return {
		subscribe,

		/**
		 * Select a country by name
		 */
		select(name: string, code?: string, latitude?: number, longitude?: number) {
			set({
				name,
				code,
				latitude,
				longitude
			});
		},

		/**
		 * Clear the selected country
		 */
		clear() {
			set({
				name: null
			});
		}
	};
}

export const selectedCountry = createSelectedCountryStore();
