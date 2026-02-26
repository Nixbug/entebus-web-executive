<script lang="ts">
	import { onMount } from 'svelte';
	import MapOL from '$lib/components/landmark-busstop-components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { tileProviders } from '$lib/stores/tile-providers';
	import type { TileProvider } from '$lib/types/type';
	import MapTileProviderManager from '../landmark-busstop-components/MapTileProviderManager.svelte';
	import { parseCoordinateString } from '$lib/utils/openlayers.utils';
	//-- props --
	export let center = { lat: 10.8505, lng: 76.2711 };
	export let boundary: any = null;
	export let landmarks: any[] = [];
	export let routePath: Array<{
		lon: number;
		lat: number;
		label?: string;
		sequence?: number;
		boundary?: string;
		landmarkId?: string;
	}> = [];

	//-- variables --
	let mapRef: any;
	let mapContainer: HTMLDivElement; //-- Container div for map --
	let isMapExpanded = false; //-- Fullscreen/expanded state --
	let pointerLonLat: [number, number] | null = null;
	let isLargeScreen = false;
	let showExpanded = false;

	//-- Search state --
	let searchTerm = '';
	let isSearching = false;
	let searchResults: Array<{ name: string; lat: number; lon: number }> = [];
	let showSearchResults = false; //-- Ref to the search container to avoid repeated DOM queries --
	let searchContainerRef: HTMLElement | null = null;
	//-- Nominatim rate limiting (client-side): enforce minimum interval between API calls --
	const NOMINATIM_MIN_INTERVAL = 1000; //-- ms --
	let lastNominatimAt = 0;
	let pendingNominatimTimer: ReturnType<typeof setTimeout> | null = null;
	let searchTimeout: ReturnType<typeof setTimeout>; //-- Debounce search input --

	//-- Tile provider state --
	//-- Note: initialize `providers` synchronously from the store to avoid SSR/hydration issues. --
	let providers: TileProvider[] = [];
	let selectedProviderName: string = tileProviders.getDefaultProvider().name;
	let showProviderPanel = false; //-- Provider management UI state --

	//-- Reactive: get selected provider details --
	$: selectedProvider = providers.find((p) => p.name === selectedProviderName) || providers[0];
	$: providerUrl = selectedProvider?.url || '';
	$: providerAttribution = selectedProvider?.attribution || '';
	$: providerMaxZoom = selectedProvider?.maxZoom || 19;

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

		//-- schedule a Nominatim search that enforces a minimum interval between requests --
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
		searchTimeout = setTimeout(() => searchPlace(searchTerm), 300);
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
			performNominatimSearch(query);
		} else {
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

	//-- Toggle map between expanded and normal modes --
	function toggleMapToFullscreen() {
		if (!browser) return;
		isMapExpanded = !isMapExpanded;
		setTimeout(() => mapRef?.updateSize?.(), 120);
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

			return () => {
				unsubscribe();
				window.removeEventListener('resize', checkScreenSize);
				window.removeEventListener('click', handleClickOutside);
				clearTimeout(searchTimeout);
				if (pendingNominatimTimer) {
					clearTimeout(pendingNominatimTimer);
					pendingNominatimTimer = null;
				}
			};
		}
	});
</script>

<div class="map-card" class:expanded={isMapExpanded} bind:this={mapContainer}>
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
			{routePath}
			on:mapPointerMove={(e) => {
				pointerLonLat = [e.detail.lon, e.detail.lat];
			}}
		/>

		<!-- Map overlay controls (top-right, vertical stack) -->

		<div class="map-overlay-controls" aria-hidden="false">
			{#if isLargeScreen}
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
	.header-info-row .coords {
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
