/**
 * API barrel exports
 */

export { fetchCategoryNews, fetchAllNews } from './news';
export { fetchCountryNews } from './countries';
export {
	fetchCryptoPrices,
	fetchIndices,
	fetchSectorPerformance,
	fetchCommodities,
	fetchCustomMarkets,
	fetchAllMarkets
} from './markets';
export { fetchPolymarket, fetchWhaleTransactions, fetchGovContracts } from './misc';
export type { Prediction, WhaleTransaction, Contract } from './misc';
export { fetchWorldLeaders } from './leaders';

// GDELT Conflict Events API
export {
	fetchConflictEventsFromGDELT,
	fetchRegionalConflicts,
	fetchHighIntensityConflicts,
	aggregateConflictsByCountry
} from './gdelt-conflicts';
export type { GdeltConflictEvent, GdeltQuadClass } from './gdelt-conflicts';
