<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { Panel } from '$lib/components/common';
	import {
		HOTSPOTS,
		CONFLICT_ZONES,
		CHOKEPOINTS,
		CABLE_LANDINGS,
		NUCLEAR_SITES,
		MILITARY_BASES,
		OCEANS,
		SANCTIONED_COUNTRY_IDS,
		THREAT_COLORS,
		WEATHER_CODES,
		REGION_CENTERS,
		getNewsCoordinates,
		type ActiveConflict
	} from '$lib/config/map';
	import { fetchConflictEventsFromGDELT, type GdeltConflictEvent } from '$lib/api/gdelt-conflicts';
	import { CACHE_TTLS } from '$lib/config/api';
	import type { CustomMonitor, NewsItem } from '$lib/types';
	import { selectedCountry, type SelectedCountry } from '$lib/stores';
	import { getCountryName, COUNTRY_ID_TO_NAME } from '$lib/config/countries';
	import { timeAgo } from '$lib/utils';

	// Reactive state to track selected country store
	let selectedCountryState = $state<SelectedCountry>({ name: null });

	// Subscribe to store changes and apply highlighting
	$effect(() => {
		const unsubscribe = selectedCountry.subscribe((value) => {
			selectedCountryState = value;
			// Apply highlight when selection changes (e.g., from clear button or external selection)
			applyCountryHighlight(value.name);
		});
		return unsubscribe;
	});

	interface Props {
		monitors?: CustomMonitor[];
		news?: NewsItem[];
		error?: string | null;
	}

	let { monitors = [], news = [], error = null }: Props = $props();

	// Distance-based clustering helper functions
	function toRadians(degrees: number): number {
		return degrees * (Math.PI / 180);
	}

	function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371; // Earth radius in kilometers
		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

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
		const region =
			c1.region === c2.region ? c1.region : `${c1.region}/${c2.region}`;

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
					const dist = haversineDistance(
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

	// Use distance-based clustering that adapts to zoom level
	const snappedZoomScale = $derived(snapZoomScale(currentZoomScale));

	const newsClusters = $derived<NewsCluster[]>(() => {
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

	// Conflict zone intensity based on news count
	const conflictIntensity = $derived<Map<string, number>>(() => {
		const intensity = new Map<string, number>();

		// Map region names to conflict zone names
		const regionToZone: Record<string, string> = {
			ukraine: 'Ukraine',
			gaza: 'Gaza',
			israel: 'Gaza',
			taiwan: 'Taiwan Strait',
			yemen: 'Yemen',
			sudan: 'Sudan',
			myanmar: 'Myanmar'
		};

		for (const item of geoNews) {
			const zoneName = regionToZone[item.region];
			if (zoneName) {
				const current = intensity.get(zoneName) || 0;
				intensity.set(zoneName, current + (item.isAlert ? 2 : 1));
			}
		}

		return intensity;
	});

	let mapContainer: HTMLDivElement;
	// Search state
	let searchQuery = $state('');
	let searchResults = $state<string[]>([]);
	let showSearchResults = $state(false);
	// Simple layer visibility toggles
	let showEvents = $state(true);
	let showHotspots = $state(true);
	let showNews = $state(true);
	
	// Live GDELT conflict events (replaces hardcoded ACTIVE_CONFLICTS)
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
	let currentZoomScale = $state(1);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const WIDTH = 800;
	const HEIGHT = 400;
	
	// Zero out conflicts when zoomed out significantly to reduce clutter
	// At low zoom (zoomed out): show only critical items
	// At medium zoom: show more items
	// At high zoom: show everything
	const ZOOM_THRESHOLDS = {
		showAllHotspots: 1.8,        // Show all hotspots (not just critical/high)
		showInfrastructure: 2.5,     // Show chokepoints, cables, nuclear, military
		showAllConflicts: 2.8,       // Show all GDELT conflicts at 2.8 zoom
		showSmallClusters: 1.5,      // Show news clusters with < 5 items
		showLabels: 2.2              // Show text labels on icons
	};

	// Tooltip state
	let tooltipContent = $state<{
		title: string;
		color: string;
		lines: string[];
	} | null>(null);
	let tooltipPosition = $state({ left: 0, top: 0 });
	let tooltipVisible = $state(false);

	// Detailed info modal state
	let selectedConflict = $state<ActiveConflict | null>(null);
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
		condition: string;
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
			const tempF = temp ? Math.round((temp * 9) / 5 + 32) : null;
			const wind = data.current?.wind_speed_10m;
			const code = data.current?.weather_code;
			const result: WeatherResult = {
				temp: tempF,
				wind: wind ? Math.round(wind) : null,
				condition: WEATHER_CODES[code] || '—'
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

	// Show tooltip using state (safe rendering)
	function showTooltip(
		event: MouseEvent,
		title: string,
		color: string,
		lines: string[] = []
	): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		tooltipContent = { title, color, lines };
		tooltipPosition = {
			left: event.clientX - rect.left + 15,
			top: event.clientY - rect.top - 10
		};
		tooltipVisible = true;
	}

	// Move tooltip
	function moveTooltip(event: MouseEvent): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		tooltipPosition = {
			left: event.clientX - rect.left + 15,
			top: event.clientY - rect.top - 10
		};
	}

	// Hide tooltip
	function hideTooltip(): void {
		tooltipVisible = false;
		tooltipContent = null;
	}

	// Show detailed conflict information modal
	function showConflictDetails(conflict: ActiveConflict): void {
		selectedConflict = conflict;
		selectedGdeltConflict = null;
		selectedHotspot = null;
		selectedNewsCluster = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Show detailed GDELT conflict information modal
	function showGdeltConflictDetails(conflict: GdeltConflictEvent): void {
		selectedGdeltConflict = conflict;
		selectedConflict = null;
		selectedHotspot = null;
		selectedNewsCluster = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Show detailed hotspot information modal
	function showHotspotDetails(hotspot: (typeof HOTSPOTS)[0]): void {
		selectedHotspot = hotspot;
		selectedConflict = null;
		selectedNewsCluster = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Show detailed news cluster information modal
	function showNewsClusterDetails(cluster: NewsCluster): void {
		selectedNewsCluster = cluster;
		selectedConflict = null;
		selectedHotspot = null;
		showDetailModal = true;
		hideTooltip();
	}

	// Close detail modal
	function closeDetailModal(): void {
		showDetailModal = false;
		selectedConflict = null;
		selectedGdeltConflict = null;
		selectedHotspot = null;
		selectedNewsCluster = null;
	}

	// Apply country highlight styling
	function applyCountryHighlight(selectedName: string | null): void {
		if (!mapGroup) return;
		
		// Remove any existing highlight overlay
		mapGroup.selectAll('.country-highlight-overlay').remove();
		
		mapGroup
			.selectAll('path.country')
			.attr('fill', (feature: GeoJSON.Feature) => {
				const name = getCountryName(+(feature.id || 0));
				if (selectedName && name === selectedName) {
					return '#22ff99'; // Very bright green for selected country
				}
				return SANCTIONED_COUNTRY_IDS.includes(+(feature.id || 0)) ? '#2a1a1a' : '#0f3028';
			})
			.attr('stroke', (feature: GeoJSON.Feature) => {
				const name = getCountryName(+(feature.id || 0));
				if (selectedName && name === selectedName) {
					return '#ffffff'; // White stroke for maximum contrast
				}
				return SANCTIONED_COUNTRY_IDS.includes(+(feature.id || 0)) ? '#4a2020' : '#1a5040';
			})
			.attr('stroke-width', (feature: GeoJSON.Feature) => {
				const name = getCountryName(+(feature.id || 0));
				if (selectedName && name === selectedName) {
					return 3; // Much thicker stroke for visibility
				}
				return 0.5;
			})
			.classed('country-selected', (feature: GeoJSON.Feature) => {
				const name = getCountryName(+(feature.id || 0));
				return selectedName !== null && name === selectedName;
			})
			.each(function (this: SVGPathElement, feature: GeoJSON.Feature) {
				const name = getCountryName(+(feature.id || 0));
				if (selectedName && name === selectedName && path) {
					// Add striped pattern overlay on top of selected country
					mapGroup
						.append('path')
						.attr('class', 'country-highlight-overlay')
						.attr('d', path(feature))
						.attr('fill', 'url(#selected-pattern)')
						.attr('stroke', 'none')
						.attr('pointer-events', 'none');
				}
			});
	}

	// Build enhanced tooltip with weather
	async function showEnhancedTooltip(
		event: MouseEvent,
		_name: string,
		lat: number,
		lon: number,
		desc: string,
		color: string
	): Promise<void> {
		const localTime = getLocalTime(lon);
		const lines = [`🕐 Local: ${localTime}`];
		showTooltip(event, desc, color, lines);

		// Fetch weather asynchronously
		const weather = await getWeather(lat, lon);
		if (weather && tooltipVisible) {
			tooltipContent = {
				title: desc,
				color,
				lines: [
					`🕐 Local: ${localTime}`,
					`${weather.condition} ${weather.temp}°F, ${weather.wind}mph`
				]
			};
		}
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

		// Add pattern definition for selected country highlight
		const defs = svg.append('defs');
		defs.append('pattern')
			.attr('id', 'selected-pattern')
			.attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6)
			.attr('height', 6)
			.attr('patternTransform', 'rotate(45)')
			.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', 6)
			.attr('stroke', 'rgba(255, 255, 255, 0.3)')
			.attr('stroke-width', 2);

		mapGroup = svg.append('g').attr('id', 'mapGroup');

		// Setup zoom - allow touch pinch and button zoom only, disable trackpad/wheel zoom
		zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 6])
			.filter((event) => {
				// Disable wheel events (trackpad and mouse wheel zoom)
				if (event.type === 'wheel') return false;
				// Allow touch events (pinch zoom on mobile)
				if (event.type.startsWith('touch')) return true;
				// Allow mouse drag for panning
				if (event.type === 'mousedown' || event.type === 'mousemove') return true;
				// Block double-click zoom
				if (event.type === 'dblclick') return false;
				// Allow other events (programmatic zoom from buttons)
				return true;
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
				.style('cursor', 'pointer')
				.on('click', (_event: MouseEvent, d: GeoJSON.Feature) => {
					const countryName = getCountryName(+(d.id || 0));
					if (countryName) {
						selectedCountry.select(countryName);
						// Apply highlighting immediately (don't wait for reactive effect)
						applyCountryHighlight(countryName);
					}
				})
				.on('mouseenter', (event: MouseEvent, d: GeoJSON.Feature) => {
					const countryName = getCountryName(+(d.id || 0));
					if (countryName) {
						const selectedName = get(selectedCountry).name;
						mapGroup.selectAll('path.country')
							.attr('fill', (feature: GeoJSON.Feature) => {
								const name = getCountryName(+(feature.id || 0));
								// Keep selected country highlighted
								if (selectedName && name === selectedName) {
									return '#00cc66';
								}
								// Hover highlight for current country
								if (name === countryName) {
									return '#2a7060';
								}
								return SANCTIONED_COUNTRY_IDS.includes(+(feature.id || 0)) ? '#2a1a1a' : '#0f3028';
							})
							.attr('stroke', (feature: GeoJSON.Feature) => {
								const name = getCountryName(+(feature.id || 0));
								if (selectedName && name === selectedName) {
									return '#00ff88';
								}
								return SANCTIONED_COUNTRY_IDS.includes(+(feature.id || 0)) ? '#4a2020' : '#1a5040';
							})
							.attr('stroke-width', (feature: GeoJSON.Feature) => {
								const name = getCountryName(+(feature.id || 0));
								if (selectedName && name === selectedName) {
									return 2;
								}
								return 0.5;
							});
						showTooltip(event, countryName, '#00aa88');
					}
				})
				.on('mousemove', moveTooltip)
				.on('mouseleave', () => {
					// Restore colors when mouse leaves, keeping selected country highlighted
					applyCountryHighlight(get(selectedCountry).name);
					hideTooltip();
				});

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

			// Update conflict zone intensity
			updateConflictZoneIntensity();
		} catch (err) {
			console.error('Failed to load map data:', err);
		}
	}

	// Draw all map icons with zoom-aware scaling
	function drawMapIcons(): void {
		if (!mapGroup || !projection) return;

		// Remove existing icons
		mapGroup.selectAll('.map-icon').remove();

		const inverseScale = 1 / currentZoomScale;
		const showLabels = currentZoomScale >= ZOOM_THRESHOLDS.showLabels;
		
		// Check if we should show infrastructure icons (only when zoomed in enough)
		const showInfrastructure = currentZoomScale >= ZOOM_THRESHOLDS.showInfrastructure;

		// Draw chokepoints (only when zoomed in enough and no filter active)
		if (showInfrastructure) {
		CHOKEPOINTS.forEach((cp) => {
			const [x, y] = projection([cp.lon, cp.lat]) || [0, 0];
			if (x && y) {
				const size = 3 * inverseScale;
				// Draw diamond (rotated square) using path instead of rect
				mapGroup
					.append('circle')
					.attr('class', 'map-icon')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', size)
					.attr('fill', '#00aaff')
					.attr('opacity', 0.8);
				if (showLabels) {
				mapGroup
					.append('text')
					.attr('class', 'map-icon')
					.attr('x', x + 8 * inverseScale)
					.attr('y', y + 3 * inverseScale)
					.attr('fill', '#00aaff')
					.attr('font-size', `${7 * inverseScale}px`)
					.attr('font-family', 'monospace')
					.text(cp.name);
				}
				mapGroup
					.append('circle')
					.attr('class', 'map-icon hotspot-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 10 * inverseScale)
					.attr('fill', 'transparent')
					.on('mouseenter', (event: MouseEvent) => showTooltip(event, `⬥ ${cp.desc}`, '#00aaff'))
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});

		// Draw cable landings
		CABLE_LANDINGS.forEach((cl) => {
			const [x, y] = projection([cl.lon, cl.lat]) || [0, 0];
			if (x && y) {
				mapGroup
					.append('circle')
					.attr('class', 'map-icon')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 3 * inverseScale)
					.attr('fill', 'none')
					.attr('stroke', '#aa44ff')
					.attr('stroke-width', 1.5 * inverseScale);
				mapGroup
					.append('circle')
					.attr('class', 'map-icon hotspot-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 10 * inverseScale)
					.attr('fill', 'transparent')
					.on('mouseenter', (event: MouseEvent) => showTooltip(event, `◎ ${cl.desc}`, '#aa44ff'))
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});

		// Draw nuclear sites
		NUCLEAR_SITES.forEach((ns) => {
			const [x, y] = projection([ns.lon, ns.lat]) || [0, 0];
			if (x && y) {
				mapGroup
					.append('circle')
					.attr('class', 'map-icon')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 2 * inverseScale)
					.attr('fill', '#ffff00');
				mapGroup
					.append('circle')
					.attr('class', 'map-icon')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 5 * inverseScale)
					.attr('fill', 'none')
					.attr('stroke', '#ffff00')
					.attr('stroke-width', 1 * inverseScale)
					.attr('stroke-dasharray', `${3 * inverseScale},${3 * inverseScale}`);
				mapGroup
					.append('circle')
					.attr('class', 'map-icon hotspot-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 10 * inverseScale)
					.attr('fill', 'transparent')
					.on('mouseenter', (event: MouseEvent) => showTooltip(event, `☢ ${ns.desc}`, '#ffff00'))
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});

		// Draw military bases
		MILITARY_BASES.forEach((mb) => {
			const [x, y] = projection([mb.lon, mb.lat]) || [0, 0];
			if (x && y) {
				const s = inverseScale;
				const starPath = `M${x},${y - 5 * s} L${x + 1.5 * s},${y - 1.5 * s} L${x + 5 * s},${y - 1.5 * s} L${x + 2.5 * s},${y + 1 * s} L${x + 3.5 * s},${y + 5 * s} L${x},${y + 2.5 * s} L${x - 3.5 * s},${y + 5 * s} L${x - 2.5 * s},${y + 1 * s} L${x - 5 * s},${y - 1.5 * s} L${x - 1.5 * s},${y - 1.5 * s} Z`;
				mapGroup.append('path').attr('class', 'map-icon').attr('d', starPath).attr('fill', '#ff00ff').attr('opacity', 0.8);
				mapGroup
					.append('circle')
					.attr('class', 'map-icon hotspot-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 10 * inverseScale)
					.attr('fill', 'transparent')
					.on('mouseenter', (event: MouseEvent) => showTooltip(event, `★ ${mb.desc}`, '#ff00ff'))
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});
		} // End infrastructure filter

		// Draw hotspots when toggle is on
		// At low zoom, only show critical/high hotspots
		if (showHotspots) {
		const showAllHotspots = currentZoomScale >= ZOOM_THRESHOLDS.showAllHotspots;
		HOTSPOTS.forEach((h) => {
			// At lowest zoom, only show critical hotspots
			if (!showAllHotspots && h.level !== 'critical') return;
			
			const [x, y] = projection([h.lon, h.lat]) || [0, 0];
			if (x && y) {
				const color = THREAT_COLORS[h.level];
				// Pulsing circle
				mapGroup
					.append('circle')
					.attr('class', 'map-icon pulse')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 3 * inverseScale)
					.attr('fill', color)
					.attr('fill-opacity', 0.15);
				// Inner dot
				mapGroup.append('circle').attr('class', 'map-icon').attr('cx', x).attr('cy', y).attr('r', 1.5 * inverseScale).attr('fill', color).attr('fill-opacity', 0.7);
				// Label - only show when zoomed in enough
				if (showLabels) {
				mapGroup
					.append('text')
					.attr('class', 'map-icon')
					.attr('x', x + 6 * inverseScale)
					.attr('y', y + 2 * inverseScale)
					.attr('fill', color)
					.attr('fill-opacity', 0.6)
					.attr('font-size', `${6 * inverseScale}px`)
					.attr('font-family', 'monospace')
					.text(h.name);
				}
				// Hit area
				mapGroup
					.append('circle')
					.attr('class', 'map-icon hotspot-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 12 * inverseScale)
					.attr('fill', 'transparent')
					.on('click', (event: MouseEvent) => {
						event.stopPropagation();
						showHotspotDetails(h);
					})
					.on('mouseenter', (event: MouseEvent) =>
						showEnhancedTooltip(event, h.name, h.lat, h.lon, h.desc, color)
					)
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});
		} // End hotspots filter

		// Draw live GDELT conflict events (filtered by type)
		// At low zoom, only show critical/high severity conflicts
		const showAllConflicts = currentZoomScale >= ZOOM_THRESHOLDS.showAllConflicts;
		
		// Show "No GDELT results" message if empty
		if (gdeltConflicts.length === 0 && !conflictsLoading) {
			// No conflicts to draw - this is normal if GDELT returns no results
		}
		
		// Prepare filtered list of conflicts based on toggle
		let conflictsToDisplay: GdeltConflictEvent[] = [];

		if (showEvents) {
			if (!showAllConflicts) {
				// Zoomed out - show only top 5 critical conflicts by article count
				conflictsToDisplay = [...gdeltConflicts]
					.filter(c => c.severity === 'critical')
					.sort((a, b) => b.numArticles - a.numArticles)
					.slice(0, 5);
			} else {
				conflictsToDisplay = gdeltConflicts;
			}
		}
		
		conflictsToDisplay.forEach((conflict) => {
			const [x, y] = projection([conflict.lon, conflict.lat]) || [0, 0];
			if (x && y) {
				const color = THREAT_COLORS[conflict.severity];
				const size = conflict.severity === 'critical' ? 8 : conflict.severity === 'high' ? 6 : 5;
				
				// Icon based on type
				let icon = '⚠';
				if (conflict.type === 'conflict') icon = '⚔';
				else if (conflict.type === 'crisis') icon = '🚨';
				else if (conflict.type === 'tension') icon = '⚡';
				else if (conflict.type === 'development') icon = '📍';

				// Pulsing ring for active conflicts
				if (conflict.status === 'active') {
					mapGroup
						.append('circle')
						.attr('class', 'map-icon conflict-pulse')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 5 * inverseScale)
						.attr('fill', 'none')
						.attr('stroke', color)
						.attr('stroke-width', 1 * inverseScale)
						.attr('stroke-opacity', 0.3);
				}

				// Icon marker
				mapGroup
					.append('text')
					.attr('class', 'map-icon conflict-icon')
					.attr('x', x)
					.attr('y', y + 3 * inverseScale)
					.attr('text-anchor', 'middle')
					.attr('font-size', `${7 * inverseScale}px`)
					.attr('fill', color)
					.attr('fill-opacity', 0.7)
					.attr('stroke', '#000')
					.attr('stroke-width', 0.3 * inverseScale)
					.text(icon);

				// Label - use location name, truncated (only when zoomed in)
				if (showLabels) {
				const label = conflict.name.length > 20 
					? conflict.name.substring(0, 18) + '...' 
					: conflict.name;
				mapGroup
					.append('text')
					.attr('class', 'map-icon conflict-label')
					.attr('x', x)
					.attr('y', y - 8 * inverseScale)
					.attr('text-anchor', 'middle')
					.attr('fill', color)
					.attr('fill-opacity', 0.5)
					.attr('font-size', `${5.5 * inverseScale}px`)
					.attr('font-family', 'monospace')
					.attr('font-weight', 'normal')
					.text(label);
				}

				// Hit area for tooltip and click
				mapGroup
					.append('circle')
					.attr('class', 'map-icon conflict-hit')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 15 * inverseScale)
					.attr('fill', 'transparent')
					.on('click', (event: MouseEvent) => {
						event.stopPropagation();
						showGdeltConflictDetails(conflict);
					})
					.on('mouseenter', (event: MouseEvent) => {
						const tooltipLines = [
							`${conflict.numArticles} articles`,
							`Type: ${conflict.type.toUpperCase()}`,
							conflict.eventCodeDescription,
							'Click for details'
						].filter(Boolean);
						showTooltip(event, `${icon} ${conflict.name}`, color, tooltipLines);
					})
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});
	}

	// Draw custom monitor locations
	function drawMonitors(): void {
		if (!mapGroup || !projection) return;

		// Remove existing monitor markers
		mapGroup.selectAll('.monitor-marker').remove();

		const inverseScale = 1 / currentZoomScale;

		monitors
			.filter((m) => m.enabled && m.location)
			.forEach((m) => {
				if (!m.location) return;
				const [x, y] = projection([m.location.lon, m.location.lat]) || [0, 0];
				if (x && y) {
					const color = m.color || '#00ffff';
					mapGroup
						.append('circle')
						.attr('class', 'monitor-marker')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 5 * inverseScale)
						.attr('fill', color)
						.attr('fill-opacity', 0.6)
						.attr('stroke', color)
						.attr('stroke-width', 2 * inverseScale);
					mapGroup
						.append('text')
						.attr('class', 'monitor-marker')
						.attr('x', x + 8 * inverseScale)
						.attr('y', y + 3 * inverseScale)
						.attr('fill', color)
						.attr('font-size', `${8 * inverseScale}px`)
						.attr('font-family', 'monospace')
						.text(m.name);
					mapGroup
						.append('circle')
						.attr('class', 'monitor-marker')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10 * inverseScale)
						.attr('fill', 'transparent')
						.on('mouseenter', (event: MouseEvent) =>
							showTooltip(event, `📡 ${m.name}`, color, [
								m.location?.name || '',
								m.keywords.join(', ')
							])
						)
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});
	}

	// Draw news clusters on map
	function drawNewsClusters(): void {
		if (!mapGroup || !projection) return;

		// Remove existing cluster markers
		mapGroup.selectAll('.news-cluster').remove();

		// Skip drawing if news toggle is off
		if (!showNews) return;

		const clusters = typeof newsClusters === 'function' ? newsClusters() : newsClusters;

		// Apply inverse scaling to maintain consistent visual size regardless of zoom
		const scale = currentZoomScale;
		const inverseScale = 1 / scale;
		
		// Determine minimum cluster size based on zoom level
		const showSmallClusters = scale >= ZOOM_THRESHOLDS.showSmallClusters;
		const minClusterSize = showSmallClusters ? 1 : 2; // At low zoom, show clusters with 2+ items for better visibility

		clusters.forEach((cluster) => {
			// Skip small clusters when zoomed out
			if (cluster.count < minClusterSize) return;

			// Only show clusters with alerts or multiple items (important news)
			if (cluster.alertCount === 0 && cluster.count < 3) return;

			const [x, y] = projection([cluster.lon, cluster.lat]) || [0, 0];
			if (!x || !y) return;

			// Determine color based on alert ratio
			const alertRatio = cluster.alertCount / cluster.count;
			let color = '#00aaff'; // Default blue
			if (alertRatio > 0.5) color = '#ff4444'; // Red for mostly alerts
			else if (alertRatio > 0.2) color = '#ffaa00'; // Orange for some alerts
			else if (cluster.alertCount > 0) color = '#ffcc00'; // Yellow for any alerts

			// Size based on count (min 4, max 10) - scaled inversely to zoom
			const baseRadius = Math.min(10, Math.max(4, 4 + cluster.count * 0.25));
			const radius = baseRadius * inverseScale;
			const strokeWidth = 1 * inverseScale;
			const fontSize = (baseRadius > 6 ? 5 : 4) * inverseScale;

			// Outer pulsing circle for high-alert clusters
			if (cluster.alertCount >= 3) {
				mapGroup
					.append('circle')
					.attr('class', 'news-cluster pulse-ring')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', (baseRadius + 4) * inverseScale)
					.attr('fill', 'none')
					.attr('stroke', color)
					.attr('stroke-width', 1 * inverseScale)
					.attr('stroke-opacity', 0.2);
			}

			// Main cluster circle
			mapGroup
				.append('circle')
				.attr('class', 'news-cluster')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', radius)
				.attr('fill', color)
				.attr('fill-opacity', 0.4)
				.attr('stroke', '#fff')
				.attr('stroke-width', strokeWidth)
				.attr('stroke-opacity', 0.5)
				.style('cursor', 'pointer');

			// Count label
			mapGroup
				.append('text')
				.attr('class', 'news-cluster')
				.attr('x', x)
				.attr('y', y)
			.attr('dominant-baseline', 'middle')
				.attr('text-anchor', 'middle')
				.attr('fill', '#fff')
				.attr('font-size', `${fontSize}px`)
				.attr('font-weight', 'bold')
				.attr('font-family', 'monospace')
				.attr('pointer-events', 'none')
				.text(cluster.count);

			// Hit area for tooltip and click
			mapGroup
				.append('circle')
				.attr('class', 'news-cluster')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', (baseRadius + 4) * inverseScale)
				.attr('fill', 'transparent')
				.style('cursor', 'pointer')
				.on('click', (event: MouseEvent) => {
					event.stopPropagation();
					showNewsClusterDetails(cluster);
				})
				.on('mouseenter', (event: MouseEvent) => {
					const recentItems = cluster.items.slice(0, 3);
					const lines = recentItems.map(
						(item) => `${item.isAlert ? '⚠️' : '📰'} ${item.title.slice(0, 50)}...`
					);
					if (cluster.items.length > 3) {
						lines.push(`+${cluster.items.length - 3} more...`);
					}
					lines.push('Click for details');
					showTooltip(
						event,
						`${cluster.region.toUpperCase()} (${cluster.count} news, ${cluster.alertCount} alerts)`,
						color,
						lines
					);
				})
				.on('mousemove', moveTooltip)
				.on('mouseleave', hideTooltip);
		});
	}

	// Update conflict zone opacity based on news intensity
	function updateConflictZoneIntensity(): void {
		if (!mapGroup) return;

		const intensity = typeof conflictIntensity === 'function' ? conflictIntensity() : conflictIntensity;

		mapGroup.selectAll('.conflict-zone').each(function (this: SVGPathElement) {
			const zoneName = this.getAttribute('data-zone');
			if (!zoneName) return;

			const newsCount = intensity.get(zoneName) || 0;
			// Base opacity 0.15, max 0.5 based on news count
			const opacity = Math.min(0.5, 0.15 + newsCount * 0.03);

			if (d3Module) {
				d3Module.select(this).attr('fill-opacity', opacity);
			}
		});
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

	function handleSearchInput(query: string): void {
		searchQuery = query;
		if (query.trim().length === 0) {
			searchResults = [];
			showSearchResults = false;
			return;
		}

		// Get all country names from the config and filter by search query
		const allCountries = Object.values(COUNTRY_ID_TO_NAME);
		const filtered = allCountries.filter((name) =>
			name.toLowerCase().includes(query.toLowerCase())
		);
		searchResults = filtered.slice(0, 10); // Limit to 10 results
		showSearchResults = filtered.length > 0;
	}

	function selectCountryFromSearch(countryName: string): void {
		selectedCountry.select(countryName);
		searchQuery = '';
		searchResults = [];
		showSearchResults = false;
	}

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
			updateConflictZoneIntensity();
		}
	});

	// Reactively update country highlighting when selected country changes
	$effect(() => {
		// Access reactive state to trigger effect when it changes
		const selectedName = selectedCountryState.name;
		applyCountryHighlight(selectedName);
	});

	// Fetch GDELT conflict events
	async function loadGdeltConflicts(): Promise<void> {
		conflictsLoading = true;
		conflictsError = null;
		
		try {
			const events = await fetchConflictEventsFromGDELT({
				timespan: '48h',
				maxRecords: 250
			});
			
			gdeltConflicts = events;
			
			// Redraw map icons if map is initialized
			if (mapGroup && projection) {
				drawMapIcons();
			}
		} catch (err) {
			conflictsError = err instanceof Error ? err.message : 'Failed to load conflict data';
			console.error('GDELT Conflicts error:', err);
		} finally {
			conflictsLoading = false;
		}
	}

	onMount(() => {
		initMap();
		// Load GDELT conflict events
		loadGdeltConflicts();
		
		// Refresh conflicts every 5 minutes
		const conflictRefreshInterval = setInterval(loadGdeltConflicts, 5 * 60 * 1000);
		
		return () => {
			clearInterval(conflictRefreshInterval);
		};
	});
</script>

<Panel id="map" title="World Map" {error}>
	<div class="map-container" bind:this={mapContainer}>
		<svg class="map-svg"></svg>
		{#if tooltipVisible && tooltipContent}
			<div
				class="map-tooltip"
				style="left: {tooltipPosition.left}px; top: {tooltipPosition.top}px;"
			>
				<strong style="color: {tooltipContent.color}">{tooltipContent.title}</strong>
				{#each tooltipContent.lines as line}
					<br /><span class="tooltip-line">{line}</span>
				{/each}
			</div>
		{/if}
		<div class="search-container">
			<input
				type="text"
				class="country-search"
				placeholder="Search countries..."
				value={searchQuery}
				oninput={(e) => handleSearchInput(e.currentTarget.value)}
				onfocus={() => searchResults.length > 0 && (showSearchResults = true)}
			/>
			{#if showSearchResults && searchResults.length > 0}
				<div class="search-results">
					{#each searchResults as country}
						<button
							class="search-result-item"
							onclick={() => selectCountryFromSearch(country)}
						>
							{country}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="zoom-controls">
			<button class="zoom-btn" onclick={zoomIn} title="Zoom in">+</button>
			<button class="zoom-btn" onclick={zoomOut} title="Zoom out">−</button>
			<button class="zoom-btn" onclick={resetZoom} title="Reset">⟲</button>
			{#if selectedCountryState.name}
				<button class="zoom-btn clear-btn" onclick={() => selectedCountry.clear()} title="Clear selection">×</button>
			{/if}
		</div>
		<div class="map-legend">
			<button
				class="legend-btn"
				class:active={showEvents}
				onclick={() => { showEvents = !showEvents; drawMapIcons(); }}
				title="GDELT Events"
			>
				⚔
			</button>
			<button
				class="legend-btn"
				class:active={showHotspots}
				onclick={() => { showHotspots = !showHotspots; drawMapIcons(); }}
				title="Hotspots"
			>
				<span class="legend-dot hotspot"></span>
			</button>
			<button
				class="legend-btn"
				class:active={showNews}
				onclick={() => { showNews = !showNews; drawNewsClusters(); }}
				title="News"
			>
				<span class="legend-dot news"></span>
			</button>
			<div class="legend-status" title="GDELT events">
				{#if conflictsLoading}
					<span class="status-loading">⟳</span>
				{:else if conflictsError}
					<span class="status-error">!</span>
				{:else}
					<span class="status-ok">{gdeltConflicts.length}</span>
				{/if}
			</div>
		</div>

		<!-- Live Event Feed Ticker -->
		{#if liveEvents.length > 0}
			<div class="live-ticker">
				<div class="ticker-label">LIVE</div>
				<div class="ticker-content">
					<div class="ticker-scroll">
						{#each liveEvents as event (event.id)}
							<a
								href={event.link}
								target="_blank"
								rel="noopener noreferrer"
								class="ticker-item"
								class:critical={event.alertKeyword && ['war', 'attack', 'missile', 'nuclear', 'invasion'].some(k => event.alertKeyword?.includes(k))}
							>
								<span class="ticker-region">{event.region.toUpperCase()}</span>
								<span class="ticker-title">{event.title}</span>
								<span class="ticker-time">{timeAgo(event.timestamp)}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Panel>

<!-- Detail Modal -->
{#if showDetailModal}
	<div class="detail-modal-overlay" onclick={closeDetailModal}>
		<div class="detail-modal" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeDetailModal}>×</button>
			
			{#if selectedConflict}
				<div class="modal-header" style="border-color: {THREAT_COLORS[selectedConflict.severity]}">
					<div class="modal-icon">
						{#if selectedConflict.type === 'conflict'}⚔{:else if selectedConflict.type === 'crisis'}🚨{:else if selectedConflict.type === 'tension'}⚡{:else}📍{/if}
					</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedConflict.name}</h3>
						<div class="modal-badges">
							<span class="badge badge-{selectedConflict.severity}">{selectedConflict.severity.toUpperCase()}</span>
							<span class="badge badge-status">{selectedConflict.status.toUpperCase()}</span>
							<span class="badge badge-type">{selectedConflict.type.toUpperCase()}</span>
						</div>
					</div>
				</div>
				
				<div class="modal-body">
					<div class="info-section">
						<h4>Description</h4>
						<p>{selectedConflict.description}</p>
					</div>
					
					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Started</div>
							<div class="info-value">{selectedConflict.startDate}</div>
						</div>
						<div class="info-item">
							<div class="info-label">Last Updated</div>
							<div class="info-value">{selectedConflict.lastUpdate}</div>
						</div>
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">{selectedConflict.lat.toFixed(2)}°, {selectedConflict.lon.toFixed(2)}°</div>
						</div>
						{#if selectedConflict.casualties}
							<div class="info-item">
								<div class="info-label">Casualties</div>
								<div class="info-value">{selectedConflict.casualties}</div>
							</div>
						{/if}
					</div>
					
					<div class="info-section">
						<h4>Parties Involved</h4>
						<div class="parties-list">
							{#each selectedConflict.parties as party}
								<span class="party-tag">{party}</span>
							{/each}
						</div>
					</div>
					
					<div class="info-section">
						<h4>Keywords</h4>
						<div class="keywords-list">
							{#each selectedConflict.keywords as keyword}
								<span class="keyword-tag">{keyword}</span>
							{/each}
						</div>
					</div>
				</div>
			{:else if selectedGdeltConflict}
				<div class="modal-header" style="border-color: {THREAT_COLORS[selectedGdeltConflict.severity]}">
					<div class="modal-icon">
						{#if selectedGdeltConflict.type === 'conflict'}⚔{:else if selectedGdeltConflict.type === 'crisis'}🚨{:else if selectedGdeltConflict.type === 'tension'}⚡{:else}📍{/if}
					</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedGdeltConflict.name}</h3>
						<div class="modal-badges">
							<span class="badge badge-{selectedGdeltConflict.severity}">{selectedGdeltConflict.severity.toUpperCase()}</span>
							<span class="badge badge-type">{selectedGdeltConflict.type.toUpperCase()}</span>
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

					<div class="info-section">
						<h4>Event Summary</h4>
						<p class="summary-text">{selectedGdeltConflict.description}</p>
						<div class="event-code-info">
							<strong>Type:</strong> {selectedGdeltConflict.eventCodeDescription}
						</div>
					</div>
					
					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">{selectedGdeltConflict.lat.toFixed(2)}°, {selectedGdeltConflict.lon.toFixed(2)}°</div>
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
									<a href={article.url} target="_blank" rel="noopener noreferrer" class="news-item-card">
										<div class="news-item-header">
											<span class="news-source">{article.source || 'News Source'}</span>
											<span class="news-icon">↗</span>
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
								<a href={selectedGdeltConflict.sourceUrl} target="_blank" rel="noopener noreferrer" class="source-link">
									View Original Article →
								</a>
							{:else}
								<p class="no-source">No source URL available</p>
							{/if}
						</div>
					{/if}
					
					<div class="info-section gdelt-attribution">
						<p>Data sourced from <a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer">GDELT Project</a></p>
					</div>
				</div>
			{:else if selectedHotspot}
				<div class="modal-header" style="border-color: {THREAT_COLORS[selectedHotspot.level]}">
					<div class="modal-icon">📍</div>
					<div class="modal-title-group">
						<h3 class="modal-title">{selectedHotspot.name}</h3>
						<div class="modal-badges">
							<span class="badge badge-{selectedHotspot.level}">{selectedHotspot.level.toUpperCase()}</span>
						</div>
					</div>
				</div>
				
				<div class="modal-body">
					<div class="info-section">
						<h4>Information</h4>
						<p>{selectedHotspot.desc}</p>
					</div>
					
					<div class="info-grid">
						<div class="info-item">
							<div class="info-label">Location</div>
							<div class="info-value">{selectedHotspot.lat.toFixed(2)}°, {selectedHotspot.lon.toFixed(2)}°</div>
						</div>
						<div class="info-item">
							<div class="info-label">Threat Level</div>
							<div class="info-value">{selectedHotspot.level}</div>
						</div>
					</div>
				</div>
			{:else if selectedNewsCluster}
				{@const alertRatio = selectedNewsCluster.alertCount / selectedNewsCluster.count}
				{@const color = alertRatio > 0.5 ? '#ff4444' : alertRatio > 0.2 ? '#ffaa00' : alertRatio > 0 ? '#ffcc00' : '#00aaff'}
				<div class="modal-header" style="border-color: {color}">
					<div class="modal-icon">📰</div>
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
							<div class="info-value">{selectedNewsCluster.lat.toFixed(2)}°, {selectedNewsCluster.lon.toFixed(2)}°</div>
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
								<a href={item.link} target="_blank" rel="noopener noreferrer" class="news-item-card">
									<div class="news-item-header">
										<span class="news-icon">{item.isAlert ? '⚠️' : '📰'}</span>
										<span class="news-source">{item.source}</span>
										<span class="news-time">{timeAgo(item.timestamp)}</span>
									</div>
									<div class="news-item-title">{item.title}</div>
									{#if item.description}
										<div class="news-item-snippet">{item.description.length > 150 ? item.description.substring(0, 150) + '...' : item.description}</div>
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

	.search-container {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		width: 140px;
	}

	.country-search {
		padding: 0.35rem 0.5rem;
		background: rgba(0, 0, 0, 0.75);
		border: 1px solid #333;
		border-radius: 4px;
		color: #aaa;
		font-size: 0.6rem;
		outline: none;
		width: 100%;
		box-sizing: border-box;
		backdrop-filter: blur(4px);
	}

	.country-search:focus {
		border-color: #00cc66;
		background: rgba(20, 20, 20, 0.98);
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(10, 10, 10, 0.98);
		border: 1px solid #333;
		border-top: none;
		border-radius: 0 0 4px 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 51;
	}

	.search-result-item {
		display: block;
		width: 100%;
		padding: 0.5rem;
		background: none;
		border: none;
		border-bottom: 1px solid #222;
		color: #aaa;
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.search-result-item:last-child {
		border-bottom: none;
	}

	.search-result-item:hover {
		background: rgba(0, 204, 102, 0.2);
		color: #00cc66;
	}

	.map-tooltip {
		position: absolute;
		background: rgba(10, 10, 10, 0.95);
		border: 1px solid #333;
		border-radius: 4px;
		padding: 0.5rem;
		font-size: 0.65rem;
		color: #ddd;
		max-width: 250px;
		pointer-events: none;
		z-index: 100;
	}

	.tooltip-line {
		opacity: 1;
		color: #fff;
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

	.zoom-btn:hover {
		background: rgba(40, 40, 40, 0.9);
		color: #fff;
	}

	.clear-btn {
		background: rgba(100, 30, 30, 0.9);
		color: #ff8888;
	}

	.clear-btn:hover {
		background: rgba(150, 40, 40, 0.9);
		color: #ffbbbb;
	}

	.map-legend {
		position: absolute;
		bottom: 36px;
		left: 0.5rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2px;
		background: rgba(0, 0, 0, 0.75);
		padding: 4px 6px;
		border-radius: 4px;
		backdrop-filter: blur(4px);
	}

	.legend-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: #666;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		border-radius: 3px;
		transition: all 0.15s ease;
		font-size: 0.8rem;
		opacity: 0.55;
		line-height: 1;
	}

	.legend-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #aaa;
	}

	.legend-btn.active {
		background: rgba(68, 255, 136, 0.25);
		color: #44ff88;
		opacity: 1;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		opacity: 0.5;
	}

	.legend-dot.hotspot {
		background: #ff4444;
	}

	.legend-dot.news {
		background: #44ff88;
	}

	.legend-btn.active .legend-dot {
		opacity: 1;
	}

	.legend-status {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 20px;
		font-size: 0.55rem;
		font-weight: 700;
		font-family: monospace;
		text-align: center;
		padding: 0 3px;
		border-left: 1px solid rgba(255, 255, 255, 0.15);
		color: #888;
	}

	.status-loading {
		color: #ffaa00;
		animation: pulse-text 1.5s ease-in-out infinite;
	}

	@keyframes pulse-text {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	.status-error {
		color: #ff4444;
	}

	.status-empty {
		color: #666;
		font-style: italic;
	}

	.status-ok {
		color: #44ff88;
	}

	/* Pulse animation for hotspots */
	:global(.pulse) {
		animation: pulse 3s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			r: 4;
			opacity: 0.15;
		}
		50% {
			r: 6;
			opacity: 0.05;
		}
	}

	/* Conflict pulse animation */
	:global(.conflict-pulse) {
		animation: conflict-pulse 3s ease-in-out infinite;
	}

	@keyframes conflict-pulse {
		0%,
		100% {
			r: 7;
			stroke-opacity: 0.3;
		}
		50% {
			r: 10;
			stroke-opacity: 0.1;
		}
	}

	:global(.conflict-icon) {
		pointer-events: none;
	}

	:global(.conflict-label) {
		pointer-events: none;
	}

	:global(.conflict-hit) {
		cursor: pointer;
	}

	/* Pulse ring for high-alert clusters */
	:global(.pulse-ring) {
		animation: pulse-ring 1.5s ease-out infinite;
	}

	@keyframes pulse-ring {
		0% {
			stroke-opacity: 0.3;
			r: 14;
		}
		100% {
			stroke-opacity: 0;
			r: 22;
		}
	}

	:global(.hotspot-hit) {
		cursor: pointer;
	}

	/* Selected country highlight with glow effect */
	:global(.country-selected) {
		filter: drop-shadow(0 0 6px rgba(34, 255, 153, 0.6));
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
		0%, 100% {
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
		gap: 2rem;
		animation: ticker-scroll 30s linear infinite;
		white-space: nowrap;
	}

	.ticker-scroll:hover {
		animation-play-state: paused;
	}

	@keyframes ticker-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-100%);
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
		font-size: 1.5rem;
		line-height: 1;
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
		font-size: 2.5rem;
		line-height: 1;
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
		display: inline-block;
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
		font-size: 0.9rem;
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

