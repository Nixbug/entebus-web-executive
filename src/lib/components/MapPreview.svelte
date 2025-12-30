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

	let tileType: 'standard' | 'google' = 'standard';
	let googleTileUrl = '';
	let standardTileUrl = 'OSM_DEFAULT';

	const googleTileOptions = [
		{ value: '', label: 'Select layer' },
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
	<div class="map-area">
		<MapOL bind:this={mapRef} {center} {tileType} {googleTileUrl} {standardTileUrl} />
	</div>
</div>

<style>
	.map-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.search-bar-wrapper {
		max-width: 320px;
		width: 100%;
		margin-right: 1rem;
	}
	.map-actions {
		display: flex;
		align-items: center;
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
