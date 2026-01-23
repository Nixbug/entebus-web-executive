<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';
	import SearchFilterBar from './SearchFilterBar.svelte';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';

	//-- props --
	export let center = { lat: 10.8505, lng: 76.2711 };
	export let boundary: any = null;
	export let landmarks: any[] = [];
	export let selectedLandmarkId: string | null = null;
	//-- When false, hide pencil/eraser controls (used when MapPreview is embedded in readonly detail sidebar) --
	export let showDrawingControls: boolean = true;
	//-- When true, MapPreview is embedded in readonly detail sidebar --
	export let isSidebarLayout: boolean = false;

	//-- variables --
	let mapRef: any;
	//-- Container div for map --
	let mapContainer: HTMLDivElement;
	//-- Fullscreen/expanded state --
	let isMapExpanded = false;
	const dispatch = createEventDispatcher();

	//-- drawing overlay state --
	let isDrawing = false;

	let pointerLonLat: [number, number] | null = null;
	let areaDisplay: string | null = null;

	//-- Tile layer state --
	let tileType: 'standard' | 'google' = 'standard';
	let googleTileUrl = '';
	let standardTileUrl = 'OSM_DEFAULT';

	const googleTileOptions = [
		{ value: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', label: ' Roadmap' },
		{ value: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', label: ' Satellite' },
		{ value: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', label: ' Hybrid' },
		{ value: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', label: ' Terrain' }
	];

	const osmTileOptions = [
		{ value: 'OSM_DEFAULT', label: 'Standard' },
		{
			value:
				'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			label: 'Satellite'
		}
	];

	let isLargeScreen = false;
	let showExpanded = false;

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
	onMount(() => {
		if (browser) {
			checkScreenSize();
			window.addEventListener('resize', checkScreenSize);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', checkScreenSize);
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
		areaDisplay = null;
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
			<SearchFilterBar searchPlaceholder="Search landmarks..." showFilter={false} />
			{#if isMapExpanded}
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
			<CustomSelect
				label="View"
				value={tileType === 'standard' ? 'OSM' : 'Google'}
				options={['OSM', 'Google']}
				onChange={(View) => {
					if (View === 'OSM') {
						tileType = 'standard';
						googleTileUrl = '';
						standardTileUrl = standardTileUrl || 'OSM_DEFAULT';
					} else {
						tileType = 'google';
						standardTileUrl = 'OSM_DEFAULT';
					}
				}}
			/>
			<CustomSelect
				label="Layer"
				value={tileType === 'standard'
					? osmTileOptions.find((o) => o.value === standardTileUrl)?.label || 'Osm'
					: googleTileOptions.find((o) => o.value === googleTileUrl)?.label || 'Standard'}
				options={tileType === 'standard'
					? osmTileOptions.map((o) => o.label)
					: googleTileOptions.map((o) => o.label)}
				onChange={(label) => {
					if (tileType === 'standard') {
						const opt = osmTileOptions.find((o) => o.label === label);
						standardTileUrl = opt?.value || 'OSM_DEFAULT';
					} else {
						const opt = googleTileOptions.find((o) => o.label === label);
						googleTileUrl = opt?.value || '';
					}
				}}
			/>
		</div>
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
			{tileType}
			{googleTileUrl}
			{standardTileUrl}
			{boundary}
			{landmarks}
			bind:selectedLandmarkId
			modifyEnabled={showDrawingControls}
			on:mapPointerMove={(e) => {
				pointerLonLat = [e.detail.lon, e.detail.lat];
			}}
			on:drawArea={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
			}}
			on:drawComplete={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
				boundary = e.detail.boundary;
				if (!isSidebarLayout) selectedLandmarkId = null;
				mapRef?.startModify?.();
			}}
			on:drawCleared={() => {
				areaDisplay = null;
				boundary = null;
				if (!isSidebarLayout) {
					selectedLandmarkId = null;
					mapRef?.stopModify?.();
				}
			}}
			on:drawError={(e) => {
				//-- Show alert with error message --
				if (e?.detail?.message) {
					alert(e.detail.message);
				}
				if (isSidebarLayout) {
					mapRef?.startModify?.();
				}
			}}
		/>

		<!-- Map overlay controls (top-right, vertical stack) -->
		{#if showDrawingControls}
			<div class="map-overlay-controls" aria-hidden="false">
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
							mapRef?.startDrawing?.('Rectangle', { keepExisting: false });
							isDrawing = true;
						} else {
							mapRef?.stopDrawing?.();
							isDrawing = false;
						}
					}}
					title="Toggle rectangle draw"
					class="icon-btn"
				>
					<i class="bi bi-pencil"></i>
				</button>

				<button
					on:click={() => {
						mapRef?.clearDrawings?.();
						isDrawing = false;
						mapRef?.stopDrawing?.();
						mapRef?.stopModify?.();
					}}
					title="Clear drawings"
					class="icon-btn"
				>
					<i class="bi bi-eraser"></i>
				</button>
			</div>
		{/if}
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
</style>
