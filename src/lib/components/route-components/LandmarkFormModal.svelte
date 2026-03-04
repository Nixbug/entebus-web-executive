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
				<div class="form-group mb-2">
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
				<div class="form-group mb-2">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label fw-inter-600">Arrival Time</label>
					<TimeSelector bind:value={formData.arrivalTime} />
				</div>

				<!-- Departure Time -->
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<div class="form-group mb-2">
					<label class="form-label fw-inter-600">Departure Time</label>
					<TimeSelector bind:value={formData.departureTime} />
				</div>

				<!-- Distance from Start -->
				<div class="form-group mb-1">
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
		max-width: 520px;
		width: 100%;
		max-height: 78vh;
		/* allow dropdowns to escape without enlarging the card */
		overflow: visible;
		border: 1px solid var(--border);
		/* hide the scrollbar but keep scrolling functional */
		scrollbar-width: none;           /* Firefox */
		-ms-overflow-style: none;        /* IE/Edge */
	}
	.modal-content::-webkit-scrollbar {
		display: none;                   /* Chrome/Safari */
	}

	.modal-header {
		padding: 0.9rem 1rem;
		border-bottom: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.modal-header h5 {
		color: var(--text-primary);
		font-size: 1rem;
	}

	.modal-body {
		padding: 0.6rem 1rem 1.5rem;
		/* modal body becomes the scrollable area so dropdowns don't resize modal */
		max-height: calc(78vh - 110px);
		overflow-y: auto;
	}

	/* Shrink CustomSelect triggers inside the modal so form is compact */
	.modal-body :global(.custom-dropdown-trigger) {
		height: 36px;
		padding: 0.35rem 0.6rem;
		font-size: 0.82rem;
	}

	/* Distance row: make input and unit selector equal height */
	.distance-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}

	.distance-input {
		flex: 1 1 auto;
		min-width: 0;
	}

	.unit-select-wrapper {
		flex: 0 0 80px;
		max-width: 80px;
		display: flex;
	}

	.unit-select-wrapper :global(.dropdown-wrapper) {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.unit-select-wrapper :global(.custom-dropdown-trigger) {
		height: 100%;
		padding: 0.35rem 0.5rem;
		font-size: 0.85rem;
	}

	/* Tighter TimeSelector rows inside modal */
	.modal-body :global(.time-selector) {
		gap: 0.35rem;
	}
	.modal-body :global(.time-selector .row) {
		gap: 0.35rem;
	}
	.modal-body :global(.time-selector label) {
		font-size: 0.75rem;
		margin-bottom: 0.1rem;
	}

	.modal-footer {
		padding: 0.6rem 1rem;
		border-top: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.modal-footer .btn-wrapper {
		flex: 0 0 48%;
	}

	.modal-footer .btn {
		width: 100%;
		font-size: 0.85rem;
		padding: 0.4rem 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.form-label {
		color: var(--text-primary);
		font-size: 0.8rem;
		margin-bottom: 0;
	}

	.form-control {
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.85rem;
		height: 36px;
		transition: all 0.12s ease;
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
		font-size: 1.2rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.btn-close:hover {
		color: var(--text-primary);
	}

	@media (max-width: 480px) {
		.modal-content {
			max-height: 92vh;
			border-radius: 8px 8px 0 0;
			width: 100%;
			padding: 0.5rem 0.5rem 0.75rem 0.5rem;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		.modal-content::-webkit-scrollbar {
			display: none;
		}

		.modal-overlay {
			align-items: flex-end;
			justify-content: center;
		}

		.modal-header {
			padding: 0.6rem 0.75rem;
		}

		.modal-body {
			padding: 0.6rem 0.75rem;
		}

		.modal-footer {
			padding: 0.5rem 0.75rem;
		}

		/* narrower unit selector on mobile */
		.unit-select-wrapper {
			flex: 0 0 68px;
			max-width: 68px;
		}

		/* compact TimeSelector inside modal */
		.modal-body :global(.time-selector) {
			gap: 0.3rem;
		}

		.modal-body :global(.small-row) :global(.select-group) {
			min-width: 0;
			flex: 1 1 0;
		}
	}
</style>
