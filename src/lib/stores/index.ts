/**
 * Stores barrel file - re-exports all stores
 */

// Theme store
export { theme, type Theme } from './theme';

// Settings store
export {
	settings,
	enabledPanels,
	disabledPanels,
	draggablePanels,
	type PanelSettings,
	type SettingsState
} from './settings';

// Monitors store
export {
	monitors,
	enabledMonitors,
	monitorCount,
	matchCount,
	hasMatches,
	type MonitorMatch,
	type MonitorsState
} from './monitors';

// News store
export {
	news,
	politicsNews,
	techNews,
	financeNews,
	govNews,
	aiNews,
	intelNews,
	allNewsItems,
	alerts,
	isLoading as isNewsLoading,
	hasErrors as hasNewsErrors,
	type CategoryState,
	type NewsState
} from './news';

// Markets store
export {
	markets,
	indices,
	sectors,
	commodities,
	crypto,
	custom,
	isMarketsLoading,
	marketsLastUpdated,
	vix,
	type MarketsState
} from './markets';

// Market settings store
export {
	marketSettings,
	customMarkets,
	type MarketDisplaySettings,
	type CustomMarket
} from './market-settings';

// Refresh store
export {
	refresh,
	isRefreshing,
	currentStage,
	lastRefresh,
	autoRefreshEnabled,
	timeSinceRefresh,
	categoriesWithErrors,
	REFRESH_STAGES,
	type RefreshStage,
	type StageConfig,
	type RefreshState
} from './refresh';

// Fed store
export {
	fedIndicators,
	fedNews,
	isFedLoading,
	fedVideos,
	type FedIndicatorsState,
	type FedNewsState
} from './fed';

// Selected country store
export {
	selectedCountry,
	type SelectedCountry
} from './selected-country';
