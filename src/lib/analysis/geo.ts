/**
 * Geo helpers - finds the strategic sites near a point
 */

import {
	HOTSPOTS,
	CHOKEPOINTS,
	NUCLEAR_SITES,
	MILITARY_BASES,
	CABLE_LANDINGS,
	type Hotspot
} from '$lib/config/map';

export type SiteKind = 'hotspot' | 'chokepoint' | 'nuclear' | 'base' | 'cable';

export const SITE_KIND_LABELS: Record<SiteKind, string> = {
	hotspot: 'Hotspot',
	chokepoint: 'Chokepoint',
	nuclear: 'Nuclear site',
	base: 'Military base',
	cable: 'Cable landing'
};

export interface NearbySite {
	kind: SiteKind;
	name: string;
	desc?: string;
	lat: number;
	lon: number;
	distanceKm: number;
	/** Only hotspots carry a threat level */
	level?: Hotspot['level'];
}

const EARTH_RADIUS_KM = 6371;
const THREAT_RANK: Record<Hotspot['level'], number> = { low: 0, elevated: 1, high: 2, critical: 3 };

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Strategic sites within a radius of a point, nearest first. Distances come from the
 * point given, so a rough region centre means rough distances.
 */
export function nearbySites(lat: number, lon: number, radiusKm: number): NearbySite[] {
	const sources: Array<
		[SiteKind, Array<{ name: string; lat: number; lon: number; desc?: string }>]
	> = [
		['hotspot', HOTSPOTS],
		['chokepoint', CHOKEPOINTS],
		['nuclear', NUCLEAR_SITES],
		['base', MILITARY_BASES],
		['cable', CABLE_LANDINGS]
	];

	const sites: NearbySite[] = [];
	for (const [kind, list] of sources) {
		for (const site of list) {
			const distanceKm = haversineKm(lat, lon, site.lat, site.lon);
			if (distanceKm > radiusKm) continue;
			sites.push({
				kind,
				name: site.name,
				desc: site.desc,
				lat: site.lat,
				lon: site.lon,
				distanceKm,
				level: kind === 'hotspot' ? (site as Hotspot).level : undefined
			});
		}
	}

	return sites.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * The most severe threat level among nearby hotspots, if any
 */
export function highestThreat(sites: NearbySite[]): Hotspot['level'] | null {
	let best: Hotspot['level'] | null = null;
	for (const site of sites) {
		if (site.level && (best === null || THREAT_RANK[site.level] > THREAT_RANK[best])) {
			best = site.level;
		}
	}
	return best;
}
