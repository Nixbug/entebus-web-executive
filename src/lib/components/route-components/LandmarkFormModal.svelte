<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TimeSelector from './TimeSelector.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { parseStartingTime } from '$lib/helpers';
	import { browser } from '$app/environment';

	//-- Types --
	interface TimeValue {
		days: number;
		hours: number;
		minutes: number;
		period: 'AM' | 'PM';
	}

	interface FormData {
		landmarkName: string;
		arrivalTime: TimeValue;
		departureTime: TimeValue;
		distanceFromStart: number | string;
		distanceUnit: string;
	}

	//-- Props --
	export let landmark: any = null;
	export let isOpen: boolean = false;
	export let mode: 'edit' | 'create' = 'edit';
	export let startingTime: string = '00:00';

	//-- State --
	let formData: FormData = {
		landmarkName: '',
		arrivalTime: { days: 0, hours: 12, minutes: 0, period: 'AM' },
		departureTime: { days: 0, hours: 12, minutes: 0, period: 'AM' },
		distanceFromStart: '',
		distanceUnit: 'm' // 'm' or 'km'
	};

	const distanceOptions = ['m', 'km'];
	function changeDistanceUnit(v: string) {
		if (!formData || formData.distanceUnit === v) return;
		let val = parseFloat(String(formData.distanceFromStart)) || 0;
		if (v === 'km') {
			val = val / 1000;
		} else {
			val = val * 1000;
		}
		formData.distanceFromStart = val;
		formData.distanceUnit = v;
	}
	function to12Hour(hours24: number): { hours: number; period: 'AM' | 'PM' } {
		const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
		let hours = hours24 % 12;
		if (hours === 0) hours = 12;
		return { hours, period };
	}

	function addSecondsToTime(startTime: string, delta: number) {
		// convert startingTime (e.g. "10.00 AM") to seconds using helper
		const base = parseStartingTime(startTime) * 60;
		const total = base + delta;
		const days = Math.floor(total / 86400);
		const rem = total % 86400;
		const hours24 = Math.floor(rem / 3600);
		const minutes = Math.floor((rem % 3600) / 60);
		const { hours, period } = to12Hour(hours24);
		return { days, hours, minutes, period };
	}

	function selectionToSeconds(sel: {
		days: number;
		hours: number;
		minutes: number;
		period: 'AM' | 'PM';
	}) {
		let hour24 = sel.hours % 12;
		if (sel.period === 'PM') hour24 += 12;
		return sel.days * 86400 + hour24 * 3600 + sel.minutes * 60;
	}

	//-- Events --
	const dispatch = createEventDispatcher();

	//-- Reactive: When landmark changes or modal opens, populate form data --
	$: if (isOpen && (landmark || mode === 'create')) {
		if (mode === 'edit') {
			// prefill unit depending on value size
			let dist = landmark.distanceFromStart || 0;
			let unit = 'm';
			let display = dist;
			if (dist >= 1000) {
				unit = 'km';
				display = dist / 1000;
			}
			formData = {
				landmarkName: landmark.landmarkName || '',
				// convert stored delta to an actual time relative to starting time
				arrivalTime: addSecondsToTime(startingTime, landmark.arrivalDelta || 0),
				departureTime: addSecondsToTime(startingTime, landmark.departureDelta || 0),
				distanceFromStart: display,
				distanceUnit: unit
			};
		} else if (mode === 'create') {
			formData = {
				landmarkName: landmark?.landmarkName || '',
				arrivalTime: addSecondsToTime(startingTime, 0),
				departureTime: addSecondsToTime(startingTime, 0),
				distanceFromStart: landmark?.distanceFromStart || 0,
				distanceUnit: 'm'
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
	$: if (browser) {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	function handleSubmit() {
		// convert selection back to seconds and derive delta relative to starting time
		const startSeconds = parseStartingTime(startingTime) * 60;
		const arrivalSeconds = selectionToSeconds(formData.arrivalTime);
		const departureSeconds = selectionToSeconds(formData.departureTime);
		// convert distance to meters always
		let distMeters = parseFloat(String(formData.distanceFromStart)) || 0;
		if (formData.distanceUnit === 'km') {
			distMeters *= 1000;
		}
		const detail: any = {
			landmarkName: formData.landmarkName,
			arrivalTime: formData.arrivalTime,
			departureTime: formData.departureTime,
			arrivalDelta: arrivalSeconds - startSeconds,
			departureDelta: departureSeconds - startSeconds,
			distanceFromStart: distMeters
		};
		if (mode === 'edit') {
			detail.landmarkId = landmark.id;
		}
		dispatch('save', detail);
		closeModal();
	}
</script>

{#if isOpen && landmark}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
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
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label fw-inter-600">Arrival Time</label>
					<TimeSelector bind:value={formData.arrivalTime} />
				</div>

				<!-- Departure Time -->
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<div class="form-group mb-3">
					<label class="form-label fw-inter-600">Departure Time</label>
					<TimeSelector bind:value={formData.departureTime} />
				</div>

				<!-- Distance from Start -->
				<div class="form-group mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label fw-inter-600">Distance from Start</label>
					<div class="d-flex gap-2 distance-row">
						<input
							type="number"
							class="form-control distance-input"
							bind:value={formData.distanceFromStart}
							placeholder="0"
						/>
						<div class="unit-select-wrapper">
							<CustomSelect
								label=""
								value={formData.distanceUnit}
								options={distanceOptions}
								onChange={changeDistanceUnit}
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer d-flex align-items-center justify-content-center gap-2">
				<div class="btn-wrapper">
					<button class="btn btn-secondary" on:click={closeModal}> Cancel </button>
				</div>
				<div class="btn-wrapper">
					<button class="btn btn-primary" on:click={handleSubmit}>
						{mode === 'edit' ? 'Save' : 'Create Landmark'}
					</button>
				</div>
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
		padding: 1.25rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.modal-footer .btn-wrapper {
		flex: 0 0 48%;
	}

	.modal-footer .btn {
		width: 100%;
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
			width: 100%;
			padding: 0.75rem 0.75rem 1rem 0.75rem;
		}

		.modal-overlay {
			align-items: flex-end;
			justify-content: center;
		}

		.modal-header {
			padding: 0.9rem 0.9rem;
		}

		.modal-body {
			padding: 0.9rem;
		}

		.modal-footer {
			padding: 0.75rem 0.9rem;
		}

    		/* keep distance input and unit selector on one row; make selector narrower */
    		.distance-row {
    			display: flex;
    			align-items: center;
    		}

		.distance-input {
			flex: 1 1 auto;
			min-width: 0;
		}

		.unit-select-wrapper {
			flex: 0 0 84px;
			max-width: 84px;
		}

		/* ensure the CustomSelect dropdown fills its wrapper */
		.unit-select-wrapper :global(.dropdown-wrapper) {
			width: 100%;
		}
	}
</style>
