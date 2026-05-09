<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import MapOL from '$lib/components/landmark-busstop-components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { tileProviders } from '$lib/stores/tile-providers';
	import type { TileProvider } from '$lib/types/type';
	import MapTileProviderManager from './MapTileProviderManager.svelte';
	import { parseCoordinateString } from '$lib/utils/openlayers.utils';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';
	import toast from '$lib/utils/toast';

	//-- props --
	export let center = { lat: 8.891048, lng: 76.58536 };
	export let boundary: any = null;
	export let landmarks: any[] = [];
	export let busStops: any[] = [];
	export let selectedLandmarkId: string | null = null;
	//-- When false, hide pencil/eraser controls (used when MapPreview is embedded in readonly detail sidebar) --
	export let showDrawingControls: boolean = true;
	//-- When true, MapPreview is embedded in readonly detail sidebar --
	export let isSidebarLayout: boolean = false;
	//-- ID of bus stop currently being edited (for drag interaction) --
	export let editingBusStopId: string | null = null;
	//-- When false, skip fitting the map to all landmarks on updates (for viewport-based fetching) --
	export let autoFitLandmarks: boolean = true;

	//-- variables --
	let mapRef: any;
	//-- Container div for map --
	let mapContainer: HTMLDivElement;
	//-- Fullscreen/expanded state --
	let isMapExpanded = false;
	const dispatch = createEventDispatcher();

	//-- drawing overlay state --
	let isDrawing = false;
	let isDrawingPoint = false;

	//-- Bus stop location WKT --
	let busStopLocationWkt: string | null = null;

	let pointerLonLat: [number, number] | null = null;
	let areaDisplay: string | null = null;

	//-- Track which landmark is overlapping during drawing (to show square on map) --
	let overlappingLandmarkId: string | null = null;
	//-- Track drawn rectangle coordinates when there's overlap (to show drawn square on map) --
	let drawnRectCoords: number[][] | null = null;

	//-- Search state --
	let searchTerm = '';
	let isSearching = false;
	let searchResults: Array<{ name: string; lat: number; lon: number }> = [];
	let showSearchResults = false;
	//-- Ref to the search container to avoid repeated DOM queries --
	let searchContainerRef: HTMLElement | null = null;
	//-- Nominatim rate limiting (client-side): enforce minimum interval between API calls --
	const NOMINATIM_MIN_INTERVAL = 1000; //-- ms --
	let lastNominatimAt = 0;
	let pendingNominatimTimer: ReturnType<typeof setTimeout> | null = null;
	//-- Debounce search input --
	let searchTimeout: ReturnType<typeof setTimeout>;
	//-- Timer for auto-enable drawing (cleared on unmount) --
	let autoDrawingTimer: ReturnType<typeof setTimeout> | null = null;

	//-- Tile provider state --
	// Note: initialize `providers` synchronously from the store to avoid SSR/hydration issues.
	let providers: TileProvider[] = [];
	let selectedProviderName: string = tileProviders.getDefaultProvider().name;
	//-- Provider management UI state --
	let showProviderPanel = false;

	//-- Reactive: get selected provider details --
	$: selectedProvider = providers.find((p) => p.name === selectedProviderName) || providers[0];
	$: providerUrl = selectedProvider?.url || '';
	$: providerAttribution = selectedProvider?.attribution || '';
	$: providerMaxZoom = selectedProvider?.maxZoom || 19;

	let isLargeScreen = false;
	let showExpanded = false;

	//-- Automatically disable bus stop drawing when edit mode is enabled --
	$: if (showDrawingControls && isDrawingPoint) {
		mapRef?.stopDrawing?.();
		isDrawingPoint = false;
	}

	//-- Search for a place using Nominatim (OpenStreetMap geocoding) --
	async function searchPlace(query: string) {
		if (!query || query.trim().length < 2) {
			searchResults = [];
			showSearchResults = false;
			return;
		}
		//-- Check if input is coordinates. Accepts several formats (handled by parseCoordinates util):
		// - labeled: "lat: 10, lon: 20"
		// - directional: "10N, 20E" or "10 N 20 E"
		// - simple numeric pair: "lat, lon" (assumed order). If ambiguous (both values within [-90,90])
		// we assume input is in "lat, lon" order to avoid ambiguous flipping. --
		const coords = parseCoordinateString(query);
		if (coords) {
			searchResults = [
				{ name: `Coordinates: ${coords.lat}, ${coords.lon}`, lat: coords.lat, lon: coords.lon }
			];
			showSearchResults = true;
			return;
		}

		// schedule a Nominatim search that enforces a minimum interval between requests
		scheduleNominatimSearch(query);
		return;
	}

	//-- Handle search result selection --
	function selectSearchResult(result: { name: string; lat: number; lon: number }) {
		mapRef?.panTo?.(result.lon, result.lat, 16);
		mapRef?.setSearchMarker?.(result.lon, result.lat, result.name);
		showSearchResults = false;
		searchTerm = result.name;
	}
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchPlace(searchTerm), SEARCH_DEBOUNCE_DELAY);
	}

	//-- Perform the actual Nominatim fetch (updates `searchResults`) --
	async function performNominatimSearch(query: string) {
		isSearching = true;
		try {
			//-- Browsers block setting `User-Agent`; proxy server-side to set UA. --
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
				{ headers: { 'Accept-Language': 'en' } }
			);

			if (!response.ok) {
				console.error('Nominatim API error', response.status, response.statusText);
				searchResults = [];
				showSearchResults = false;
				return;
			}

			const data = await response.json();
			searchResults = data.map((item: any) => ({
				name: item.display_name,
				lat: parseFloat(item.lat),
				lon: parseFloat(item.lon)
			}));
			showSearchResults = searchResults.length > 0;
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
			showSearchResults = false;
		} finally {
			isSearching = false;
			lastNominatimAt = Date.now();
		}
	}

	//-- Schedule a Nominatim search enforcing `NOMINATIM_MIN_INTERVAL` between requests --
	function scheduleNominatimSearch(query: string) {
		const now = Date.now();
		const elapsed = now - lastNominatimAt;
		if (pendingNominatimTimer) {
			clearTimeout(pendingNominatimTimer);
			pendingNominatimTimer = null;
		}
		if (elapsed >= NOMINATIM_MIN_INTERVAL) {
			// safe to call immediately
			performNominatimSearch(query);
		} else {
			// schedule to run after remaining interval
			const wait = NOMINATIM_MIN_INTERVAL - elapsed;
			pendingNominatimTimer = setTimeout(() => {
				pendingNominatimTimer = null;
				performNominatimSearch(query);
			}, wait);
		}
	}

	//-- Close search results when clicking outside --
	function handleClickOutside(event: MouseEvent) {
		if (searchContainerRef && !searchContainerRef.contains(event.target as Node)) {
			showSearchResults = false;
		}
	}

	//-- Stop point drawing when a bus stop is being edited --
	$: if (editingBusStopId && isDrawingPoint) {
		mapRef?.stopDrawing?.();
		isDrawingPoint = false;
	}

	//-- functions --

	//-- Toggle map between expanded and normal modes --
	function toggleMapToFullscreen() {
		if (!browser) return;
		isMapExpanded = !isMapExpanded;
		setTimeout(() => mapRef?.updateSize?.(), 120);
	}

	//-- Handle "Add Landmark" button click for fullscreen mode (button is inside map preview when map is expanded)--
	function handleAddLandmarkClick() {
		dispatch('addLandmark');
	}

	//-- Format area in m² to human-readable string --
	function formatArea(areaM2: number) {
		if (areaM2 === null || areaM2 === undefined) return null;
		if (areaM2 >= 1000000) {
			return (areaM2 / 1000000).toFixed(3) + ' km²';
		}
		if (areaM2 >= 1) {
			return areaM2.toFixed(2) + ' m²';
		}
		return (areaM2 * 10000).toFixed(2) + ' cm²';
	}

	//-- Check screen size --
	function checkScreenSize() {
		if (browser) {
			isLargeScreen = window.innerWidth > DESKTOP_BREAKPOINT;
			if (isLargeScreen) {
				showExpanded = true;
			}
		}
	}

	//-- Handle provider removal event from ProviderManager --
	function handleProviderRemoved(event: CustomEvent<{ name: string }>) {
		if (selectedProviderName === event.detail.name) {
			selectedProviderName = tileProviders.getDefaultProvider().name;
		}
	}

	onMount(() => {
		if (browser) {
			checkScreenSize();
			window.addEventListener('resize', checkScreenSize);
			window.addEventListener('click', handleClickOutside);

			//-- Subscribe to providers store changes --
			const unsubscribe = tileProviders.subscribe((value) => {
				providers = value;
				//-- Ensure selected provider still exists --
				if (!providers.find((p) => p.name === selectedProviderName)) {
					selectedProviderName = providers[0]?.name || tileProviders.getDefaultProvider().name;
				}
			});

			//-- Auto-enable drawing modes for better UX --
			autoDrawingTimer = setTimeout(() => {
				if (showDrawingControls && mapRef) {
					mapRef.startDrawing?.('Rectangle', { keepExisting: false });
					isDrawing = true;
				} else if (isSidebarLayout && !showDrawingControls && mapRef) {
					mapRef.startDrawing?.('Point', { keepExisting: true });
					isDrawingPoint = true;
				}
			}, 300);

			return () => {
				unsubscribe();
				window.removeEventListener('resize', checkScreenSize);
				window.removeEventListener('click', handleClickOutside);
				clearTimeout(searchTimeout);
				if (autoDrawingTimer) {
					clearTimeout(autoDrawingTimer);
					autoDrawingTimer = null;
				}
				if (pendingNominatimTimer) {
					clearTimeout(pendingNominatimTimer);
					pendingNominatimTimer = null;
				}
			};
		}
	});

	//-- Expose a helper to allow parent components to cancel editing/drawing --
	export function cancelEditing() {
		try {
			mapRef?.clearDrawings?.();
		} catch (e) {
			console.error(e);
		}
		try {
			mapRef?.stopDrawing?.();
		} catch (e) {
			console.error(e);
		}
		try {
			mapRef?.stopModify?.();
		} catch (e) {
			console.error(e);
		}
		//-- Reset local UI state --
		isDrawing = false;
		isDrawingPoint = false;
		busStopLocationWkt = null;
		areaDisplay = null;
		overlappingLandmarkId = null;
		drawnRectCoords = null;
	}

	//-- Stop interactions but keep the drawn boundary (used after saving) --
	export function finalizeEditing() {
		try {
			mapRef?.stopDrawing?.();
		} catch (e) {
			console.error(e);
		}
		try {
			mapRef?.stopModify?.();
		} catch (e) {
			console.error(e);
		}
		//-- Keep drawings and boundary intact; only update UI state --
		isDrawing = false;
	}
