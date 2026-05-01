<script lang="ts">
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import type { TimeSelection } from '$lib/types/type';
	import { createEventDispatcher } from 'svelte';

	export let value: TimeSelection = { days: 1, hours: 12, minutes: 0, period: 'AM' }; //-- passed in as a single object for easier binding and updates --
	const dispatch = createEventDispatcher();
	export let showDays: boolean = true; //-- show day selector optionally --

	//-- Options for selects --
	const daysOptions = Array.from({ length: 10 }, (_, i) => String(i + 1)); // 1-10 days
	const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1)); // 1-12 hours
	const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00-59
	const periodOptions: Array<'AM' | 'PM'> = ['AM', 'PM'];

	//-- helpers to parse back — reassign `value` so Svelte sees the change and notify parent --
	function updateDays(v: string) {
		value = { ...value, days: parseInt(v) };
		dispatch('change', value);
	}
	function updateHours(v: string) {
		value = { ...value, hours: parseInt(v) };
		dispatch('change', value);
	}
	function updateMinutes(v: string) {
		value = { ...value, minutes: parseInt(v) };
		dispatch('change', value);
	}
	function updatePeriod(v: string) {
		value = { ...value, period: v as 'AM' | 'PM' };
		dispatch('change', value);
	}
</script>

<div class="time-selector">
	{#if showDays}
		<div class="day-row">
			<div class="select-group full">
				<label for="day">Day</label>
				<CustomSelect
					label="Day"
					id="day"
					value={String(value.days ?? 1)}
					options={daysOptions}
					onChange={updateDays}
				/>
			</div>
		</div>
	{/if}

	<div class="small-row">
		<div class="select-group">
			<label for="hour">Hour</label>
			<CustomSelect
				label="Hour"
				id="hour"
				value={String(value.hours ?? 12)}
				options={hoursOptions}
				onChange={updateHours}
			/>
		</div>

		<div class="select-group">
			<label for="minute">Minute</label>
			<CustomSelect
				label="Minute"
				id="minute"
				value={String(value.minutes ?? 0).padStart(2, '0')}
				options={minutesOptions}
				onChange={updateMinutes}
			/>
		</div>

		<div class="select-group">
			<label for="period">AM/PM</label>
			<CustomSelect
				label="Period"
				id="period"
				value={value.period}
				options={periodOptions}
				onChange={updatePeriod}
			/>
		</div>
	</div>
</div>

<style>
	.time-selector {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	label {
		font-size: 0.85rem;
		margin-bottom: 0.2rem;
		color: var(--text-muted);
	}

	.select-group {
		display: flex;
		flex-direction: column;
		min-width: 3.5rem;
	}

	.day-row .select-group.full {
		width: 100%;
	}

	.small-row {
		display: flex;
		gap: 0.6rem;
	}
	.small-row .select-group {
		flex: 1 1 0;
		min-width: 0;
	}

	.select-group :global(.dropdown-wrapper) {
		width: 100%;
	}

	@media (min-width: 576px) {
		.time-selector {
			gap: 0.9rem;
		}
		.day-row .select-group.full {
			width: 100%;
		}
		.small-row {
			gap: 0.9rem;
		}
		.small-row .select-group {
			min-width: 5.5rem;
			flex: 1 1 0;
		}
	}

	@media (max-width: 480px) {
		.time-selector {
			gap: 0.4rem;
		}
		.small-row {
			gap: 0.35rem;
		}
		.small-row .select-group {
			flex: 1 1 0;
			min-width: 2.6rem;
		}
		label {
			font-size: 0.75rem;
			margin-bottom: 0.15rem;
		}
	}
</style>
