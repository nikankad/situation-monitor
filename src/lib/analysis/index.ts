/**
 * Analysis module barrel file
 */

// Correlation engine
export {
	analyzeCorrelations,
	getCorrelationSummary,
	clearCorrelationHistory,
	type EmergingPattern,
	type MomentumSignal,
	type CrossSourceCorrelation,
	type PredictiveSignal,
	type CorrelationResults
} from './correlation';

// Narrative tracker
export {
	analyzeNarratives,
	getNarrativeSummary,
	clearNarrativeHistory,
	type NarrativeData,
	type EmergingFringe,
	type FringeToMainstream,
	type NarrativeResults
} from './narrative';

// Main character
export {
	calculateMainCharacter,
	getMainCharacterSummary,
	calculateDominance,
	type MainCharacterEntry,
	type MainCharacterResults
} from './main-character';
