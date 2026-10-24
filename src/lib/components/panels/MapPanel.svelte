<script module lang="ts">
	import { fetchConflictEventsFromGDELT, type GdeltConflictEvent } from '$lib/api/gdelt-conflicts';

	// Shared by every map on the page and between pages, so opening an entity page does not
	// call the rate-limited GDELT API again
	const CONFLICT_CACHE_MS = 5 * 60 * 1000;
	let conflictCache: { data: GdeltConflictEvent[]; fetchedAt: number } | null = null;
	let conflictRequest: Promise<GdeltConflictEvent[]> | null = null;

	function fetchConflictsShared(): Promise<GdeltConflictEvent[]> {
		if (conflictCache && Date.now() - conflictCache.fetchedAt < CONFLICT_CACHE_MS) {
			return Promise.resolve(conflictCache.data);
		}
		conflictRequest ??= fetchConflictEventsFromGDELT({ timespan: '48h', maxRecords: 250 })
			.then((data) => {
				conflictCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				conflictRequest = null;
			});
		return conflictRequest;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Panel, Icon } from '$lib/components/common';
	import { getIconNodes, type IconName } from '$lib/config/icons';
	import { haversineKm } from '$lib/analysis/geo';
	import {
		HOTSPOTS,
		CHOKEPOINTS,
		CABLE_LANDINGS,
		NUCLEAR_SITES,
		MILITARY_BASES,
		OCEANS,
		SANCTIONED_COUNTRY_IDS,
		THREAT_COLORS,
		WEATHER_CODES,
		getNewsCoordinates,
		type Hotspot,
		type WeatherCondition
	} from '$lib/config/map';
	import { CACHE_TTLS } from '$lib/config/api';
	import type { CustomMonitor, NewsItem } from '$lib/types';
	import type { EntityLocation } from '$lib/config/entities';
	import { getCountryName } from '$lib/config/countries';
	import { timeAgo } from '$lib/utils';

	type MapFocus = Pick<EntityLocation, 'lat' | 'lon' | 'zoom'>;

	interface Props {
		monitors?: CustomMonitor[];
		news?: NewsItem[];
		error?: string | null;
		/** Centre and zoom the map on a point, for example a region's page */
		focus?: MapFocus | null;
		title?: string;
	}

	let {
		monitors = [],
		news = [],
		error = null,
		focus = null,
		title = 'World Map'
	}: Props = $props();

	// Distance-based clustering helper functions
	function getDistanceThreshold(zoomScale: number): number {
		// Exponential decay - more zoom = smaller threshold
		// Zoom 1.0 → 800km: continent-level clustering
		// Zoom 1.5 → 400km: country-level clustering
		// Zoom 2.0 → 200km: regional clustering
		// Zoom 2.5 → 100km: city-level clustering
		// Zoom 3.0+ → 50km: neighborhood-level clustering
		const baseDistance = 800; // km at zoom 1.0
		const decayFactor = 0.6; // Controls how quickly threshold decreases
		return baseDistance * Math.pow(decayFactor, zoomScale - 1);
	}

	function snapZoomScale(scale: number): number {
		// Round to nearest 0.1 to reduce recalculations
		return Math.round(scale * 10) / 10;
	}

	function mergeClusters(c1: NewsCluster, c2: NewsCluster): NewsCluster {
		// Calculate weighted center point
		const totalCount = c1.count + c2.count;
		const lat = (c1.lat * c1.count + c2.lat * c2.count) / totalCount;
		const lon = (c1.lon * c1.count + c2.lon * c2.count) / totalCount;

		// Combine region names (show both if different)
		const region = c1.region === c2.region ? c1.region : `${c1.region}/${c2.region}`;

		return {
			region,
			lat,
			lon,
			count: c1.count + c2.count,
			alertCount: c1.alertCount + c2.alertCount,
			items: [...c1.items, ...c2.items]
		};
	}

	function clusterNewsByDistance(items: GeoNews[], zoomScale: number): NewsCluster[] {
		if (items.length === 0) return [];

		const threshold = getDistanceThreshold(zoomScale);

		// Initialize: each item is its own cluster
		let clusters: NewsCluster[] = items.map((item) => ({
			region: item.region,
			lat: item.lat,
			lon: item.lon,
			count: 1,
			alertCount: item.isAlert ? 1 : 0,
			items: [item]
		}));

		// Merge clusters within threshold distance
		let merged = true;
		while (merged) {
			merged = false;

			for (let i = 0; i < clusters.length; i++) {
				for (let j = i + 1; j < clusters.length; j++) {
					const dist = haversineKm(
						clusters[i].lat,
						clusters[i].lon,
						clusters[j].lat,
						clusters[j].lon
					);

					if (dist <= threshold) {
						// Merge cluster j into cluster i
						const mergedCluster = mergeClusters(clusters[i], clusters[j]);
						clusters[i] = mergedCluster;
						clusters.splice(j, 1);
						merged = true;
						break;
					}
				}
				if (merged) break;
			}
		}

		return clusters;
	}

	// Geo-located news with coordinates
	interface GeoNews extends NewsItem {
		lat: number;
		lon: number;
		region: string;
	}

	// Cluster of news at a region
	interface NewsCluster {
		region: string;
		lat: number;
		lon: number;
		count: number;
		alertCount: number;
		items: GeoNews[];
	}

	// Compute geo-located news from news items
	const geoNews = $derived<GeoNews[]>(
		news
			.map((item) => {
				const coords = getNewsCoordinates(item.title);
				if (coords) {
					return { ...item, lat: coords.lat, lon: coords.lon, region: coords.region };
				}
				return null;
			})
			.filter((item): item is GeoNews => item !== null)
	);

	let currentZoomScale = $state(1);

	// Use distance-based clustering that adapts to zoom level
	const snappedZoomScale = $derived(snapZoomScale(currentZoomScale));

	const newsClusters = $derived.by<NewsCluster[]>(() => {
		// Use distance-based clustering instead of region-based
		const clusters = clusterNewsByDistance(geoNews, snappedZoomScale);

		// Sort and limit items in each cluster (keep existing logic)
		return clusters
			.map((cluster) => {
				// Sort: alerts first, then by recency
				const sorted = cluster.items.sort((a, b) => {
					// Prioritize alerts
					if (a.isAlert && !b.isAlert) return -1;
					if (!a.isAlert && b.isAlert) return 1;
					// Within same alert status, sort by recency
					return b.timestamp - a.timestamp;
				});

				// Keep top 8 items (prioritizes alerts + recent news)
				const topItems = sorted.slice(0, 8);

				return {
					...cluster,
					items: topItems
				};
			})
			.sort((a, b) => b.count - a.count);
	});

	// Live events for the ticker (most recent geo-located alerts)
	const liveEvents = $derived<GeoNews[]>(
		geoNews
			.filter((item) => item.isAlert)
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 10)
	);

	let mapContainer: HTMLDivElement;
	// Layer visibility toggles
	type LayerKey = 'events' | 'hotspots' | 'infra' | 'news';
	let layers = $state<Record<LayerKey, boolean>>({
		events: true,
		hotspots: true,
		infra: true,
		news: true
	});

	const LAYER_BUTTONS: Array<{
		key: LayerKey;
		label: string;
		title: string;
		icon: IconName;
		color: string;
	}> = [
		{
			key: 'events',
			label: 'Conflicts',
			title: 'Conflict regions from live GDELT coverage',
			icon: 'swords',
			color: THREAT_COLORS.critical
		},
		{
			key: 'hotspots',
			label: 'Hotspots',
			title: 'Geopolitical hotspots',
			icon: 'crosshair',
			color: THREAT_COLORS.high
		},
		{
			key: 'infra',
			label: 'Strategic',
			title: 'Chokepoints, nuclear sites and military bases',
			icon: 'anchor',
			color: '#2bb8ff'
		},
		{
			key: 'news',
			label: 'News',
			title: 'Geo-located news clusters',
			icon: 'newspaper',
			color: '#7dd3fc'
		}
	];

	function toggleLayer(key: LayerKey): void {
		layers[key] = !layers[key];
		if (key === 'news') drawNewsClusters();
		else drawMapIcons();
	}

	// Live conflict regions derived from GDELT coverage
	let gdeltConflicts = $state<GdeltConflictEvent[]>([]);
	let conflictsLoading = $state(false);
	let conflictsError = $state<string | null>(null);

	// D3 objects - initialized in initMap, null before initialization
	// Using 'any' for D3 objects as they're dynamically imported and have complex generic types
	/* eslint-disable @typescript-eslint/no-explicit-any */
	let d3Module: typeof import('d3') | null = null;
	let svg: any = null;
	let mapGroup: any = null;
	let projection: any = null;
	let path: any = null;
	let zoom: any = null;
	/* eslint-enable @typescript-eslint/no-explicit-any */
	let mapReady = $state(false);

	const WIDTH = 800;
	const HEIGHT = 400;

	// Declutter the map when zoomed out: only the most important markers show at low zoom
	const ZOOM_THRESHOLDS = {
		showAllHotspots: 1.8, // Below this only critical/high hotspots are drawn
		showAllConflicts: 1.8, // Below this only elevated-or-worse conflict regions are drawn
		showSmallClusters: 1.5, // Below this single-item news clusters are hidden
		showLabels: 2.2 // Text labels next to markers
	};

	// Tooltip state
	interface TooltipLine {
		text: string;
		icon?: IconName;
	}
	let tooltipContent = $state<{
		title: string;
		icon?: IconName;
		color: string;
		lines: TooltipLine[];
	} | null>(null);
	let tooltipPosition = $state({ left: 0, top: 0 });
	let tooltipVisible = $state(false);
	const TOOLTIP_MAX_WIDTH = 260;

	// Detailed info modal state
	let selectedGdeltConflict = $state<GdeltConflictEvent | null>(null);
	let selectedHotspot = $state<(typeof HOTSPOTS)[0] | null>(null);
	let selectedNewsCluster = $state<NewsCluster | null>(null);
	let showDetailModal = $state(false);

	// Data cache for tooltips with TTL support
	interface CacheEntry<T> {
		data: T;
		timestamp: number;
	}
	const dataCache: Record<string, CacheEntry<unknown>> = {};

	function getCachedData<T>(key: string): T | null {
		const entry = dataCache[key] as CacheEntry<T> | undefined;
		if (!entry) return null;
		// Check if cache entry has expired
		if (Date.now() - entry.timestamp > CACHE_TTLS.weather) {
			delete dataCache[key];
			return null;
		}
		return entry.data;
	}

	function setCachedData<T>(key: string, data: T): void {
		dataCache[key] = { data, timestamp: Date.now() };
	}

	// Get local time at longitude
	function getLocalTime(lon: number): string {
		const now = new Date();
		const utcHours = now.getUTCHours();
		const utcMinutes = now.getUTCMinutes();
		const offsetHours = Math.round(lon / 15);
		let localHours = (utcHours + offsetHours + 24) % 24;
		return `${localHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
	}

	// Weather result type
	interface WeatherResult {
		temp: number | null;
		wind: number | null;
		condition: WeatherCondition | null;
	}

	// Fetch weather from Open-Meteo with TTL-based caching
	async function getWeather(lat: number, lon: number): Promise<WeatherResult | null> {
		const key = `weather_${lat}_${lon}`;
		const cached = getCachedData<WeatherResult>(key);
		if (cached) return cached;

		try {
			const res = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`
			);
			const data = await res.json();
			const temp = data.current?.temperature_2m;
			const tempF = typeof temp === 'number' ? Math.round((temp * 9) / 5 + 32) : null;
			const wind = data.current?.wind_speed_10m;
			const code = data.current?.weather_code;
			const result: WeatherResult = {
				temp: tempF,
				wind: typeof wind === 'number' ? Math.round(wind) : null,
				condition: WEATHER_CODES[code] ?? null
			};
			setCachedData(key, result);
			return result;
		} catch {
			return null;
		}
	}

	// Enable zoom/pan behavior on the map
	function enableZoom(): void {
		if (!svg || !zoom) return;
		svg.call(zoom);
	}

	// Calculate day/night terminator points
	function calculateTerminator(): [number, number][] {
		const now = new Date();
		const dayOfYear = Math.floor(
			(now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
		);
		const declination = -23.45 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
		const hourAngle = (now.getUTCHours() + now.getUTCMinutes() / 60) * 15 - 180;

		const terminatorPoints: [number, number][] = [];
		for (let lat = -90; lat <= 90; lat += 2) {
			const tanDec = Math.tan((declination * Math.PI) / 180);
			const tanLat = Math.tan((lat * Math.PI) / 180);
			let lon = -hourAngle + (Math.acos(-tanDec * tanLat) * 180) / Math.PI;
			if (isNaN(lon)) lon = lat * declination > 0 ? -hourAngle + 180 : -hourAngle;
			terminatorPoints.push([lon, lat]);
		}
		for (let lat = 90; lat >= -90; lat -= 2) {
			const tanDec = Math.tan((declination * Math.PI) / 180);
			const tanLat = Math.tan((lat * Math.PI) / 180);
			let lon = -hourAngle - (Math.acos(-tanDec * tanLat) * 180) / Math.PI;
			if (isNaN(lon)) lon = lat * declination > 0 ? -hourAngle - 180 : -hourAngle;
			terminatorPoints.push([lon, lat]);
		}
		return terminatorPoints;
	}

	// Place the tooltip next to the cursor, flipping to the left near the right edge
	function positionTooltip(event: MouseEvent): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const flip = x + 15 + TOOLTIP_MAX_WIDTH > rect.width;
		tooltipPosition = {
			left: flip ? Math.max(4, x - 15 - TOOLTIP_MAX_WIDTH) : x + 15,
			top: Math.max(4, Math.min(event.clientY - rect.top - 10, rect.height - 60))
		};
	}

	// Show tooltip using state (safe rendering)
	function showTooltip(
		event: MouseEvent,
		title: string,
		color: string,
		lines: Array<string | TooltipLine> = [],
		icon?: IconName
	): void {
		if (!mapContainer) return;
		tooltipContent = {
			title,
			icon,
			color,
			lines: lines
				.map((line) => (typeof line === 'string' ? { text: line } : line))
				.filter((line) => line.text)
		};
		positionTooltip(event);
		tooltipVisible = true;
	}

	function moveTooltip(event: MouseEvent): void {
		positionTooltip(event);
	}

	// Hide tooltip
	function hideTooltip(): void {
		tooltipVisible = false;
		tooltipContent = null;
	}

	// Show detailed GDELT conflict information modal
	function showGdeltConflictDetails(conflict: GdeltConflictEvent): void {
		selectedGdeltConflict = conflict;
		selectedHotspot = null;
		selectedNewsCluster = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Show detailed hotspot information modal
	function showHotspotDetails(hotspot: (typeof HOTSPOTS)[0]): void {
		selectedHotspot = hotspot;
		selectedNewsCluster = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Show detailed news cluster information modal
	function showNewsClusterDetails(cluster: NewsCluster): void {
		selectedNewsCluster = cluster;
		selectedHotspot = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Close detail modal
	function closeDetailModal(): void {
		showDetailModal = false;
		selectedGdeltConflict = null;
		selectedHotspot = null;
		selectedNewsCluster = null;
	}

	// Hotspot tooltip: description, local time, then current weather once it arrives
	async function showEnhancedTooltip(
		event: MouseEvent,
		name: string,
		lat: number,
		lon: number,
		desc: string | undefined,
		color: string,
		level: Hotspot['level']
	): Promise<void> {
		const lines: TooltipLine[] = [{ text: `${SEVERITY_LABELS[level]} threat level` }];
		if (desc) lines.push({ text: desc });
		lines.push({ text: `Local time ${getLocalTime(lon)}`, icon: 'clock' });
		showTooltip(event, name, color, lines, 'crosshair');

		const weather = await getWeather(lat, lon);
		const current = tooltipContent;
		if (!weather || !tooltipVisible || !current || current.title !== name) return;
		const details = [
			weather.condition?.label,
			weather.temp !== null ? `${weather.temp}°F` : null,
			weather.wind !== null ? `${weather.wind} mph wind` : null
		].filter(Boolean);
		if (details.length === 0) return;
		tooltipContent = {
			...current,
			lines: [...lines, { text: details.join(' · '), icon: weather.condition?.icon ?? 'cloud' }]
		};
	}

	// Initialize map
	async function initMap(): Promise<void> {
		const d3 = await import('d3');
		d3Module = d3;
		const topojson = await import('topojson-client');

		const svgEl = mapContainer.querySelector('svg');
		if (!svgEl) return;

		svg = d3.select(svgEl);
		svg.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

		mapGroup = svg.append('g').attr('id', 'mapGroup');

		// Setup zoom. Plain scrolling is left to the page; use the buttons, a pinch
		// gesture (touch, or Ctrl+scroll / trackpad pinch) and drag to pan.
		zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 6])
			.extent([
				[0, 0],
				[WIDTH, HEIGHT]
			])
			.translateExtent([
				[0, 0],
				[WIDTH, HEIGHT]
			])
			.filter((event) => {
				if (event.type === 'wheel') return event.ctrlKey;
				if (event.type === 'dblclick') return false;
				return !event.button;
			})
			.on('zoom', (event) => {
				mapGroup.attr('transform', event.transform.toString());
				// Track zoom scale and redraw icons to maintain visual size
				const newScale = event.transform.k;
				if (newScale !== currentZoomScale) {
					currentZoomScale = newScale;
					drawMapIcons();
					drawMonitors();
					drawNewsClusters();
				}
			});

		enableZoom();

		// Setup projection
		projection = d3
			.geoEquirectangular()
			.scale(130)
			.center([0, 20])
			.translate([WIDTH / 2, HEIGHT / 2 - 30]);

		path = d3.geoPath().projection(projection);

		// Load world data
		try {
			const response = await fetch(
				'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
			);
			const world = await response.json();
			const countries = topojson.feature(
				world,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				world.objects.countries as any
			) as unknown as GeoJSON.FeatureCollection;

			// Draw countries
			mapGroup
				.selectAll('path.country')
				.data(countries.features)
				.enter()
				.append('path')
				.attr('class', 'country')
				.attr('d', path as unknown as string)
				.attr('fill', (d: GeoJSON.Feature) =>
					SANCTIONED_COUNTRY_IDS.includes(+(d.id || 0)) ? '#2a1a1a' : '#0f3028'
				)
				.attr('stroke', (d: GeoJSON.Feature) =>
					SANCTIONED_COUNTRY_IDS.includes(+(d.id || 0)) ? '#4a2020' : '#1a5040'
				)
				.attr('stroke-width', 0.5)
				.on('mouseenter', (event: MouseEvent, d: GeoJSON.Feature) => {
					const countryName = getCountryName(+(d.id || 0));
					if (countryName) {
						showTooltip(event, countryName, '#00aa88');
					}
				})
				.on('mousemove', moveTooltip)
				.on('mouseleave', hideTooltip);

			// Draw graticule
			const graticule = d3.geoGraticule().step([30, 30]);
			mapGroup
				.append('path')
				.datum(graticule)
				.attr('d', path as unknown as string)
				.attr('fill', 'none')
				.attr('stroke', '#1a3830')
				.attr('stroke-width', 0.3)
				.attr('stroke-dasharray', '2,2');

			// Draw ocean labels
			OCEANS.forEach((o) => {
				const [x, y] = projection([o.lon, o.lat]) || [0, 0];
				if (x && y) {
					mapGroup
						.append('text')
						.attr('x', x)
						.attr('y', y)
						.attr('fill', '#1a4a40')
						.attr('font-size', '10px')
						.attr('font-family', 'monospace')
						.attr('text-anchor', 'middle')
						.attr('opacity', 0.6)
						.text(o.name);
				}
			});

			// Draw day/night terminator
			const terminatorPoints = calculateTerminator();
			mapGroup
				.append('path')
				.datum({ type: 'Polygon', coordinates: [terminatorPoints] } as GeoJSON.Polygon)
				.attr('d', path as unknown as string)
				.attr('fill', 'rgba(0,0,0,0.3)')
				.attr('stroke', 'none')
				.style('pointer-events', 'none');

			// Draw all map icons (will be redrawn on zoom)
			drawMapIcons();

			// Draw custom monitors with locations
			drawMonitors();

			// Draw news clusters
			drawNewsClusters();
		} catch (err) {
			console.error('Failed to load map data:', err);
		} finally {
			mapReady = true;
		}
	}

	const SEVERITY_RANK = { critical: 3, high: 2, elevated: 1, low: 0 } as const;

	const SEVERITY_LABELS = {
		critical: 'Critical',
		high: 'High',
		elevated: 'Elevated',
		low: 'Low'
	} as const;

	const CONFLICT_TYPES: Record<GdeltConflictEvent['type'], { label: string; icon: IconName }> = {
		conflict: { label: 'Active conflict', icon: 'swords' },
		crisis: { label: 'Crisis', icon: 'siren' },
		tension: { label: 'Rising tension', icon: 'triangle-alert' },
		development: { label: 'Developing story', icon: 'map-pin' }
	};

	interface InfraLayer {
		kind: string;
		icon: IconName;
		color: string;
		items: Array<{ name: string; lat: number; lon: number; desc?: string }>;
	}

	const INFRA_LAYERS: InfraLayer[] = [
		{ kind: 'Maritime chokepoint', icon: 'anchor', color: '#2bb8ff', items: CHOKEPOINTS },
		{ kind: 'Undersea cable landing', icon: 'cable', color: '#b36bff', items: CABLE_LANDINGS },
		{ kind: 'Nuclear site', icon: 'radiation', color: '#ffe033', items: NUCLEAR_SITES },
		{ kind: 'Military base', icon: 'shield', color: '#ff5ccf', items: MILITARY_BASES }
	];

	function project(lon: number, lat: number): [number, number] | null {
		const point = projection?.([lon, lat]);
		return point ? [point[0], point[1]] : null;
	}

	interface MarkerOptions {
		x: number;
		y: number;
		icon: IconName;
		color: string;
		radius: number;
		/** Filled badge with a white glyph (conflicts) vs. dark badge with a colored glyph */
		solid?: boolean;
		pulse?: boolean;
		className?: string;
		label?: string;
		hitPadding?: number;
	}

	/**
	 * Draw an icon badge. Markers are sized in screen pixels: the group is counter-scaled
	 * against the zoom transform, so the badge keeps its size while the map zooms.
	 * Returns the transparent hit circle for attaching events.
	 */
	function appendMarker(o: MarkerOptions) {
		const group = mapGroup
			.append('g')
			.attr('class', `map-icon ${o.className ?? ''}`.trim())
			.attr('transform', `translate(${o.x},${o.y}) scale(${1 / currentZoomScale})`);

		if (o.pulse) {
			group
				.append('circle')
				.attr('class', 'marker-pulse')
				.attr('r', o.radius)
				.attr('fill', o.color);
		}

		group
			.append('circle')
			.attr('class', 'marker-badge')
			.attr('r', o.radius)
			.attr('fill', o.solid ? o.color : '#07120e')
			.attr('fill-opacity', o.solid ? 0.95 : 0.9)
			.attr('stroke', o.solid ? '#ffffff' : o.color)
			.attr('stroke-width', o.solid ? 1 : 1.3)
			.attr('stroke-opacity', o.solid ? 0.9 : 1);

		const glyphSize = o.radius * 1.35;
		const glyphScale = glyphSize / 24;
		const glyph = group
			.append('g')
			.attr('class', 'marker-glyph')
			.attr('transform', `translate(${-glyphSize / 2},${-glyphSize / 2}) scale(${glyphScale})`)
			.attr('fill', 'none')
			.attr('stroke', o.solid ? '#ffffff' : o.color)
			.attr('stroke-width', 1.5 / glyphScale)
			.attr('stroke-linecap', 'round')
			.attr('stroke-linejoin', 'round');
		for (const [tag, attrs] of getIconNodes(o.icon)) {
			const element = glyph.append(tag);
			for (const [key, value] of Object.entries(attrs)) element.attr(key, value);
		}

		if (o.label) {
			group
				.append('text')
				.attr('class', 'map-label')
				.attr('x', o.radius + 4)
				.attr('y', 3)
				.attr('fill', o.color)
				.text(o.label);
		}

		return group
			.append('circle')
			.attr('class', 'marker-hit')
			.attr('r', o.radius + (o.hitPadding ?? 4))
			.attr('fill', 'transparent');
	}

	// Conflict regions worth drawing at the current zoom, most severe first
	function getVisibleConflicts(): GdeltConflictEvent[] {
		const showAll = currentZoomScale >= ZOOM_THRESHOLDS.showAllConflicts;
		return [...gdeltConflicts]
			.filter((c) => showAll || SEVERITY_RANK[c.severity] >= SEVERITY_RANK.elevated)
			.sort(
				(a, b) =>
					SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.numArticles - a.numArticles
			)
			.slice(0, showAll ? 20 : 12);
	}

	// A marker waiting to be drawn. Lower-priority markers are dropped when they would sit
	// on top of a higher-priority one; zooming in spreads them apart so they reappear.
	interface MarkerPlan {
		priority: number;
		x: number;
		y: number;
		radius: number;
		draw: () => void;
	}

	// Draw all map markers (redrawn on zoom so they keep a constant screen size)
	function drawMapIcons(): void {
		if (!mapGroup || !projection) return;

		mapGroup.selectAll('.map-icon').remove();

		const showLabels = currentZoomScale >= ZOOM_THRESHOLDS.showLabels;
		const plans: MarkerPlan[] = [];

		// Live conflict regions derived from GDELT coverage (highest priority)
		if (layers.events) {
			for (const conflict of getVisibleConflicts()) {
				const position = project(conflict.lon, conflict.lat);
				if (!position) continue;
				const color = THREAT_COLORS[conflict.severity];
				const typeInfo = CONFLICT_TYPES[conflict.type];
				const important = SEVERITY_RANK[conflict.severity] >= SEVERITY_RANK.high;
				const name = conflict.name.length > 20 ? conflict.name.slice(0, 18) + '…' : conflict.name;
				plans.push({
					priority: 3,
					x: position[0],
					y: position[1],
					radius: 9,
					draw: () => {
						appendMarker({
							x: position[0],
							y: position[1],
							icon: typeInfo.icon,
							color,
							radius: 9,
							solid: true,
							pulse: important,
							className: 'conflict-marker',
							label: important || showLabels ? name : undefined,
							hitPadding: 3
						})
							.on('click', (event: MouseEvent) => {
								event.stopPropagation();
								showGdeltConflictDetails(conflict);
							})
							.on('mouseenter', (event: MouseEvent) =>
								showTooltip(
									event,
									conflict.name,
									color,
									[
										{ text: `${SEVERITY_LABELS[conflict.severity]} · ${typeInfo.label}` },
										{ text: `${conflict.numArticles} articles in the last 48h`, icon: 'newspaper' },
										{ text: 'Click for coverage' }
									],
									typeInfo.icon
								)
							)
							.on('mousemove', moveTooltip)
							.on('mouseleave', hideTooltip);
					}
				});
			}
		}

		// Static geopolitical hotspots; only the most severe at the lowest zoom
		if (layers.hotspots) {
			const showAllHotspots = currentZoomScale >= ZOOM_THRESHOLDS.showAllHotspots;
			for (const h of HOTSPOTS) {
				if (!showAllHotspots && SEVERITY_RANK[h.level] < SEVERITY_RANK.high) continue;
				const position = project(h.lon, h.lat);
				if (!position) continue;
				const color = THREAT_COLORS[h.level];
				plans.push({
					priority: 2,
					x: position[0],
					y: position[1],
					radius: 6.5,
					draw: () => {
						appendMarker({
							x: position[0],
							y: position[1],
							icon: 'crosshair',
							color,
							radius: 6.5,
							pulse: SEVERITY_RANK[h.level] >= SEVERITY_RANK.high,
							className: 'hotspot-marker',
							label: showLabels ? h.name : undefined
						})
							.on('click', (event: MouseEvent) => {
								event.stopPropagation();
								showHotspotDetails(h);
							})
							.on('mouseenter', (event: MouseEvent) =>
								showEnhancedTooltip(event, h.name, h.lat, h.lon, h.desc, color, h.level)
							)
							.on('mousemove', moveTooltip)
							.on('mouseleave', hideTooltip);
					}
				});
			}
		}

		// Infrastructure: chokepoints, cable landings, nuclear sites, military bases
		if (layers.infra) {
			for (const layer of INFRA_LAYERS) {
				for (const item of layer.items) {
					const position = project(item.lon, item.lat);
					if (!position) continue;
					plans.push({
						priority: 1,
						x: position[0],
						y: position[1],
						radius: 6.5,
						draw: () => {
							const lines: TooltipLine[] = [{ text: layer.kind, icon: layer.icon }];
							if (item.desc) lines.push({ text: item.desc });
							appendMarker({
								x: position[0],
								y: position[1],
								icon: layer.icon,
								color: layer.color,
								radius: 6.5,
								className: 'infra-marker',
								label: showLabels ? item.name : undefined
							})
								.on('mouseenter click', (event: MouseEvent) =>
									showTooltip(event, item.name, layer.color, lines, layer.icon)
								)
								.on('mousemove', moveTooltip)
								.on('mouseleave', hideTooltip);
						}
					});
				}
			}
		}

		// Keep the highest-priority markers, dropping any that would overlap (in screen
		// pixels: map distances grow with the zoom scale, marker sizes do not)
		const accepted: MarkerPlan[] = [];
		for (const plan of [...plans].sort((a, b) => b.priority - a.priority)) {
			const overlaps = accepted.some(
				(other) =>
					Math.hypot(plan.x - other.x, plan.y - other.y) * currentZoomScale <
					plan.radius + other.radius + 2
			);
			if (!overlaps) accepted.push(plan);
		}

		// Draw lowest priority first so important markers end up on top
		for (const plan of accepted.reverse()) plan.draw();
	}

	// Draw custom monitor locations
	function drawMonitors(): void {
		if (!mapGroup || !projection) return;

		mapGroup.selectAll('.monitor-marker').remove();

		for (const m of monitors) {
			if (!m.enabled || !m.location) continue;
			const position = project(m.location.lon, m.location.lat);
			if (!position) continue;
			const color = m.color || '#00ffff';
			const lines: TooltipLine[] = [];
			if (m.location.name) lines.push({ text: m.location.name, icon: 'map-pin' });
			if (m.keywords.length > 0) lines.push({ text: m.keywords.join(', ') });
			appendMarker({
				x: position[0],
				y: position[1],
				icon: 'radar',
				color,
				radius: 7,
				className: 'monitor-marker',
				label: m.name
			})
				.on('mouseenter click', (event: MouseEvent) =>
					showTooltip(event, m.name, color, lines, 'radar')
				)
				.on('mousemove', moveTooltip)
				.on('mouseleave', hideTooltip);
		}
	}

	// Cluster color by share of alerts: blue (none) -> yellow -> orange -> red
	function getClusterColor(cluster: NewsCluster): string {
		const alertRatio = cluster.alertCount / cluster.count;
		if (alertRatio > 0.5) return THREAT_COLORS.critical;
		if (alertRatio > 0.2) return THREAT_COLORS.high;
		if (cluster.alertCount > 0) return THREAT_COLORS.elevated;
		return '#2bb8ff';
	}

	// Draw news clusters on map
	function drawNewsClusters(): void {
		if (!mapGroup || !projection) return;

		mapGroup.selectAll('.news-cluster').remove();

		if (!layers.news) return;

		const inverseScale = 1 / currentZoomScale;
		const minClusterSize = currentZoomScale >= ZOOM_THRESHOLDS.showSmallClusters ? 1 : 2;

		for (const cluster of newsClusters) {
			if (cluster.count < minClusterSize) continue;
			// Only show clusters with alerts or multiple items (important news)
			if (cluster.alertCount === 0 && cluster.count < 3) continue;

			const position = project(cluster.lon, cluster.lat);
			if (!position) continue;

			const color = getClusterColor(cluster);
			const radius = Math.min(12, Math.max(6, 6 + cluster.count * 0.3));

			const group = mapGroup
				.append('g')
				.attr('class', 'news-cluster')
				.attr('transform', `translate(${position[0]},${position[1]}) scale(${inverseScale})`);

			group
				.append('circle')
				.attr('r', radius)
				.attr('fill', color)
				.attr('fill-opacity', 0.45)
				.attr('stroke', '#fff')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.6);

			group
				.append('text')
				.attr('class', 'cluster-count')
				.attr('dominant-baseline', 'central')
				.attr('text-anchor', 'middle')
				.text(cluster.count);

			group
				.append('circle')
				.attr('class', 'marker-hit')
				.attr('r', radius + 3)
				.attr('fill', 'transparent')
				.on('click', (event: MouseEvent) => {
					event.stopPropagation();
					showNewsClusterDetails(cluster);
				})
				.on('mouseenter', (event: MouseEvent) => {
					const lines: TooltipLine[] = cluster.items.slice(0, 3).map((item) => ({
						text: item.title.length > 60 ? item.title.slice(0, 57) + '…' : item.title,
						icon: item.isAlert ? 'triangle-alert' : 'newspaper'
					}));
					if (cluster.items.length > 3) lines.push({ text: `+${cluster.items.length - 3} more` });
					lines.push({ text: 'Click for details' });
					showTooltip(
						event,
						`${cluster.region.toUpperCase()} · ${cluster.count} news, ${cluster.alertCount} alerts`,
						color,
						lines,
						'newspaper'
					);
				})
				.on('mousemove', moveTooltip)
				.on('mouseleave', hideTooltip);
		}
	}

	// Zoom controls
	function zoomIn(): void {
		if (!svg || !zoom) return;
		svg.transition().duration(300).call(zoom.scaleBy, 1.5);
	}

	function zoomOut(): void {
		if (!svg || !zoom) return;
		svg
			.transition()
			.duration(300)
			.call(zoom.scaleBy, 1 / 1.5);
	}

	function resetZoom(): void {
		if (!svg || !zoom || !d3Module) return;
		svg.transition().duration(300).call(zoom.transform, d3Module.zoomIdentity);
	}

	// Centre the map on the focus point, clamped to the same bounds the zoom behaviour uses
	function applyFocus(target: MapFocus): void {
		if (!svg || !zoom || !projection || !d3Module) return;
		const [x, y] = projection([target.lon, target.lat]) ?? [WIDTH / 2, HEIGHT / 2];
		const k = target.zoom;
		const tx = Math.min(0, Math.max(WIDTH - k * WIDTH, WIDTH / 2 - k * x));
		const ty = Math.min(0, Math.max(HEIGHT - k * HEIGHT, HEIGHT / 2 - k * y));
		svg
			.transition()
			.duration(500)
			.call(zoom.transform, d3Module.zoomIdentity.translate(tx, ty).scale(k));
	}

	// Follow the focus prop, including after the map finishes loading
	$effect(() => {
		if (focus && mapReady) applyFocus(focus);
	});

	// Reactively update monitors when they change
	$effect(() => {
		// Track monitors changes
		const _monitorsRef = monitors;
		if (_monitorsRef && mapGroup && projection) {
			drawMonitors();
		}
	});

	// Reactively update news clusters when news changes
	$effect(() => {
		// Track news changes
		const _newsRef = news;
		if (_newsRef && mapGroup && projection) {
			drawNewsClusters();
		}
	});

	let retryTimer: ReturnType<typeof setTimeout> | null = null;

	// Fetch conflict regions; on failure keep the previous markers and retry sooner
	async function loadGdeltConflicts(): Promise<void> {
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
		conflictsLoading = true;
		conflictsError = null;

		try {
			gdeltConflicts = await fetchConflictsShared();

			if (mapGroup && projection) {
				drawMapIcons();
			}
		} catch (err) {
			conflictsError = err instanceof Error ? err.message : 'Failed to load conflict data';
			console.error('GDELT Conflicts error:', err);
			retryTimer = setTimeout(loadGdeltConflicts, CONFLICT_RETRY_MS);
		} finally {
			conflictsLoading = false;
		}
	}

	const CONFLICT_REFRESH_MS = 5 * 60 * 1000;
	const CONFLICT_RETRY_MS = 60 * 1000;

	onMount(() => {
		initMap();
		loadGdeltConflicts();

		const conflictRefreshInterval = setInterval(loadGdeltConflicts, CONFLICT_REFRESH_MS);

		return () => {
			clearInterval(conflictRefreshInterval);
			if (retryTimer) clearTimeout(retryTimer);
		};
	});

	// Nearby headlines for the selected hotspot
	const hotspotNews = $derived.by<GeoNews[]>(() => {
		const h = selectedHotspot;
		if (!h) return [];
		return geoNews
			.filter((n) => haversineKm(h.lat, h.lon, n.lat, n.lon) < 600)
			.sort((a, b) => Number(b.isAlert) - Number(a.isAlert) || b.timestamp - a.timestamp)
			.slice(0, 6);
	});

	// Level shown in the cluster modal header
	const selectedClusterColor = $derived(
		selectedNewsCluster ? getClusterColor(selectedNewsCluster) : ''
	);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && showDetailModal && closeDetailModal()} />

