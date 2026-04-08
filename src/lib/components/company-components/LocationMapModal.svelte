<script lang="ts">
	import CompanyLocationMap from './CompanyLocationMap.svelte';

	//-- Props --
	export let isOpen: boolean = false;
	export let latitude: number;
	export let longitude: number;
	export let locationName: string = 'Location';
	export let zoom: number = 15;

	let mapComponent: CompanyLocationMap;
	let localOpen = isOpen;

	function closeModal() {
		localOpen = false;
		isOpen = false;
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
		<div class="modal-content">
			<div class="modal-header">
				<div class="header-content">
					<i class="bi bi-map-fill"></i>
					<div>
						<h2 class="modal-title">{locationName}</h2>
						<p class="modal-subtitle">Coordinates: ({longitude.toFixed(4)}, {latitude.toFixed(4)})</p>
					</div>
				</div>
				<button class="close-button" on:click={closeModal} aria-label="Close modal">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="modal-map-container">
				<CompanyLocationMap bind:this={mapComponent} {latitude} {longitude} {zoom} />
			</div>
		</div>
	</div>
{/if}

<style>
	:global {
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
			color: var(--text-secondary);
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
			color: var(--text-secondary);
		}

		.close-button {
			background: none;
			border: none;
			color: var(--text-secondary);
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
	}
</style>
