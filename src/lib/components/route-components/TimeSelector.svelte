<script context="module" lang="ts">
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	export interface TimeSelection {
		days?: number;
		hours?: number;
		minutes?: number;
		period?: 'AM' | 'PM';
	}
	export let value: TimeSelection = { days: 1, hours: 12, minutes: 0, period: 'AM' };

	// options (strings for CustomSelect)
	const daysOptions = Array.from({ length: 11 }, (_, i) => String(i+1)); // 1-10 days
	const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1)); // 1-12 hours
	const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00-59
	const periodOptions: Array<'AM' | 'PM'> = ['AM', 'PM'];

	// helpers to parse back
	function updateDays(v: string) {
		value.days = parseInt(v);
	}
	function updateHours(v: string) {
		value.hours = parseInt(v);
	}
	function updateMinutes(v: string) {
		value.minutes = parseInt(v);
	}
	function updatePeriod(v: string) {
		value.period = v as 'AM' | 'PM';
	}
</script>

<div class="time-selector d-flex flex-wrap align-items-end">
	<div class="select-group">
		<label for="day" >Day</label>
		<CustomSelect
			label="Day"
			value={String(value.days)}
			options={daysOptions}
			onChange={updateDays}
		/>
	</div>
	<div class="select-group">
		<label for="hour">Hour</label>
		<CustomSelect
			label="Hour"
			value={String(value.hours)}
			options={hoursOptions}
			onChange={updateHours}
		/>
	</div>
	<div class="select-group">
		<label for="minute">Minute</label>
		<CustomSelect
			label="Minute"
			value={String(value.minutes).padStart(2, '0')}
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
		gap: 0.75rem;
	}

    label {
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        color: var(--text-muted);
    }
	.select-group {
		display: flex;
		flex-direction: column;
		min-width: 5rem;
	}

	.select-group :global(.dropdown-wrapper) {
		width: 100%;
	}

	/* auto-expand on wider screens */
	@media (min-width: 576px) {
		.time-selector {
			gap: 1rem;
		}
		.select-group {
			min-width: 6rem;
		}
	}
</style>