</script>

<div
	class="map-card {isSidebarLayout ? 'isSidebarLayout' : ''}"
	class:expanded={isMapExpanded}
	bind:this={mapContainer}
>
	<div class="map-card-header">
		<div class="search-bar-wrapper">
			<div class="map-search-container" bind:this={searchContainerRef}>
				<div class="search-input-wrapper">
					<i class="bi bi-search search-icon"></i>
					<input
						type="text"
						class="form-control map-search-input"
						placeholder="Search places or coordinates (lat, lon)"
						value={searchTerm}
						on:input={handleSearchInput}
						on:focus={() => searchResults.length > 0 && (showSearchResults = true)}
					/>
					{#if isSearching}
						<span class="search-spinner"></span>
					{/if}
				</div>
				{#if showSearchResults && searchResults.length > 0}
					<ul class="search-results-dropdown">
						{#each searchResults as result}
							<li>
								<button
									type="button"
									class="search-result-item"
									on:click={() => selectSearchResult(result)}
								>
									<i class="bi bi-geo-alt"></i>
									<span>{result.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			{#if isMapExpanded && !!boundary}
				<span>
					<button
						class="btn btn-sm btn-primary add-landmark-fullscreen"
						on:click={handleAddLandmarkClick}
						title={!boundary ? 'Draw boundary to enable adding landmarks' : 'Add Landmark'}
						disabled={!boundary}
						aria-disabled={!boundary}
						aria-describedby={!boundary ? 'add-landmark-disabled-hint' : undefined}
					>
						<i class="bi bi-plus-lg"></i>Add Landmark
					</button>
				</span>
				{#if !boundary}
					<span id="add-landmark-disabled-hint" class="sr-only"
						>Draw or select a boundary to enable adding landmarks.</span
					>
				{/if}
			{/if}
		</div>

		<div class="map-actions">
			<!-- Provider selector -->
			<CustomSelect
				label="Map"
				value={selectedProviderName}
				options={providers.map((p) => p.name)}
				onChange={(name) => {
					selectedProviderName = name;
				}}
			/>
			<!-- Provider management button -->
			<button
				class="btn"
				title="Manage map providers"
				on:click={() => (showProviderPanel = !showProviderPanel)}
				style="color: var(--text-primary);"
			>
				<i class="bi bi-gear fs-5"></i>
			</button>
		</div>

		<!-- Provider management panel -->
		<MapTileProviderManager
			{providers}
			show={showProviderPanel}
			on:close={() => (showProviderPanel = false)}
			on:providerRemoved={handleProviderRemoved}
		/>
	</div>
	<!-- Info row -->
	<div class="header-info-row">
		<div class="area">
			{#if areaDisplay}<p><b>Area:</b> {areaDisplay}</p>{/if}
		</div>
		<div class="coords">
			<p>
				<b>Coordinates:</b>
				{#if pointerLonLat}[{pointerLonLat[0].toFixed(6)}, {pointerLonLat[1].toFixed(6)}]{/if}
			</p>
		</div>
	</div>

	<div class="map-area">
		<MapOL
			bind:this={mapRef}
			{center}
			selectedProvider={selectedProviderName}
			{providerUrl}
			{providerAttribution}
			{providerMaxZoom}
			{boundary}
			{landmarks}
			{busStops}
			bind:selectedLandmarkId
			modifyEnabled={showDrawingControls}
			{editingBusStopId}
			{overlappingLandmarkId}
			{drawnRectCoords}
			{autoFitLandmarks}
			on:mapPointerMove={(e) => {
				pointerLonLat = [e.detail.lon, e.detail.lat];
			}}
			on:drawArea={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
				//-- Update overlappingLandmarkId to show/hide square on map during overlap --
				overlappingLandmarkId = e.detail.overlappingLandmarkId || null;
				//-- Update drawnRectCoords to show the drawn rectangle during overlap --
				drawnRectCoords = e.detail.drawnRectCoords || null;
			}}
			on:drawComplete={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
				boundary = e.detail.boundary;
				//-- Clear overlap state when drawing completes successfully --
				overlappingLandmarkId = null;
				drawnRectCoords = null;
				if (!isSidebarLayout) selectedLandmarkId = null;
				mapRef?.startModify?.();
			}}
			on:drawCleared={() => {
				areaDisplay = null;
				boundary = null;
				overlappingLandmarkId = null;
				drawnRectCoords = null;
				if (!isSidebarLayout) {
					selectedLandmarkId = null;
					mapRef?.stopModify?.();
				}
			}}
			on:drawError={(e) => {
				//-- Show alert with error message --
				if (e?.detail?.message) {
					toast.error(e.detail.message);
				}
				if (isSidebarLayout) {
					mapRef?.startModify?.();
				}
			}}
			on:pointDrawComplete={(e) => {
				busStopLocationWkt = e.detail.location;
				dispatch('busStopLocationSelected', { location: e.detail.location });
			}}
			on:pointDrawCleared={() => {
				busStopLocationWkt = null;
				dispatch('busStopLocationCleared');
			}}
			on:busStopLocationUpdated={(e) => {
				dispatch('busStopLocationUpdated', e.detail);
			}}
			on:viewChanged
		/>

		<!-- Map overlay controls (top-right, vertical stack) -->
		<div class="map-overlay-controls" aria-hidden="false">
			{#if showDrawingControls}
				{#if isLargeScreen && !isSidebarLayout}
					<button
						class="btn btn-sm"
						on:click={toggleMapToFullscreen}
						title={isMapExpanded ? 'Collapse' : 'Expand'}
						style="color: var(--text-primary); background-color: var(--bg-card); border: 1px solid var(--border); border-radius: 4px;"
					>
						<i
							class="bi"
							class:bi-arrows-angle-expand={!isMapExpanded}
							class:bi-arrows-angle-contract={isMapExpanded}
						></i>
					</button>
				{/if}
				<button
					class:active={isDrawing}
					on:click={() => {
						if (!isDrawing) {
							//-- Stop point drawing if active --
							if (isDrawingPoint) {
								mapRef?.stopDrawing?.();
								isDrawingPoint = false;
							}
							mapRef?.startDrawing?.('Rectangle', { keepExisting: false });
							isDrawing = true;
						} else {
							mapRef?.stopDrawing?.();
							isDrawing = false;
						}
					}}
					title="Toggle rectangle draw (Landmark boundary)"
					class="icon-btn"
				>
					<i class="bi bi-pencil"></i>
				</button>
			{/if}

			<!-- Bus stop button only visible in sidebar layout (landmark detail) -->
			{#if isSidebarLayout && !showDrawingControls}
				<button
					class:active={isDrawingPoint}
					on:click={() => {
						if (!isDrawingPoint) {
							//-- Stop rectangle drawing if active --
							if (isDrawing) {
								mapRef?.stopDrawing?.();
								isDrawing = false;
							}
							mapRef?.startDrawing?.('Point', { keepExisting: true });
							isDrawingPoint = true;
							busStopLocationWkt = null;
						} else {
							mapRef?.stopDrawing?.();
							isDrawingPoint = false;
						}
					}}
					title="Mark bus stop location (Point)"
					class="icon-btn"
				>
					<i class="bi bi-bus-front"></i>
				</button>
			{/if}
			<button
				on:click={() => {
					mapRef?.clearDrawnFeatures?.();
					busStopLocationWkt = null;
					dispatch('busStopLocationCleared');
				}}
				title="Clear drawings"
				class="icon-btn"
			>
				<i class="bi bi-eraser"></i>
			</button>
		</div>
		<!-- clear coords when leaving the map area -->
		<div
			on:mouseleave={() => (pointerLonLat = null)}
			style="position:absolute; inset:0; pointer-events:none;"
			aria-hidden="true"
		></div>
	</div>
</div>

<style>
	.map-card-header {
		display: flex;
		justify-content: space-between;
	}
	.search-bar-wrapper {
		max-width: 320px;
		width: 100%;
		margin-right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.map-card.expanded .search-bar-wrapper {
		max-width: 760px;
		flex: 1 1 auto;
	}
	.map-card.expanded .add-landmark-fullscreen {
		min-width: 180px;
	}

	.search-bar-wrapper :global(.search-filter-container) {
		margin-bottom: 0;
	}
	.search-bar-wrapper > * {
		align-self: center;
	}
	.search-bar-wrapper :global(.search-filter-container) > :global(.d-flex) {
		margin-bottom: 0 !important;
	}
	.search-bar-wrapper :global(.custom-search-input) {
		height: 40px;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}

	.add-landmark-fullscreen {
		margin-top: 0;
	}
	.map-actions {
		display: flex;
		gap: 0.5rem;
	}
	.map-actions :global(.custom-select) {
		height: 34px;
	}
	.map-area {
		flex: 1;
		margin-top: 0.5rem;
		min-height: 0;
		position: relative;
	}

	.header-info-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem;
	}
	.header-info-row .coords,
	.header-info-row .area {
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.header-info-row p {
		margin: 0;
		padding: 0;
	}
	@media (max-width: 600px) {
		.header-info-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}

	.map-overlay-controls {
		position: absolute;
		right: 12px;
		top: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 1000;
	}
	.map-overlay-controls .icon-btn {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		border: none;
		background: var(--bg-card);
		color: var(--text-primary);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 6px;
	}
	@media (max-width: 600px) {
		.map-overlay-controls .icon-btn {
			width: 44px;
			height: 44px;
			padding: 8px;
			border-radius: 8px;
		}
	}
	.map-overlay-controls .icon-btn.active {
		background: var(--accent, #007bff);
		color: #fff;
	}

	.map-card {
		display: flex;
		flex-direction: column;
		height: 700px;
		padding: 1rem;
		background: var(--bg-card);
	}
	.map-card.expanded {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		padding: 1rem;
		z-index: 1040;
		background: var(--bg-card);
	}
	.map-card.isSidebarLayout {
		height: 400px;
		padding: 0.5rem;
	}

	@media (max-width: 768px) {
		.map-card-header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		.search-bar-wrapper {
			margin-right: 0;
			max-width: 100%;
		}
		.map-actions {
			justify-content: flex-start;
		}
	}
	@media (max-width: 1024px) {
		.map-card:not(.compact) {
			height: 600px;
			padding-bottom: 30px;
		}
		.map-actions {
			gap: 0.25rem;
		}
		.map-actions :global(.custom-select) {
			height: 28px;
		}
	}

	.add-landmark-fullscreen {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 15px;
		height: 40px;
		min-width: 150px;
		white-space: nowrap;
		align-self: center;
	}
	.add-landmark-fullscreen:disabled {
		cursor: not-allowed;
		opacity: 0.6;
		pointer-events: none;
	}

	.sr-only {
		position: absolute !important;
		width: 1px !important;
		height: 1px !important;
		padding: 0 !important;
		margin: -1px !important;
		overflow: hidden !important;
		clip: rect(0 0 0 0) !important;
		white-space: nowrap !important;
		border: 0 !important;
	}

	.map-search-container {
		position: relative;
		width: 100%;
		flex: 1;
	}
	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search-icon {
		position: absolute;
		left: 12px;
		color: var(--text-muted);
		pointer-events: none;
		z-index: 1;
	}
	.map-search-input {
		padding-left: 36px;
		padding-right: 36px;
		height: 40px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		color: var(--text-primary);
		width: 100%;
	}
	.map-search-input:focus {
		outline: none;
		border-color: var(--accent, #007bff);
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
	}
	.map-search-input::placeholder {
		color: var(--text-muted);
	}
	.search-spinner {
		position: absolute;
		right: 12px;
		width: 16px;
		height: 16px;
		border: 2px solid var(--border);
		border-top-color: var(--accent, #007bff);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.search-results-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 4px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-height: 250px;
		overflow-y: auto;
		z-index: 1050;
		list-style: none;
		padding: 4px;
		margin: 4px 0 0 0;
	}
	.search-results-dropdown li {
		margin: 0;
		padding: 0;
	}
	.search-result-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		width: 100%;
		padding: 10px 12px;
		border: none;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		border-radius: 6px;
		font-size: 0.9rem;
		line-height: 1.3;
	}
	.search-result-item:hover {
		background: var(--bg-hover, rgba(0, 0, 0, 0.05));
	}
	.search-result-item i {
		color: var(--accent, #007bff);
		flex-shrink: 0;
		margin-top: 2px;
	}
	.search-result-item span {
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
