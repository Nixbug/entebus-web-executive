<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CompanyLocationMap from './CompanyLocationMap.svelte';

	//-- Props --
	export let isOpen: boolean = false;
	export let latitude: number = 10.8505;
	export let longitude: number = 76.2711;
	export let locationName: string = 'Location';
	export let zoom: number = 8;
	//-- When true, user can click map to pick a location --
	export let pickMode: boolean = false;

	const dispatch = createEventDispatcher<{
		close: void;
		locationConfirmed: { wkt: string; lat: number; lon: number };
	}>();

	let mapComponent: CompanyLocationMap;
	let localOpen = isOpen;
	let pickedLocation: { lat: number; lon: number } | null = null;

	function closeModal() {
		localOpen = false;
		isOpen = false;
		pickedLocation = null;
		dispatch('close');
	}

	//-- Handle backdrop click --
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}

	//-- Handle escape key --
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && localOpen) {
			closeModal();
		}
	}

	function handlePointSelected(e: CustomEvent<{ lat: number; lon: number }>) {
		pickedLocation = e.detail;
	}

	function confirmLocation() {
		if (!pickedLocation) return;
		const { lat, lon } = pickedLocation;
		const wkt = `POINT(${lon.toFixed(6)} ${lat.toFixed(6)})`;
		dispatch('locationConfirmed', { wkt, lat, lon });
		closeModal();
	}

	//-- Sync external isOpen changes --
	$: if (isOpen && !localOpen) {
		localOpen = true;
	}

	//-- Update map size when modal opens --
	$: if (localOpen && mapComponent) {
		setTimeout(() => {
			mapComponent?.updateSize();
		}, 100);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if localOpen}
	<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
		<div
			class="modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="location-map-title"
			aria-describedby="location-map-subtitle"
			tabindex="0"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="modal-header">
				<div class="header-content">
					<i class="bi bi-map-fill"></i>
					<div>
						<h2 id="location-map-title" class="modal-title">{pickMode ? 'Pick a Location' : locationName}</h2>
						<p id="location-map-subtitle" class="modal-subtitle">
							{#if pickMode}
								{pickedLocation
									? `Selected: (${pickedLocation.lon.toFixed(4)}, ${pickedLocation.lat.toFixed(4)})`
									: 'Click on the map to select a location'}
							{:else}
								Coordinates: ({longitude.toFixed(4)}, {latitude.toFixed(4)})
							{/if}
						</p>
					</div>
				</div>
				<button class="close-button" on:click={closeModal} aria-label="Close modal">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="modal-map-container">
				<CompanyLocationMap
					bind:this={mapComponent}
					{latitude}
					{longitude}
					{zoom}
					{pickMode}
					on:pointSelected={handlePointSelected}
				/>
			</div>
			{#if pickMode}
				<div class="pick-action-bar">
					<button class="btn pick-cancel-btn" on:click={closeModal}>Cancel</button>
					<button
						class="btn btn-primary"
						disabled={!pickedLocation}
						on:click={confirmLocation}
					>
						<i class="bi bi-check-lg me-1"></i> Confirm Location
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	}

	.modal-content {
		background-color: var(--bg-card);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		width: 90%;
		max-width: 900px;
		height: 80vh;
		max-height: 700px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid var(--border-color);
		background-color: var(--bg-primary);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
	}

	.header-content i {
		font-size: 24px;
		color: var(--text-muted);
	}

	.modal-title {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.modal-subtitle {
		margin: 4px 0 0 0;
		font-size: 12px;
		color: var(--text-muted);
	}

	.close-button {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 20px;
		padding: 4px 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background-color: var(--bg-hover);
		color: var(--text-primary);
	}

	.modal-map-container {
		flex: 1;
		overflow: hidden;
		background-color: var(--bg-primary);
	}

	.pick-action-bar {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		align-items: center;
		padding: 14px 20px;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.pick-cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		min-width: 80px;
	}

	.pick-cancel-btn:hover {
		background: var(--bg-primary);
	}

	@media (max-width: 768px) {
		.modal-content {
			width: 95%;
			height: 85vh;
			max-width: 100%;
			max-height: 85vh;
			border-radius: 8px;
		}

		.modal-header {
			padding: 16px;
		}

		.header-content {
			gap: 12px;
		}

		.header-content i {
			font-size: 20px;
		}

		.modal-title {
			font-size: 16px;
		}

		.modal-subtitle {
			font-size: 11px;
		}
	}
</style>
