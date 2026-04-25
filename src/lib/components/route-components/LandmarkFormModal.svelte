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
	export let isFirstLandmark: boolean = false;
	export let existingLandmarks: any[] = [];

	//-- State --
	let formData: FormData = {
		landmarkName: '',
		arrivalTime: { days: 1, hours: 12, minutes: 0, period: 'AM' },
		departureTime: { days: 1, hours: 12, minutes: 0, period: 'AM' },
		distanceFromStart: '',
		distanceUnit: 'km' //-- 'm' or 'km' --
	};

	let timeError: string | null = null;
	let distanceError: string | null = null;
	const distanceOptions = ['km', 'm'];
	//-- UI: mark this landmark as last in route --
	let markAsLast = false;

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
		const days = (sel.days ?? 1) - 1;
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
			let unit = 'km';
			let display = dist;
			if (dist >= 1000) {
				unit = 'km';
				display = dist / 1000;
			}
			//-- convert stored delta to an actual time relative to starting time --
			const arrival = addSecondsToTime(startingTime, landmark.arrivalDelta || 0);
			const departure = addSecondsToTime(startingTime, landmark.departureDelta || 0);
			formData = {
				landmarkName: landmark.landmarkName || '',
				arrivalTime: { ...arrival, days: (arrival.days ?? 0) + 1 },
				departureTime: { ...departure, days: (departure.days ?? 0) + 1 },
				distanceFromStart: display,
				distanceUnit: unit
			};

			// prefill 'last' checkbox when editing if this is the last existing landmark
			const currentId = landmark?.id ?? landmark?.landmarkId;
			if (mode === 'edit' && existingLandmarks && existingLandmarks.length > 0) {
				const last = existingLandmarks[existingLandmarks.length - 1];
				const lastId = last?.id ?? last?.landmarkId;
				markAsLast = !!(currentId && lastId && String(currentId) === String(lastId));
			} else {
				markAsLast = false;
			}
		} else if (mode === 'create') {
			//-- default arrival/departure to starting time --
			const baseTime = addSecondsToTime(startingTime, 0);
			const ensureDaysOne = (t: any) => ({ ...t, days: (t.days ?? 0) < 1 ? 1 : t.days });
			//-- first landmark: lock times to route starting time (zero delta) --
			const defaultTime = ensureDaysOne(baseTime);
			//-- default distance: first landmark is always 0, otherwise use last landmark's distance or 0 if none --
			let defaultMeters = 0;
			if (isFirstLandmark) {
				defaultMeters = 0;
			} else if (existingLandmarks && existingLandmarks.length > 0) {
				const last = existingLandmarks[existingLandmarks.length - 1];
				defaultMeters = Number(last.distanceFromStart ?? last.distance_from_start ?? 0) || 0;
			} else {
				defaultMeters = Number(landmark?.distanceFromStart ?? 0) || 0;
			}

			const defaultUnit = 'km';
			const displayValue = defaultUnit === 'km' ? defaultMeters / 1000 : defaultMeters;

			formData = {
				landmarkName: landmark?.landmarkName || '',
				arrivalTime: { ...defaultTime },
				departureTime: { ...defaultTime },
				distanceFromStart: displayValue,
				distanceUnit: defaultUnit
			};

			markAsLast = false;
		}
	}

	//-- When markAsLast is enabled, mirror arrival time to departure time automatically --
	$: if (markAsLast) {
		formData.departureTime = { ...formData.arrivalTime };
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

	//-- Reactive: When modal is open, lock scroll and reset errors --
	$: if (browser) {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			timeError = null;
			distanceError = null;
		} else {
			document.body.style.overflow = '';
		}
	}

	//-- handle form submission --
	function saveLandmark() {
		//-- clear prior errors --
		timeError = null;
		distanceError = null;

		//-- parse and normalize distance input (to integer meters) --
		const rawDistance = parseFloat(String(formData.distanceFromStart));
		if (!Number.isFinite(rawDistance) || isNaN(rawDistance)) {
			distanceError = 'Please enter a valid distance.';
			return;
		}
		let distMeters =
			formData.distanceUnit === 'km' ? Math.round(rawDistance * 1000) : Math.round(rawDistance);

		//-- basic validation: non-negative, first-landmark must be 0, others must be > 0
		if (distMeters < 0) {
			distanceError = 'Distance must be 0 or greater.';
			return;
		}
		if (isFirstLandmark && distMeters !== 0) {
			distanceError = 'First landmark distance must be 0.';
			return;
		}
		if (!isFirstLandmark && distMeters === 0) {
			// Allow setting distance to 0 for a non-first landmark only if
			// no other non-first landmark in the route already has distance 0.
			const currentId = landmark?.id ?? landmark?.landmarkId;
			const otherZeroExists = existingLandmarks.some((l) => {
				const existingId = l.id ?? l.landmarkId;
				if (mode === 'edit' && existingId && currentId && existingId === currentId) return false;
				const existingDist = Number(l.distanceFromStart ?? l.distance_from_start ?? 0) || 0;
				return existingDist === 0;
			});
			if (otherZeroExists) {
				distanceError = 'Another landmark already has zero distance.';
				return;
			}
		}

		//-- first landmark or any zero-distance landmark: force zero deltas (times = starting time) --
		let arrivalDelta = 0;
		let departureDelta = 0;

		if (distMeters !== 0) {
			// Non-zero distance: perform time and duplicate checks
			if (!isFirstLandmark) {
				//-- check duplicate distance among existing landmarks (exclude same landmark when editing)
				const duplicate = existingLandmarks.some((l) => {
					const existingId = l.id ?? l.landmarkId;
					const currentId = landmark?.id ?? landmark?.landmarkId;
					if (mode === 'edit' && existingId && currentId && existingId === currentId) return false;
					return Number(l.distanceFromStart || l.distance_from_start || 0) === distMeters;
				});
				if (duplicate) {
					distanceError = 'Another landmark already has the same distance from start.';
					return;
				}
			}

			const startSeconds = parseStartingTime(startingTime) * 60;
			const arrivalSeconds = selectionToSeconds(formData.arrivalTime);
			const departureSeconds = selectionToSeconds(formData.departureTime);
			if (departureSeconds < arrivalSeconds) {
				timeError = 'Departure time must be the same or after Arrival time.';
				return;
			}
			arrivalDelta = arrivalSeconds - startSeconds;
			departureDelta = departureSeconds - startSeconds;

			//-- negative delta check (before start) --
			if (arrivalDelta < 0 || departureDelta < 0) {
				timeError = 'Selected times cannot be before the route starting time.';
				return;
			}

			//-- duplicate time (delta) checks among existing landmarks (exclude same landmark when editing) --
			const currentId = landmark?.id ?? landmark?.landmarkId;
			const dupArrival = existingLandmarks.some((l) => {
				const existingId = l.id ?? l.landmarkId;
				if (mode === 'edit' && existingId && currentId && existingId === currentId) return false;
				const ev = l.arrivalDelta ?? l.arrival_delta ?? l.arrival;
				return typeof ev === 'number' && ev === arrivalDelta;
			});
			if (dupArrival) {
				timeError = 'Another landmark already has the same arrival time delta.';
				return;
			}
			const dupDeparture = existingLandmarks.some((l) => {
				const existingId = l.id ?? l.landmarkId;
				if (mode === 'edit' && existingId && currentId && existingId === currentId) return false;
				const ev = l.departureDelta ?? l.departure_delta ?? l.departure;
				return typeof ev === 'number' && ev === departureDelta;
			});
			if (dupDeparture) {
				timeError = 'Another landmark already has the same departure time delta.';
				return;
			}
		}

		//-- emit save event with all details --
		const detail: any = {
			landmarkName: formData.landmarkName,
			arrivalTime: formData.arrivalTime,
			departureTime: formData.departureTime,
			arrivalDelta,
			departureDelta,
			distanceFromStart: distMeters
		};
		//-- include IDs for editing existing landmarks --
		detail.landmarkId = landmark?.landmarkId ?? landmark?.id;
		if (landmark && landmark.id != null) detail.entryId = landmark.id;
		dispatch('save', detail);
		console.log('Saved landmark:', detail);
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
					{mode === 'edit' ? 'Edit Landmark' : 'Add New Landmark'}
				</h5>
			</div>
			<div class="modal-body">
				{#if timeError || distanceError}
					<div class="errors-top">
						{#if timeError}
							<div class="error-box mt-2" role="alert" aria-live="assertive">
								<i class="bi bi-exclamation-triangle-fill error-icon" aria-hidden="true"></i>
								<div class="error-text">{timeError}</div>
							</div>
						{/if}
						{#if distanceError}
							<div class="error-box mt-2" role="alert" aria-live="assertive">
								<i class="bi bi-exclamation-circle-fill error-icon" aria-hidden="true"></i>
								<div class="error-text">{distanceError}</div>
							</div>
						{/if}
					</div>
				{/if}
				<!-- Landmark Name -->
				<div class="form-group mb-2">
					<label for="landmark-name" class="form-label fw-inter-600">Landmark Name</label>
					<input
						id="landmark-name"
						type="text"
						class="form-control"
						bind:value={formData.landmarkName}
						disabled
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
							id="distance-from-start"
							type="number"
							class="form-control distance-input"
							bind:value={formData.distanceFromStart}
							on:input={() => (distanceError = null)}
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

				{#if formData.distanceFromStart !== 0 && formData.distanceFromStart !== null}
					<div class="form-group mb-2">
						<div class="form-check">
							<input
								type="checkbox"
								id="is-last-landmark"
								class="form-check-input"
								bind:checked={markAsLast}
								on:change={() => {
									if (markAsLast) formData.departureTime = { ...formData.arrivalTime };
								}}
							/>
							<label for="is-last-landmark" class="form-check-label"
								>Is this the last landmark?</label
							>
						</div>
					</div>
				{/if}
				{#if formData.distanceFromStart !== 0 && formData.distanceFromStart !== null}
					<!-- Arrival Time -->
					<div class="form-group mb-2">
						<label id="arrival-time-label" for="arrival-time" class="form-label fw-inter-600"
							>Arrival Time</label
						>
						<div aria-labelledby="arrival-time-label">
							<TimeSelector bind:value={formData.arrivalTime} />
						</div>
					</div>

					<!-- Departure Time -->
					<div class="form-group mb-2">
						<label id="departure-time-label" for="departure-time" class="form-label fw-inter-600"
							>Departure Time</label
						>
						<div aria-labelledby="departure-time-label">
							<TimeSelector bind:value={formData.departureTime} />
						</div>
					</div>
				{/if}
			</div>
			<div class="modal-footer d-flex align-items-center justify-content-center gap-2">
				<div class="btn-wrapper">
					<button class=" cancel-btn btn btn-secondary" on:click={closeModal}> Cancel </button>
				</div>
				<div class="btn-wrapper">
					<button class=" save-btn btn btn-primary" on:click={saveLandmark}>
						{mode === 'edit' ? 'Save Changes' : 'Add Landmark'}
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

	/* Error box for form validation messages */
	.error-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 235, 238, 0.95);
		border-left: 4px solid var(--error-color, #d32f2f);
		color: var(--error-color, #d32f2f);
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
	}

	.errors-top {
		position: sticky;
		top: 0.6rem;
		z-index: 30;
		padding-bottom: 0.5rem;
	}

	.error-icon {
		font-size: 1.05rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.error-text {
		line-height: 1.2;
		display: inline-flex;
		align-items: center;
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
		border: 1px solid var(--border);
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
