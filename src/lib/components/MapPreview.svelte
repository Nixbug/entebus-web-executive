<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';
	import SearchFilterBar from './SearchFilterBar.svelte';

	export let center = { lat: 10.8505, lng: 76.2711 };

	let mapRef: any;
	let rootEl: HTMLDivElement;
	let isFullscreen = false;

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
		if (!browser) return;
		if (!document.fullscreenElement) {
			rootEl.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	function onFullScreenChange() {
		if (!browser) return;
		isFullscreen = !!document.fullscreenElement;
		setTimeout(() => mapRef?.updateSize?.(), 100);
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

	onMount(() => {
		if (!browser) return;
		document.addEventListener('fullscreenchange', onFullScreenChange);
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('fullscreenchange', onFullScreenChange);
	});
</script>


<div class="map-card" bind:this={rootEl}>
	<div class="map-card-header">
		<div class="search-bar-wrapper">
			<SearchFilterBar searchPlaceholder="Search landmarks..." showFilter={false} />
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
			<button
				class="btn btn-sm"
				on:click={toggleFullscreen}
				title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
				style="color: var(--text-primary);"
			>
				<i
					class="bi"
					class:bi-arrows-angle-expand={!isFullscreen}
					class:bi-arrows-angle-contract={isFullscreen}
				></i>
			</button>
		</div>
	</div>
	<!-- Info row: coordinates (left) and area (right) -->
	<div class="header-info-row">
		<div class="area">{#if areaDisplay}<p><b>Area:</b> {areaDisplay}</p>{/if}</div>
		<div class="coords"><p><b>Coordinates:</b> {#if hover}[{hover[0].toFixed(6)}, {hover[1].toFixed(6)}]{/if}</p></div>
		
	</div>
	<div class="map-area">
		<MapOL bind:this={mapRef} {center} {tileType} {googleTileUrl} {standardTileUrl}
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
			}}
			on:drawCleared={() => {
				areaDisplay = null;
			}}
		/>

		<!-- Map overlay controls (top-right, vertical stack) -->
		<div class="map-overlay-controls" aria-hidden="false">
			<button
				class:active={isDrawing}
				on:click={() => {
					if (!isDrawing) {
						mapRef?.startDrawing?.('Rectangle');
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
				<i class="bi bi-square" />
			</button>

			<button
				on:click={() => {
					mapRef?.clearDrawings?.();
					isDrawing = false;
					mapRef?.stopDrawing?.();
				}}
				title="Clear drawings"
				class="icon-btn"
			>
				<!-- svelte-ignore element_invalid_self_closing_tag -->
				<i class="bi bi-trash" />
			</button>
		</div>
		<!-- clear coords when leaving the map area -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div on:mouseleave={() => (hover = null)} style="position:absolute; inset:0; pointer-events:none;"></div>
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
	}
	.map-actions {
		display: flex;
		gap: 0.5rem;
	}
	.map-actions :global(.custom-select),
	.map-actions .btn {
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
		.map-actions :global(.custom-select),
		.map-actions .btn {
			height: 28px;
		}
	}
</style>
