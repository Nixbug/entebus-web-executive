<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';

	export let center = { lat: 10.8505, lng: 76.2711 };
	export let title = 'Map View';
	export let subtitle = 'All Landmarks';

	let mapRef: any;
	let rootEl: HTMLDivElement;
	let isFullscreen = false;

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			rootEl.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	function onFullScreenChange() {
		isFullscreen = !!document.fullscreenElement;
		// ensure the OpenLayers map resizes to fit the new container
		setTimeout(() => mapRef?.updateSize?.(), 100);
	}

	onMount(() => {
		document.addEventListener('fullscreenchange', onFullScreenChange);
	});

	onDestroy(() => {
		document.removeEventListener('fullscreenchange', onFullScreenChange);
	});
</script>

<div class="map-card" bind:this={rootEl}>
	<div class="map-card-header d-flex align-items-center justify-content-between">
		<div class="d-flex align-items-center gap-2">
			<div class="map-icon">
				<i class="bi bi-pin-map"></i>
			</div>
			<div>
				<div class="map-title">{title}</div>
				<div class="map-subtitle">{subtitle}</div>
			</div>
		</div>
		<div class="map-actions d-flex align-items-center gap-2">
			<button class="btn btn-sm btn-outline-secondary" on:click={() => mapRef && mapRef.flyTo(center.lat, center.lng, 13)}>
				Standard View
			</button>
			<button class="btn btn-sm btn-outline-secondary" on:click={toggleFullscreen} aria-pressed={isFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}>
				{#if isFullscreen}
					<i class="bi bi-arrows-angle-contract"></i>
				{:else}
					<i class="bi bi-arrows-angle-expand"></i>
				{/if}
			</button>
		</div>
	</div>

	<div class="map-area">
		<MapOL bind:this={mapRef} {center} />
	</div>
</div>

<style>
	.map-card {
		background: var(--bg-card);
		border-radius: 1rem;
		padding: 1rem;
    height: 70%;
		display: flex;
		flex-direction: column;
	}
	.map-card-header {
		padding-bottom: 0.5rem;
	}
	.map-icon {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: #00b3a4;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.map-title {
		font-weight: 700;
		color: var(--text-primary);
	}
	.map-subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.map-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: 0.5rem;
	}

	.map-card:fullscreen,
	.map-card:-webkit-full-screen {
		width: 100% !important;
		height: 100% !important;
		border-radius: 0 !important;
		padding: 0 !important;
	}

	.map-card:fullscreen .map-area,
	.map-card:-webkit-full-screen .map-area {
		padding-top: 0;
		height: 100%;
	}
</style>
