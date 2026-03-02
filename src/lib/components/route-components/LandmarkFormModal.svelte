<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	//-- Props --
	export let landmark: any = null;
	export let isOpen: boolean = false;
	export let mode: 'edit' | 'create' = 'edit';

	//-- State --
	let formData: any = {
		landmarkName: '',
		arrivalTime: '',
		departureTime: '',
		distanceFromStart: ''
	};

	//-- Helper function to convert seconds to HH:MM format --
	function secondsToTimeString(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}

	//-- Helper function to convert HH:MM format to seconds --
	function timeStringToSeconds(timeStr: string): number {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours * 3600 + minutes * 60;
	}

	//-- Events --
	const dispatch = createEventDispatcher();

	//-- Reactive: When landmark changes or modal opens, populate form data --
	$: if (isOpen && landmark) {
		if (mode === 'edit') {
			formData = {
				landmarkName: landmark.landmarkName || '',
				arrivalTime: secondsToTimeString(landmark.arrivalDelta || 0),
				departureTime: secondsToTimeString(landmark.departureDelta || 0),
				distanceFromStart: landmark.distanceFromStart || 0
			};
		} else if (mode === 'create') {
			formData = {
				landmarkName: landmark.landmarkName || '',
				arrivalTime: landmark.arrivalTime || '00:00',
				departureTime: landmark.departureTime || '00:00',
				distanceFromStart: landmark.distanceFromStart || 0
			};
		}
	}

	function closeModal() {
		dispatch('close');
	}

	// keyboard handler for the overlay so it is accessible
	function handleOverlayKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			closeModal();
		}
	}

	// disable page scrolling while modal is visible
	$: {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	function handleSubmit() {
		if (mode === 'edit') {
			dispatch('save', {
				landmarkId: landmark.id,
				landmarkName: landmark.landmarkName,
				arrivalDelta: timeStringToSeconds(formData.arrivalTime),
				departureDelta: timeStringToSeconds(formData.departureTime),
				distanceFromStart: parseFloat(formData.distanceFromStart)
			});
		} else if (mode === 'create') {
			dispatch('save', {
				landmarkName: formData.landmarkName,
				arrivalTime: formData.arrivalTime,
				departureTime: formData.departureTime,
				distanceFromStart: parseFloat(formData.distanceFromStart)
			});
		}
		closeModal();
	}
</script>

{#if isOpen && landmark}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Close modal"
		on:click={closeModal}
		on:keydown={handleOverlayKeyDown}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header d-flex align-items-center justify-content-between">
				<h5 class="fw-inter-700 mb-0">
					{mode === 'edit' ? 'Edit Landmark' : 'Create Landmark'}
				</h5>
				<button class="btn-close" aria-label="Close" on:click={closeModal}></button>
			</div>
			<div class="modal-body">
				<!-- Landmark Name -->
				<div class="form-group mb-3">
					<label for="landmark-name" class="form-label fw-inter-600">Landmark Name</label>
					<input
						id="landmark-name"
						type="text"
						class="form-control"
						bind:value={formData.landmarkName}
						disabled={mode === 'edit'}
						placeholder="Enter landmark name"
					/>
				</div>

				<!-- Arrival Time -->
				<div class="form-group mb-3">
					<label for="arrival-time" class="form-label fw-inter-600">Arrival Time (HH:MM)</label>
					<input
						id="arrival-time"
						type="text"
						class="form-control"
						bind:value={formData.arrivalTime}
						placeholder="HH:MM"
					/>
				</div>

				<!-- Departure Time -->
				<div class="form-group mb-3">
					<label for="departure-time" class="form-label fw-inter-600">Departure Time (HH:MM)</label>
					<input
						id="departure-time"
						type="text"
						class="form-control"
						bind:value={formData.departureTime}
						placeholder="HH:MM"
					/>
				</div>

				<!-- Distance from Start -->
				<div class="form-group mb-3">
					<label for="distance" class="form-label fw-inter-600">Distance from Start (meters)</label>
					<input
						id="distance"
						type="number"
						class="form-control"
						bind:value={formData.distanceFromStart}
						placeholder="0"
					/>
				</div>
			</div>
			<div class="modal-footer d-flex align-items-center justify-content-end gap-2">
				<button class="btn btn-outline-secondary" on:click={closeModal}> Cancel </button>
				<button class="btn btn-primary" on:click={handleSubmit}>
					{mode === 'edit' ? 'Save Changes' : 'Create Landmark'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--bg-card);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		border: 1px solid var(--border);
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.modal-header h5 {
		color: var(--text-primary);
		font-size: 1.25rem;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		color: var(--text-primary);
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}

	.form-control {
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.form-control:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.form-control:disabled {
		background-color: var(--bg-card);
		color: var(--text-muted);
		cursor: not-allowed;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.btn-close:hover {
		color: var(--text-primary);
	}

	@media (max-width: 480px) {
		.modal-content {
			max-height: 100vh;
			border-radius: 8px 8px 0 0;
		}

		.modal-overlay {
			justify-content: flex-end;
		}
	}
</style>
