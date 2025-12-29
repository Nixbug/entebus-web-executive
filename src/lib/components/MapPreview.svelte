<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';

	export let center = { lat: 10.8505, lng: 76.2711 };
	export let title = 'Map View';

	let mapRef: any;
	let rootEl: HTMLDivElement;
	let isFullscreen = false;
	let tileType: 'standard' | 'google' = 'standard';
	let googleTileUrl = '';

	const googleTileOptions = [
		{ value: '', label: 'Select Google layer' },
		{ value: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', label: 'Google Roadmap' },
		{ value: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', label: 'Google Satellite' },
		{ value: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', label: 'Google Hybrid' },
		{ value: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', label: 'Google Terrain' }
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
		<div>
			<div class="map-title fw-inter-700">{title}</div>
		</div>

		<div class="map-actions">
			<CustomSelect
				label="View"
				value={tileType === 'standard' ? 'Standard' : 'Google Maps'}
				options={['Standard', 'Google Maps']}
				onChange={(v) => {
					if (v === 'Standard') tileType = 'standard';
					else tileType = 'google';
				}}
			/>

			{#if tileType === 'google'}
				<CustomSelect
					label="Google layer"
					value={googleTileOptions.find((o) => o.value === googleTileUrl)?.label ||
						'Select Google layer'}
					options={googleTileOptions.map((o) => o.label)}
					onChange={(label) => {
						const opt = googleTileOptions.find((o) => o.label === label);
						googleTileUrl = opt ? opt.value : '';
					}}
				/>
			{/if}

			<button
				class="btn btn-sm btn-outline-secondary"
				on:click={toggleFullscreen}
				aria-pressed={isFullscreen}
				title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
			>
				{#if isFullscreen}
					<i class="bi bi-arrows-angle-contract"></i>
				{:else}
					<i class="bi bi-arrows-angle-expand"></i>
				{/if}
			</button>
		</div>
	</div>

	<div class="map-area">
		<MapOL bind:this={mapRef} {center} {tileType} {googleTileUrl} />
	</div>
</div>

<style>
	.map-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		background: var(--bg-card);
		border-radius: 1rem;
	}
	.map-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.map-actions {
		display: flex;
		gap: 1rem;
	}

	.map-area {
		flex: 1;
		margin-top: 0.5rem;
	}

	.map-actions .btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.78rem;
		height: 34px;
	}
	.map-title {
		color: var(--text-primary);
	}
</style>
