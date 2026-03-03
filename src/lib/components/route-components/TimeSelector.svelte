<script lang="ts">
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import type { TimeSelection } from '$lib/types/type';

	// instance prop (use 0-based days to match callers that use 0)
	export let value: TimeSelection = { days: 0, hours: 12, minutes: 0, period: 'AM' };

	// options (strings for CustomSelect)
	const daysOptions = Array.from({ length: 11 }, (_, i) => String(i)); // 0-10 days
	const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1)); // 1-12 hours
	const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00-59
	const periodOptions: Array<'AM' | 'PM'> = ['AM', 'PM'];

	// helpers to parse back — reassign `value` so Svelte sees the change
	function updateDays(v: string) {
		value = { ...value, days: parseInt(v) };
	}
	function updateHours(v: string) {
		value = { ...value, hours: parseInt(v) };
	}
	function updateMinutes(v: string) {
		value = { ...value, minutes: parseInt(v) };
	}
	function updatePeriod(v: string) {
		value = { ...value, period: v as 'AM' | 'PM' };
	}
</script>

<div class="time-selector d-flex flex-wrap align-items-end">
	<div class="select-group">
		<label for="day" >Day</label>
		<CustomSelect
			label="Day"
			value={String(value.days ?? 0)}
			options={daysOptions}
			onChange={updateDays}
		/>
	</div>
	<div class="select-group">
		<label for="hour">Hour</label>
		<CustomSelect
			label="Hour"
			value={String(value.hours ?? 12)}
			options={hoursOptions}
			onChange={updateHours}
		/>
	</div>
	<div class="select-group">
		<label for="minute">Minute</label>
		<CustomSelect
			label="Minute"
			value={String(value.minutes ?? 0).padStart(2, '0')}
			options={minutesOptions}
			onChange={updateMinutes}
		/>
	</div>
	<div class="select-group">
		<label for="period">AM/PM</label>
		<CustomSelect
			label="Period"
			value={value.period}
			options={periodOptions}
			onChange={updatePeriod}
		/>
	</div>
</div>

<style>
	.time-selector {
		gap: 0.6rem;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	label {
		font-size: 0.85rem;
		margin-bottom: 0.2rem;
		color: var(--text-muted);
	}

	.select-group {
		display: flex;
		flex-direction: column;
		flex: 1 1 4rem;
		min-width: 3.5rem;
	}

	.select-group :global(.dropdown-wrapper) {
		width: 100%;
	}

	/* auto-expand on wider screens */
	@media (min-width: 576px) {
		.time-selector {
			gap: 0.9rem;
		}
		.select-group {
			min-width: 5.5rem;
			flex: 0 0 auto;
		}
	}

	/* compact on very small screens */
	@media (max-width: 480px) {
		.time-selector {
			gap: 0.4rem;
		}
		.select-group {
			min-width: 3rem;
			flex: 1 1 3rem;
		}
		label {
			font-size: 0.75rem;
			margin-bottom: 0.15rem;
		}
	}
</style>