<Panel id="map" {title} {error}>
	<div class="map-container" bind:this={mapContainer}>
		<svg class="map-svg" role="img" aria-label="World map of conflicts, hotspots and news"></svg>
		{#if tooltipVisible && tooltipContent}
			<div
				class="map-tooltip"
				style="left: {tooltipPosition.left}px; top: {tooltipPosition.top}px; max-width: {TOOLTIP_MAX_WIDTH}px;"
			>
				<div class="tooltip-title" style="color: {tooltipContent.color}">
					{#if tooltipContent.icon}<Icon name={tooltipContent.icon} size={12} />{/if}
					<span>{tooltipContent.title}</span>
				</div>
				{#each tooltipContent.lines as line, i (i)}
					<div class="tooltip-line">
						{#if line.icon}<Icon name={line.icon} size={10} />{/if}
						<span>{line.text}</span>
					</div>
				{/each}
			</div>
		{/if}
		<div class="zoom-controls">
			<button class="zoom-btn" onclick={zoomIn} title="Zoom in" aria-label="Zoom in">
				<Icon name="plus" size={14} />
			</button>
			<button class="zoom-btn" onclick={zoomOut} title="Zoom out" aria-label="Zoom out">
				<Icon name="minus" size={14} />
			</button>
			<button class="zoom-btn" onclick={resetZoom} title="Reset view" aria-label="Reset view">
				<Icon name="rotate-ccw" size={14} />
			</button>
		</div>
		<div class="map-legend">
			<div class="legend-row">
				{#each LAYER_BUTTONS as layer (layer.key)}
					<button
						class="legend-btn"
						class:active={layers[layer.key]}
						style="--layer-color: {layer.color}"
						onclick={() => toggleLayer(layer.key)}
						title="{layers[layer.key] ? 'Hide' : 'Show'}: {layer.title}"
						aria-pressed={layers[layer.key]}
					>
						<Icon name={layer.icon} size={12} />
						<span class="legend-label">{layer.label}</span>
					</button>
				{/each}
				<div class="legend-status">
					{#if conflictsLoading}
						<span class="status-loading" title="Loading conflict regions from GDELT">
							<Icon name="refresh-cw" size={12} class="spin" />
						</span>
					{:else if conflictsError}
						<button
							class="status-error"
							onclick={loadGdeltConflicts}
							title="Conflict data unavailable - click to retry"
							aria-label="Conflict data unavailable, retry"
						>
							<Icon name="circle-alert" size={12} />
						</button>
					{:else}
						<span
							class="status-ok"
							title="{gdeltConflicts.length} conflict regions in the last 48h"
						>
							{gdeltConflicts.length}
						</span>
					{/if}
				</div>
			</div>
			<div class="severity-key" aria-label="Severity colors">
				{#each Object.entries(SEVERITY_LABELS).reverse() as [level, label] (level)}
					<span class="severity-item">
						<span
							class="severity-dot"
							style="background: {THREAT_COLORS[level as keyof typeof THREAT_COLORS]}"
						></span>
						{label}
					</span>
				{/each}
			</div>
		</div>

		<!-- Live Event Feed Ticker -->
		{#if liveEvents.length > 0}
			<div class="live-ticker">
				<div class="ticker-label">LIVE</div>
				<div class="ticker-content">
					<div class="ticker-scroll" style="animation-duration: {liveEvents.length * 8}s">
						<!-- The list is rendered twice so the scroll loops without a gap -->
						{#each [0, 1] as copy (copy)}
							<div class="ticker-group" aria-hidden={copy === 1 ? 'true' : undefined}>
								{#each liveEvents as event (event.id)}
									<a
										href={event.link}
										target="_blank"
										rel="noopener noreferrer"
										class="ticker-item"
										tabindex={copy === 1 ? -1 : undefined}
										class:critical={event.alertKeyword &&
											['war', 'attack', 'missile', 'nuclear', 'invasion'].some((k) =>
												event.alertKeyword?.includes(k)
											)}
									>
										<span class="ticker-region">{event.region.toUpperCase()}</span>
										<span class="ticker-title">{event.title}</span>
										<span class="ticker-time">{timeAgo(event.timestamp)}</span>
									</a>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Panel>

<!-- Detail Modal -->
{#if showDetailModal}
	<div
		class="detail-modal-overlay"
		role="presentation"
		onclick={closeDetailModal}
		onkeydown={(e) => e.key === 'Escape' && closeDetailModal()}
	>
		<div
			class="detail-modal"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closeDetailModal()}
		>
			<button class="modal-close" onclick={closeDetailModal} aria-label="Close">
				<Icon name="x" size={16} />
			</button>

			{#if selectedGdeltConflict}
				<div
					class="modal-header"
					style="border-color: {THREAT_COLORS[selectedGdeltConflict.severity]}"
				>
					<div
						class="modal-icon"
						style="background: {THREAT_COLORS[selectedGdeltConflict.severity]}"
					>
						<Icon name={CONFLICT_TYPES[selectedGdeltConflict.type].icon} size={22} />
					</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedGdeltConflict.name}</h3>
						<div class="modal-badges">
							<span class="badge badge-{selectedGdeltConflict.severity}"
								>{selectedGdeltConflict.severity.toUpperCase()}</span
							>
							<span class="badge badge-type"
								>{CONFLICT_TYPES[selectedGdeltConflict.type].label.toUpperCase()}</span
							>
							<span class="badge" style="background: rgba(0, 170, 255, 0.2); color: #00aaff;">
								{selectedGdeltConflict.numArticles} ARTICLES
							</span>
						</div>
					</div>
				</div>

				<div class="modal-body">
					{#if selectedGdeltConflict.imageUrl}
						<div class="modal-image">
							<img src={selectedGdeltConflict.imageUrl} alt={selectedGdeltConflict.name} />
						</div>
					{/if}

					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">
								{selectedGdeltConflict.lat.toFixed(2)}°, {selectedGdeltConflict.lon.toFixed(2)}°
							</div>
						</div>
						<div class="info-item">
							<div class="info-label">Country</div>
							<div class="info-value">{selectedGdeltConflict.country || 'Unknown'}</div>
						</div>
						<div class="info-item">
							<div class="info-label">Coverage</div>
							<div class="info-value">{selectedGdeltConflict.numArticles} Articles</div>
						</div>
						<div class="info-item">
							<div class="info-label">Last Updated</div>
							<div class="info-value">{timeAgo(selectedGdeltConflict.timestamp)}</div>
						</div>
					</div>

					{#if selectedGdeltConflict.articles && selectedGdeltConflict.articles.length > 0}
						<div class="info-section">
							<h4>Related Coverage</h4>
							<div class="news-list">
								{#each selectedGdeltConflict.articles as article}
									<a
										href={article.url}
										target="_blank"
										rel="noopener noreferrer"
										class="news-item-card"
									>
										<div class="news-item-header">
											<span class="news-source">{article.source || 'News Source'}</span>
											<span class="news-icon"><Icon name="external-link" size={12} /></span>
										</div>
										<div class="news-item-title">{article.title}</div>
									</a>
								{/each}
							</div>
						</div>
					{:else}
						<div class="info-section">
							<h4>Source</h4>
							{#if selectedGdeltConflict.sourceUrl}
								<a
									href={selectedGdeltConflict.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="source-link"
								>
									View Original Article <Icon name="arrow-right" size={12} />
								</a>
							{:else}
								<p class="no-source">No source URL available</p>
							{/if}
						</div>
					{/if}

					<div class="info-section gdelt-attribution">
						<p>
							Data sourced from <a
								href="https://www.gdeltproject.org/"
								target="_blank"
								rel="noopener noreferrer">GDELT Project</a
							>
						</p>
					</div>
				</div>
			{:else if selectedHotspot}
				<div class="modal-header" style="border-color: {THREAT_COLORS[selectedHotspot.level]}">
					<div class="modal-icon" style="background: {THREAT_COLORS[selectedHotspot.level]}">
						<Icon name="crosshair" size={22} />
					</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedHotspot.name}</h3>
						<div class="modal-badges">
							<span class="badge badge-{selectedHotspot.level}"
								>{selectedHotspot.level.toUpperCase()}</span
							>
						</div>
					</div>
				</div>

				<div class="modal-body">
					{#if selectedHotspot.desc}
						<div class="info-section">
							<h4>Information</h4>
							<p>{selectedHotspot.desc}</p>
						</div>
					{/if}

					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">
								{selectedHotspot.lat.toFixed(2)}°, {selectedHotspot.lon.toFixed(2)}°
							</div>
						</div>
						<div class="info-item">
							<div class="info-label">Threat Level</div>
							<div class="info-value">{SEVERITY_LABELS[selectedHotspot.level]}</div>
						</div>
					</div>

					<div class="info-section">
						<h4>Nearby Headlines</h4>
						{#if hotspotNews.length > 0}
							<div class="news-list">
								{#each hotspotNews as item}
									<a
										href={item.link}
										target="_blank"
										rel="noopener noreferrer"
										class="news-item-card"
									>
										<div class="news-item-header">
											<span class="news-icon">
												<Icon name={item.isAlert ? 'triangle-alert' : 'newspaper'} size={12} />
											</span>
											<span class="news-source">{item.source}</span>
											<span class="news-time">{timeAgo(item.timestamp)}</span>
										</div>
										<div class="news-item-title">{item.title}</div>
									</a>
								{/each}
							</div>
						{:else}
							<p class="no-source">No recent headlines mention this area.</p>
						{/if}
					</div>
				</div>
			{:else if selectedNewsCluster}
				<div class="modal-header" style="border-color: {selectedClusterColor}">
					<div class="modal-icon" style="background: {selectedClusterColor}">
						<Icon name="newspaper" size={22} />
					</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedNewsCluster.region.toUpperCase()} News</h3>
						<div class="modal-badges">
							<span class="badge" style="background: rgba(0, 170, 255, 0.2); color: #00aaff;">
								{selectedNewsCluster.count} ARTICLES
							</span>
							{#if selectedNewsCluster.alertCount > 0}
								<span class="badge" style="background: rgba(255, 68, 68, 0.2); color: #ff4444;">
									{selectedNewsCluster.alertCount} ALERTS
								</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="modal-body">
					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">
								{selectedNewsCluster.lat.toFixed(2)}°, {selectedNewsCluster.lon.toFixed(2)}°
							</div>
						</div>
						<div class="info-item">
							<div class="info-label">Region</div>
							<div class="info-value">{selectedNewsCluster.region}</div>
						</div>
						<div class="info-item">
							<div class="info-label">Total News</div>
							<div class="info-value">{selectedNewsCluster.count}</div>
						</div>
						<div class="info-item">
							<div class="info-label">Alerts</div>
							<div class="info-value">{selectedNewsCluster.alertCount}</div>
						</div>
					</div>

					<div class="info-section">
						<h4>Recent Articles</h4>
						<div class="news-list">
							{#each selectedNewsCluster.items as item}
								<a
									href={item.link}
									target="_blank"
									rel="noopener noreferrer"
									class="news-item-card"
								>
									<div class="news-item-header">
										<span class="news-icon">
											<Icon name={item.isAlert ? 'triangle-alert' : 'newspaper'} size={12} />
										</span>
										<span class="news-source">{item.source}</span>
										<span class="news-time">{timeAgo(item.timestamp)}</span>
									</div>
									<div class="news-item-title">{item.title}</div>
									{#if item.description}
										<div class="news-item-snippet">
											{item.description.length > 150
												? item.description.substring(0, 150) + '...'
												: item.description}
										</div>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.map-container {
		position: relative;
		width: 100%;
		aspect-ratio: 2 / 1;
		background: #0a0f0d;
		border-radius: 4px;
		overflow: hidden;
	}

	.map-svg {
		width: 100%;
		height: 100%;
	}

	.map-tooltip {
		position: absolute;
		background: rgba(8, 14, 12, 0.96);
		border: 1px solid #2a3a35;
		border-radius: 6px;
		padding: 0.5rem 0.6rem;
		font-size: 0.65rem;
		line-height: 1.4;
		color: #ddd;
		pointer-events: none;
		z-index: 100;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
	}

	.tooltip-title {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 700;
		margin-bottom: 0.2rem;
	}

	.tooltip-line {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
		color: #cfd8d4;
	}

	.tooltip-line :global(.icon) {
		margin-top: 0.15rem;
		opacity: 0.8;
	}

	.zoom-controls {
		position: absolute;
		bottom: 40px;
		right: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.zoom-btn {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(20, 20, 20, 0.9);
		border: 1px solid #333;
		border-radius: 4px;
		color: #aaa;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.zoom-btn:focus-visible,
	.legend-btn:focus-visible {
		outline: 2px solid #44ff88;
		outline-offset: 1px;
	}

	.zoom-btn:hover {
		background: rgba(40, 40, 40, 0.9);
		color: #fff;
	}

	.map-legend {
		position: absolute;
		bottom: 36px;
		left: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgba(8, 14, 12, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 4px 6px;
		border-radius: 6px;
		backdrop-filter: blur(4px);
	}

	.legend-row {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.legend-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 22px;
		padding: 0 6px;
		color: #6f7c77;
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		line-height: 1;
		transition: all 0.15s ease;
	}

	.legend-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #c5d0cb;
	}

	.legend-btn.active {
		color: var(--layer-color);
		background: color-mix(in srgb, var(--layer-color) 14%, transparent);
		border-color: color-mix(in srgb, var(--layer-color) 40%, transparent);
	}

	.legend-status {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		margin-left: 2px;
		border-left: 1px solid rgba(255, 255, 255, 0.15);
		font-size: 0.6rem;
		font-weight: 700;
		color: #889;
	}

	.legend-status button {
		display: flex;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.status-loading {
		display: flex;
		color: #ffaa00;
	}

	.status-loading :global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-error {
		color: #ff4466;
	}

	.status-ok {
		color: #44ff88;
	}

	.severity-key {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0 6px 2px;
		font-size: 0.55rem;
		color: #8a9892;
	}

	.severity-item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.severity-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	/* Markers drawn by D3 */
	:global(.marker-glyph),
	:global(.map-label),
	:global(.cluster-count) {
		pointer-events: none;
	}

	:global(.marker-hit) {
		cursor: pointer;
	}

	:global(.map-icon:hover .marker-badge) {
		filter: brightness(1.3);
	}

	:global(.marker-pulse) {
		transform-box: fill-box;
		transform-origin: center;
		pointer-events: none;
		animation: marker-pulse 2.8s ease-out infinite;
	}

	@keyframes marker-pulse {
		0% {
			transform: scale(1);
			opacity: 0.55;
		}
		100% {
			transform: scale(2.4);
			opacity: 0;
		}
	}

	:global(.map-label) {
		font-family: monospace;
		font-size: 8px;
		font-weight: 600;
		paint-order: stroke;
		stroke: #04100c;
		stroke-width: 2.5px;
		stroke-linejoin: round;
	}

	:global(.cluster-count) {
		font-family: monospace;
		font-size: 8px;
		font-weight: 700;
		fill: #fff;
	}

	/* Selected country highlight with glow effect */
	:global(.country-selected) {
		filter: drop-shadow(0 0 6px rgba(34, 255, 153, 0.6));
	}

	@media (max-width: 768px) {
		.legend-label,
		.severity-key {
			display: none;
		}

		.legend-btn {
			padding: 0 5px;
		}
	}

	/* Live Event Ticker */
	.live-ticker {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: stretch;
		background: rgba(0, 0, 0, 0.85);
		border-top: 1px solid #333;
		height: 28px;
		overflow: hidden;
	}

	.ticker-label {
		display: flex;
		align-items: center;
		padding: 0 0.5rem;
		background: #ff4444;
		color: #fff;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		animation: ticker-pulse 1s ease-in-out infinite;
	}

	@keyframes ticker-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.ticker-content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.ticker-scroll {
		display: flex;
		width: max-content;
		animation: ticker-scroll 60s linear infinite;
		white-space: nowrap;
	}

	.ticker-group {
		display: flex;
		gap: 2rem;
		padding-right: 2rem;
	}

	.ticker-scroll:hover {
		animation-play-state: paused;
	}

	@keyframes ticker-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.ticker-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6rem;
		color: #ccc;
		text-decoration: none;
		padding: 0.25rem 0;
	}

	.ticker-item:hover {
		color: #fff;
	}

	.ticker-item.critical {
		color: #ff6666;
	}

	.ticker-item.critical:hover {
		color: #ff8888;
	}

	.ticker-region {
		color: #00aaff;
		font-weight: 600;
		background: rgba(0, 170, 255, 0.15);
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
	}

	.ticker-title {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ticker-time {
		color: #666;
		font-size: 0.55rem;
	}

	/* Hide zoom controls on mobile where touch zoom is available */
	@media (max-width: 768px) {
		.zoom-controls {
			display: flex;
		}

		.live-ticker {
			height: 24px;
		}

		.ticker-label {
			font-size: 0.5rem;
			padding: 0 0.3rem;
		}

		.ticker-item {
			font-size: 0.55rem;
		}

		.ticker-title {
			max-width: 200px;
		}
	}

	/* Detail Modal */
	.detail-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.detail-modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: var(--text);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-bottom: 2px solid var(--border);
	}

	.modal-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		color: #fff;
	}

	.modal-title-group {
		flex: 1;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text);
	}

	.modal-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.badge-critical {
		background: rgba(255, 68, 68, 0.2);
		color: #ff4444;
	}

	.badge-high {
		background: rgba(255, 170, 0, 0.2);
		color: #ffaa00;
	}

	.badge-elevated {
		background: rgba(255, 204, 0, 0.2);
		color: #ffcc00;
	}

	.badge-low {
		background: rgba(68, 255, 136, 0.2);
		color: #44ff88;
	}

	.badge-status {
		background: rgba(100, 100, 255, 0.2);
		color: #6666ff;
	}

	.badge-type {
		background: rgba(150, 150, 150, 0.2);
		color: #aaa;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.info-section {
		margin-bottom: 1.5rem;
	}

	.info-section:last-child {
		margin-bottom: 0;
	}

	.info-section h4 {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-dim);
		margin: 0 0 0.75rem 0;
	}

	.info-section p {
		margin: 0;
		color: var(--text);
		line-height: 1.6;
		font-size: 0.85rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.info-item {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.75rem;
		border-radius: 4px;
	}

	.info-label {
		font-size: 0.65rem;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.info-value {
		font-size: 0.85rem;
		color: var(--text);
		font-weight: 600;
	}

	.parties-list,
	.keywords-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.party-tag,
	.keyword-tag {
		padding: 0.4rem 0.75rem;
		background: rgba(68, 255, 136, 0.1);
		border: 1px solid rgba(68, 255, 136, 0.3);
		border-radius: 4px;
		font-size: 0.75rem;
		color: #44ff88;
	}

	.keyword-tag {
		background: rgba(100, 150, 255, 0.1);
		border-color: rgba(100, 150, 255, 0.3);
		color: #6696ff;
	}

	.source-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #44ff88;
		text-decoration: none;
		padding: 0.5rem 1rem;
		background: rgba(68, 255, 136, 0.1);
		border: 1px solid rgba(68, 255, 136, 0.3);
		border-radius: 4px;
		transition: all 0.2s;
	}

	.source-link:hover {
		background: rgba(68, 255, 136, 0.2);
		border-color: rgba(68, 255, 136, 0.5);
	}

	.no-source {
		color: #666;
		font-style: italic;
	}

	.event-code-info {
		font-size: 0.75rem;
		color: #888;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.gdelt-attribution {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.7rem;
		color: #666;
	}

	.gdelt-attribution a {
		color: #44ff88;
		text-decoration: none;
	}

	.gdelt-attribution a:hover {
		text-decoration: underline;
	}

	.news-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.news-item-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 0.75rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.news-item-card:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(68, 255, 136, 0.4);
		transform: translateY(-1px);
	}

	.news-item-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.65rem;
	}

	.news-icon {
		display: inline-flex;
		align-items: center;
		color: var(--text-dim);
	}

	.news-source {
		color: #44ff88;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.news-time {
		color: var(--text-dim);
		margin-left: auto;
	}

	.news-item-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.news-item-snippet {
		font-size: 0.75rem;
		color: var(--text-dim);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.modal-image {
		margin-bottom: 1.5rem;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-image img {
		width: 100%;
		height: auto;
		display: block;
		max-height: 200px;
		object-fit: cover;
	}

	.summary-text {
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text);
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		.detail-modal {
			width: 95%;
			max-height: 90vh;
		}

		.modal-header {
			padding: 1rem;
		}

		.modal-body {
			padding: 1rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.news-list {
			max-height: 300px;
		}
	}
</style>
