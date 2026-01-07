<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';
	import SearchFilterBar from './SearchFilterBar.svelte';


	export let center = { lat: 10.8505, lng: 76.2711 };
	export let boundary:any = null;
	export let landmarks: any[] = [];
	export let selectedLandmarkId: string | null = null;
	// When false, hide pencil/eraser controls (used when MapPreview is embedded in readonly detail sidebar)
	export let showDrawingControls: boolean = true;
	// When true, use a reduced height suitable for sidebars or compact layouts
	export let compact: boolean = false;

	let mapRef: any;
	let rootEl: HTMLDivElement;
	// Use CSS-based expanded mode so the page modal can overlay the map
	let isExpanded = false;
	const dispatch = createEventDispatcher();

	// drawing overlay state
	let isDrawing = false;

	let hover: [number, number] | null = null;
	let areaDisplay: string | null = null;

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

	function toggleFullscreen() {
		// switch to a CSS-based expanded mode instead of browser fullscreen
		if (!browser) return;
		isExpanded = !isExpanded;
		// update map size after layout changes
		setTimeout(() => mapRef?.updateSize?.(), 120);
	}

	function handleAddLandmarkClick() {
		// In expanded (CSS) mode we can dispatch immediately — the modal (z-index 1050)
		// will appear above the map because expanded map uses z-index below 1050.
		dispatch('addLandmark');
	}

	function formatArea(m2: number) {
		if (m2 === null || m2 === undefined) return null;
		if (m2 >= 1000000) {
			return (m2 / 1000000).toFixed(3) + ' km²';
		}
		if (m2 >= 1) {
			return m2.toFixed(2) + ' m²';
		}
		return (m2 * 10000).toFixed(2) + ' cm²';
	}

	let isLargeScreen = false;
	let showExpanded = false;
		//-- Check screen size --
	function checkScreenSize() {
		if (browser) {
			isLargeScreen = window.innerWidth > 1024;
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

</script>


<div class="map-card {compact ? 'compact' : ''}" class:expanded={isExpanded} bind:this={rootEl}>
	<div class="map-card-header">
		<div class="search-bar-wrapper">
			<SearchFilterBar searchPlaceholder="Search landmarks..." showFilter={false} />
			{#if isExpanded}
				<button
					class="btn btn-sm btn-primary add-landmark-fullscreen"
					on:click={handleAddLandmarkClick}
					title="Add Landmark"
					disabled={!boundary}
					aria-disabled={!boundary}
				>
					<i class="bi bi-plus-lg"></i>&nbsp;Add Landmark
				</button>
			{/if}
		</div>

		<div class="map-actions">
			<CustomSelect
				label="View"
				value={tileType === 'standard' ? 'OSM' : 'Google'}
				options={['OSM', 'Google']}
				onChange={(v) => {
					if (v === 'Standard') {
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
	<!-- Info row: coordinates (left) and area (right) -->
	<div class="header-info-row">
		<div class="area">{#if areaDisplay}<p><b>Area:</b> {areaDisplay}</p>{/if}</div>
		<div class="coords"><p><b>Coordinates:</b> {#if hover}[{hover[0].toFixed(6)}, {hover[1].toFixed(6)}]{/if}</p></div>
		
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
			on:mapPointerMove={(e) => {
				hover = [e.detail.lon, e.detail.lat];
			}}
			on:drawArea={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
			}}
			on:drawComplete={(e) => {
				const m2 = e.detail.area || 0;
				areaDisplay = formatArea(m2);
				// Update boundary binding so parent gets new value
				boundary = e.detail.boundary;
				// clear any selected landmark when a new drawing completes (unless in compact/sidebar mode)
				if (!compact) selectedLandmarkId = null;
			}}
			on:drawCleared={() => {
				areaDisplay = null;
				boundary = null;
				// preserve selection in compact/sidebar mode to avoid map re-centering
				if (!compact) selectedLandmarkId = null;
			}}
		/>

		<!-- Map overlay controls (top-right, vertical stack) -->
		{#if showDrawingControls}
		<div class="map-overlay-controls" aria-hidden="false">
			{#if isLargeScreen}
			<button
				class="btn btn-sm"
				on:click={toggleFullscreen}
				title={isExpanded ? 'Collapse' : 'Expand'}
				style="color: var(--text-primary); background-color: var(--bg-card); border: 1px solid var(--border); border-radius: 4px;"
			>
				<i class="bi" class:bi-arrows-angle-expand={!isExpanded} class:bi-arrows-angle-contract={isExpanded}></i>
			</button>
			{/if}
			<button
				class:active={isDrawing}
				on:click={() => {
					if (!isDrawing) {
						// When embedded in the sidebar (compact), keep the existing boundary visible
						mapRef?.startDrawing?.('Rectangle', { keepExisting: compact });
						isDrawing = true;
					} else {
						mapRef?.stopDrawing?.();
						isDrawing = false;
					}
				}}
				title="Toggle rectangle draw"
				class="icon-btn"
			>
						<!-- svelte-ignore element_invalid_self_closing_tag -->
						<i class="bi bi-pencil" />
				</button>

			<button
				on:click={() => {
					// In compact/sidebar mode we treat this as "cancel drawing" (stop without clearing)
					if (compact) {
						mapRef?.stopDrawing?.();
						isDrawing = false;
						return;
					}
					// In normal/full mode clear drawings
					mapRef?.clearDrawings?.();
					isDrawing = false;
					mapRef?.stopDrawing?.();
				}}
				title="Clear drawings"
				class="icon-btn"
			>
				<!-- svelte-ignore element_invalid_self_closing_tag -->
				<i class="bi bi-eraser" />
			</button>
		</div>
		{/if}
		<!-- clear coords when leaving the map area -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div on:mouseleave={() => (hover = null)} style="position:absolute; inset:0; pointer-events:none;"></div>
	</div>
</div>


<style>
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

	/* When map is expanded, allow the search bar to grow and the add button to be wider */
	.map-card.expanded .search-bar-wrapper {
		max-width: 760px;
		flex: 1 1 auto;
	}

	.map-card.expanded .add-landmark-fullscreen {
		min-width: 180px;
	}

	/* Ensure the search component doesn't add extra bottom margin inside the header */
	.search-bar-wrapper :global(.search-filter-container) {
		margin-bottom: 0;
	}

	/* Force children (search component and button) to align center vertically */
	.search-bar-wrapper > * {
		align-self: center;
	}

	/* Remove the inner row's bottom margin inside the embedded SearchFilterBar */
	.search-bar-wrapper :global(.search-filter-container) > :global(.d-flex) {
		margin-bottom: 0 !important;
	}

	/* Make the search input match the button height and align vertically */
	.search-bar-wrapper :global(.custom-search-input) {
		height: 40px;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}

	/* Ensure add button has no extra top margin */
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

	/* Larger tap targets on small screens */
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

	/* CSS-based expanded mode (not browser fullscreen). Uses z-index below modal (1050) */
	.map-card.expanded {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		padding: 1rem;
		z-index: 1040; /* below CreationForm modal z-index: 1050 */
		background: var(--bg-card);
	}
	/* Compact variant for sidebars */
	.map-card.compact {
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
		.map-actions :global(.custom-select){
			height: 28px;
		}
	}
</style>
