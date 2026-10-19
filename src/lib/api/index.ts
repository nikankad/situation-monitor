/**
 * API barrel exports
 */

export { fetchCategoryNews, fetchAllNews } from './news';
export {
	fetchCryptoPrices,
	fetchIndices,
	fetchSectorPerformance,
	fetchCommodities,
	fetchCustomMarkets,
	fetchAllMarkets
} from './markets';
export { fetchPolymarket, fetchGovContracts } from './misc';
export type { Prediction, Contract } from './misc';
export { fetchWorldLeaders } from './leaders';

// GDELT conflict hotspots (derived from the DOC API)
export { fetchConflictEventsFromGDELT } from './gdelt-conflicts';
export type { GdeltConflictEvent } from './gdelt-conflicts';
