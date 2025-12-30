<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import MapOL from '$lib/components/MapOL.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { browser } from '$app/environment';

	export let center = { lat: 10.8505, lng: 76.2711 };
	export let title = 'Map View';
	export let compact = false; // New prop for compact mode

	let mapRef: any;
	let rootEl: HTMLDivElement;
	let isFullscreen = false;

	let tileType: 'standard' | 'google' = 'standard';
	let googleTileUrl = '';
	let standardTileUrl = 'OSM_DEFAULT';

	const googleTileOptions = [
		{ value: '', label: 'Select layer' },
		{ value: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', label: 'Google Roadmap' },
		{ value: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', label: 'Google Satellite' },
		{ value: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', label: 'Google Hybrid' },
		{ value: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', label: 'Google Terrain' }
	];

	const osmTileOptions = [
		{ value: 'OSM_DEFAULT', label: 'OSM Standard' },
		{ value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' }
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

<div class="map-card {compact ? 'compact' : ''}" bind:this={rootEl}>
	<div class="map-card-header">
		<div class="map-title fw-inter-700">{title}</div>

		{#if !compact}
			<div class="map-actions">
				<CustomSelect
					label="View"
					value={tileType === 'standard' ? 'Standard' : 'Google Maps'}
					options={['Standard', 'Google Maps']}
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
					value={
						tileType === 'standard'
							? osmTileOptions.find((o) => o.value === standardTileUrl)?.label || 'OSM Standard'
							: googleTileOptions.find((o) => o.value === googleTileUrl)?.label || 'Select layer'
					}
					options={
						tileType === 'standard'
							? osmTileOptions.map((o) => o.label)
							: googleTileOptions.map((o) => o.label)
					}
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
					<i class="bi" class:bi-arrows-angle-expand={!isFullscreen} class:bi-arrows-angle-contract={isFullscreen}></i>
				</button>
			</div>
		{:else}
			<div class="compact-actions">
				<button
					class="btn btn-sm"
					on:click={toggleFullscreen}
					title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
					style="color: var(--text-primary);"
				>
					<i class="bi" class:bi-arrows-angle-expand={!isFullscreen} class:bi-arrows-angle-contract={isFullscreen}></i>
				</button>
			</div>
		{/if}
	</div>

<!-- Map type selector for compact mode -->
{#if compact}
	<div class="compact-selectors">
		<select class="form-select form-select-sm" bind:value={tileType}>
			<option value="standard">Standard</option>
			<option value="google">Google Maps</option>
		</select>
		
		<select 
			class="form-select form-select-sm" 
			on:change={(e: Event) => {
				const value = (e.target as HTMLSelectElement)?.value;
				if (tileType === 'standard') {
					standardTileUrl = value;
				} else {
					googleTileUrl = value;
				}
			}}
		>
			{#if tileType === 'standard'}
				{#each osmTileOptions as option}
					<option value={option.value} selected={standardTileUrl === option.value}>
						{option.label}
					</option>
				{/each}
			{:else}
				{#each googleTileOptions as option}
					<option value={option.value} selected={googleTileUrl === option.value}>
						{option.label}
					</option>
				{/each}
			{/if}
		</select>
	</div>
{/if}

	<div class="map-area">
		<MapOL
			bind:this={mapRef}
			{center}
			{tileType}
			{googleTileUrl}
			{standardTileUrl}
		/>
	</div>
</div>

<style>
	.map-card {
		display: flex;
		flex-direction: column;
		height: 700px;
		padding: 1rem;
		background: var(--bg-card);
		border-radius: 1rem;
	}

	.map-card.compact {
		height: 100%;
		min-height: 500px;
		padding: 0.75rem;
		border-radius: 0.5rem;
	}

	.map-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.map-card.compact .map-card-header {
		margin-bottom: 0.25rem;
	}

	.map-title {
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	.map-card.compact .map-title {
		font-size: 1rem;
	}

	.map-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: nowrap;
	}

	.map-actions :global(.custom-select),
	.map-actions .btn {
		height: 34px;
	}

	.compact-actions {
		display: flex;
		align-items: center;
	}

	.compact-selectors {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.compact-selectors .form-select {
		flex: 1;
		height: 32px;
		font-size: 0.85rem;
	}

	.map-area {
		flex: 1;
		margin-top: 0.5rem;
		min-height: 0; /* Important for flex children */
	}

	.map-card.compact .map-area {
		margin-top: 0.25rem;
	}

	/* Responsive styles */
	@media (max-width: 768px) {
		.map-card:not(.compact) {
			height: 500px;
			padding-bottom: 30px;
		}

		.map-card-header {
			flex-wrap: wrap;
		}

		.map-actions {
			width: 100%;
			justify-content: flex-start;
			margin-top: 0.5rem;
		}
	}

	@media (max-width: 1024px) {
		.map-card:not(.compact) {
			height: 600px;
		}
	}
</style>