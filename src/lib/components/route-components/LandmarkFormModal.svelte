<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TimeSelector from './TimeSelector.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { parseStartingTime } from '$lib/helpers';
	import { browser } from '$app/environment';
	import type { TimeSelection } from '$lib/types/type';

	//-- Form data structure --
	interface FormData {
		landmarkName: string;
		arrivalTime: TimeSelection;
		departureTime: TimeSelection;
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
		distanceUnit: 'm' //-- 'm' or 'km' --
	};
	const distanceOptions = ['m', 'km'];

	//-- Helper: convert distance unit --
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

	//-- Helper: convert 24h to 12h format --
	function to12Hour(hours24: number): { hours: number; period: 'AM' | 'PM' } {
		const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
		let hours = hours24 % 12;
		if (hours === 0) hours = 12;
		return { hours, period };
	}

	//-- Helper: add seconds to starting time and return a TimeSelection object --
	function addSecondsToTime(startTime: string, delta: number) {
		const base = parseStartingTime(startTime) * 60;
		const total = base + delta;
		const days = Math.floor(total / 86400);
		const rem = total % 86400;
		const hours24 = Math.floor(rem / 3600);
		const minutes = Math.floor((rem % 3600) / 60);
		const { hours, period } = to12Hour(hours24);
		return { days, hours, minutes, period };
	}

	//-- Helper: convert TimeSelection back to total seconds from start --
	function selectionToSeconds(sel: TimeSelection) {
		const days = sel.days ?? 0;
		const hours12 = sel.hours ?? 12;
		const minutes = sel.minutes ?? 0;
		const period: 'AM' | 'PM' = sel.period ?? 'AM';

		let hour24 = hours12 % 12;
		if (period === 'PM') hour24 += 12;

		return days * 86400 + hour24 * 3600 + minutes * 60;
	}

	//-- Events --
	const dispatch = createEventDispatcher();

	//-- Reactive: When landmark changes or modal opens, populate form data --
	$: if (isOpen && (landmark || mode === 'create')) {
		if (mode === 'edit') {
			//-- prefill unit depending on value size --
			let dist = landmark.distanceFromStart || 0;
			let unit = 'm';
			let display = dist;
			if (dist >= 1000) {
				unit = 'km';
				display = dist / 1000;
			}
			formData = {
				landmarkName: landmark.landmarkName || '',
				//-- convert stored delta to an actual time relative to starting time --
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

	//-- close modal and reset form --
	function closeModal() {
		dispatch('close');
	}

	//-- keyboard handler for the overlay so it is accessible --
	function handleOverlayKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			closeModal();
		}
	}

	//-- disable page scrolling while modal is visible --
	$: if (browser) {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	//-- handle form submission --
	function handleSubmit() {
		//-- convert selection back to seconds and derive delta relative to starting time --
		const startSeconds = parseStartingTime(startingTime) * 60;
		const arrivalSeconds = selectionToSeconds(formData.arrivalTime);
		const departureSeconds = selectionToSeconds(formData.departureTime);
		//-- convert distance to meters always --
		let distMeters = parseFloat(String(formData.distanceFromStart)) || 0;
		if (formData.distanceUnit === 'km') {
			distMeters *= 1000;
		}
		//-- emit save event with all details, including deltas and distance in meters for easier backend handling --
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
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Close modal"
		on:click={closeModal}
		on:keydown={handleOverlayKeyDown}
	>
		<div
			class="modal-content"
			role="dialog"
			tabindex="0"
			aria-modal="true"
			aria-labelledby="landmark-modal-title"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="modal-header d-flex align-items-center justify-content-between">
				<h5 class="fw-inter-700 mb-0" id="landmark-modal-title">
					{mode === 'edit' ? 'Edit Landmark' : 'Create Landmark'}
				</h5>
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
				<hr style="color: var(--text-primary);" />
				<!-- Distance from Start -->
				<div class="form-group mb-1">
					<label for="distance-from-start" class="form-label fw-inter-600"
						>Distance from Start</label
					>
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

				<!-- Arrival Time -->
				<div class="form-group mb-2">
					<label for="arrival-time" class="form-label fw-inter-600">Arrival Time</label>
					<TimeSelector bind:value={formData.arrivalTime} />
				</div>

				<!-- Departure Time -->
				<div class="form-group mb-2">
					<label for="departure-time" class="form-label fw-inter-600">Departure Time</label>
					<TimeSelector bind:value={formData.departureTime} />
				</div>
			</div>
			<div class="modal-footer d-flex align-items-center justify-content-center gap-2">
				<div class="btn-wrapper">
					<button class=" cancel-btn btn btn-secondary" on:click={closeModal}> Cancel </button>
				</div>
				<div class="btn-wrapper">
					<button class=" save-btn btn btn-primary" on:click={handleSubmit}>
						{mode === 'edit' ? 'Save Changes' : 'Create Landmark'}
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
		z-index: var(--overlay-z-index);
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--bg-card);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		max-width: 520px;
		width: 100%;
		max-height: 78vh;
		overflow: visible;
		border: 1px solid var(--border);
		background-clip: padding-box;
	}
	.modal-header {
		padding: 0.9rem 1rem;
		border-bottom: 1px solid var(--border);
		background-color: var(--bg-card);
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	.modal-header h5 {
		color: var(--text-primary);
		font-size: 1.3rem;
	}

	.modal-body {
		padding: 0.6rem 1rem 1.5rem;
		max-height: calc(78vh - 110px);
		overflow-y: auto;
	}
	/*-- Shrink CustomSelect triggers inside the modal so form is compact --*/
	.modal-body :global(.custom-dropdown-trigger) {
		height: 36px;
		padding: 0.35rem 0.6rem;
		font-size: 0.82rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.form-label {
		color: var(--text-primary);
		font-size: 0.9rem;
		margin-bottom: 0;
	}
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

	/*-- ensure CustomSelect dropdowns inside modal are full width of their container --*/
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

	/*-- Tighter TimeSelector rows inside modal --*/
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
		padding: 0.9rem 0.5rem;
		border-top: 1px solid var(--border);
		background-color: var(--bg-card);
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	.modal-footer .btn-wrapper {
		flex: 0 0 48%;
	}

	.modal-footer .btn {
		width: 100%;
		font-size: 0.85rem;
		padding: 0.4rem 0.5rem;
	}
	.cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 14px;
		height: 48px;
		font-size: 0.95rem;
		transition:
			background 0.15s ease,
			border 0.15s ease;
		flex: 1;
	}

	.cancel-btn:hover {
		background: var(--bg-primary);
		border-color: var(--border);
	}

	.save-btn {
		background: var(--edit-btn);
		color: #fff;
		border-radius: 10px;
		font-size: 0.95rem;
		border: none;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
		flex: 1;
		height: 48px;
	}

	.save-btn:hover {
		opacity: 0.95;
		transform: translateY(-1px);
	}

	@media (max-width: 480px) {
		.modal-content {
			max-height: 92vh;
			border-radius: 12px;
			width: 100%;
			padding: 0.5rem 0.5rem 0.75rem 0.5rem;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		.modal-content::-webkit-scrollbar {
			display: none;
		}

		.modal-overlay {
			align-items: center;
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

		.unit-select-wrapper {
			flex: 0 0 68px;
			max-width: 68px;
		}

		.modal-body :global(.time-selector) {
			gap: 0.3rem;
		}

		.modal-body :global(.small-row) :global(.select-group) {
			min-width: 0;
			flex: 1 1 0;
		}
	}
</style>
