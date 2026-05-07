<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount, tick } from 'svelte';

	export let fromDate: string;
	export let toDate: string;
	export let label: string = 'Date Range';
	export let onChange: (dates: { from: string; to: string }) => void = () => {};

	type DateField = 'from' | 'to';

	type CalendarDay = {
		iso: string;
		day: number;
		inCurrentMonth: boolean;
		disabled: boolean;
		selected: boolean;
		today: boolean;
	};

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	let wrapperElement: HTMLDivElement;
	let fromTriggerElement: HTMLButtonElement;
	let toTriggerElement: HTMLButtonElement;
	let calendarElement: HTMLDivElement;
	let openPicker: DateField | null = null;
	let calendarStyle = '';
	let calendarMonth = new Date().getMonth();
	let calendarYear = new Date().getFullYear();

	function parseDate(value: string | undefined) {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
		if (!match) return null;

		const year = Number(match[1]);
		const month = Number(match[2]) - 1;
		const day = Number(match[3]);
		const date = new Date(year, month, day);

		if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
			return null;
		}

		return date;
	}

	function toIsoDate(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getActiveValue(field: DateField) {
		return field === 'from' ? fromDate : toDate;
	}

	function isDateDisabled(iso: string, field: DateField | null) {
		if (field === 'from' && toDate && iso > toDate) return true;
		if (field === 'to' && fromDate && iso < fromDate) return true;
		return false;
	}

	function buildCalendarDays(year: number, month: number, field: DateField | null): CalendarDay[] {
		const firstDay = new Date(year, month, 1);
		const startDate = new Date(year, month, 1 - firstDay.getDay());
		const selectedIso = field ? getActiveValue(field) : '';
		const todayIso = toIsoDate(new Date());

		return Array.from({ length: 42 }, (_, index) => {
			const date = new Date(
				startDate.getFullYear(),
				startDate.getMonth(),
				startDate.getDate() + index
			);
			const iso = toIsoDate(date);

			return {
				iso,
				day: date.getDate(),
				inCurrentMonth: date.getMonth() === month,
				disabled: isDateDisabled(iso, field),
				selected: iso === selectedIso,
				today: iso === todayIso
			};
		});
	}

	function setCalendarMonthFromValue(field: DateField) {
		const selectedDate = parseDate(getActiveValue(field)) ?? new Date();
		calendarMonth = selectedDate.getMonth();
		calendarYear = selectedDate.getFullYear();
	}

	function getActiveTrigger() {
		if (openPicker === 'from') return fromTriggerElement;
		if (openPicker === 'to') return toTriggerElement;
		return null;
	}

	function computeCalendarPosition() {
		if (!browser || !openPicker) return;

		const trigger = getActiveTrigger();
		if (!trigger) return;

		const rect = trigger.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const gap = 8;
		const edgeOffset = 12;
		const width = Math.min(292, Math.max(220, viewportWidth - edgeOffset * 2));
		const calendarHeight = calendarElement?.offsetHeight || 324;
		const maxLeft = Math.max(edgeOffset, viewportWidth - width - edgeOffset);
		let left = Math.min(Math.max(edgeOffset, rect.left), maxLeft);
		let top = rect.bottom + gap;

		if (
			top + calendarHeight > viewportHeight - edgeOffset &&
			rect.top - calendarHeight - gap >= edgeOffset
		) {
			top = rect.top - calendarHeight - gap;
		}

		if (top + calendarHeight > viewportHeight - edgeOffset) {
			top = Math.max(edgeOffset, viewportHeight - calendarHeight - edgeOffset);
		}

		calendarStyle = `position: fixed; top: ${top}px; left: ${left}px; width: ${width}px; z-index: var(--dropdown-z-index, 1060);`;
	}

	async function openCalendar(field: DateField) {
		if (openPicker !== field) {
			setCalendarMonthFromValue(field);
		}

		openPicker = field;
		computeCalendarPosition();
		await tick();
		computeCalendarPosition();
	}

	async function changeMonth(offset: number) {
		const nextMonth = new Date(calendarYear, calendarMonth + offset, 1);
		calendarMonth = nextMonth.getMonth();
		calendarYear = nextMonth.getFullYear();
		await tick();
		computeCalendarPosition();
	}

	function selectDate(day: CalendarDay) {
		if (!openPicker || day.disabled) return;

		if (openPicker === 'from') {
			fromDate = day.iso;
		} else {
			toDate = day.iso;
		}

		onChange({ from: fromDate, to: toDate });
		openPicker = null;
	}

	function handleTriggerKeydown(event: KeyboardEvent, field: DateField) {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
			event.preventDefault();
			openCalendar(field);
		}
	}

	function handleCalendarKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			openPicker = null;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser || !openPicker) return;

		const target = event.target as Node;
		if (wrapperElement?.contains(target) || calendarElement?.contains(target)) return;

		openPicker = null;
	}

	onMount(() => {
		if (!browser) return;

		document.addEventListener('click', handleClickOutside, true);
		window.addEventListener('resize', computeCalendarPosition);
		window.addEventListener('scroll', computeCalendarPosition, true);
	});

	onDestroy(() => {
		if (!browser) return;

		document.removeEventListener('click', handleClickOutside, true);
		window.removeEventListener('resize', computeCalendarPosition);
		window.removeEventListener('scroll', computeCalendarPosition, true);
	});

	$: calendarDays = buildCalendarDays(calendarYear, calendarMonth, openPicker);
	$: calendarTitle = `${monthNames[calendarMonth]} ${calendarYear}`;
</script>

<div class="date-filter-wrapper" bind:this={wrapperElement}>
	<fieldset class="date-filter-fieldset">
		<legend class="date-filter-legend">{label}</legend>
		<div class="date-filter-inputs">
			<div class="date-field">
				<label class="date-field-label" for="date-from">From</label>
				<button
					id="date-from"
					class="date-field-trigger"
					class:open={openPicker === 'from'}
					type="button"
					bind:this={fromTriggerElement}
					on:click={() => openCalendar('from')}
					on:keydown={(event) => handleTriggerKeydown(event, 'from')}
					aria-haspopup="dialog"
					aria-expanded={openPicker === 'from'}
				>
					<span class="date-field-value">{fromDate || 'Select date'}</span>
					<i class="bi bi-calendar3 text-primary date-field-icon" aria-hidden="true"></i>
				</button>
			</div>

			<span class="date-separator">&rarr;</span>

			<div class="date-field">
				<label class="date-field-label" for="date-to">To</label>
				<button
					id="date-to"
					class="date-field-trigger"
					class:open={openPicker === 'to'}
					type="button"
					bind:this={toTriggerElement}
					on:click={() => openCalendar('to')}
					on:keydown={(event) => handleTriggerKeydown(event, 'to')}
					aria-haspopup="dialog"
					aria-expanded={openPicker === 'to'}
				>
					<span class="date-field-value">{toDate || 'Select date'}</span>
					<i class="bi bi-calendar3 text-primary date-field-icon" aria-hidden="true"></i>
				</button>
			</div>
		</div>
	</fieldset>

	{#if openPicker}
		<div
			class="date-calendar-popover"
			bind:this={calendarElement}
			style={calendarStyle}
			role="dialog"
			aria-label={`${openPicker === 'from' ? 'From' : 'To'} date calendar`}
			tabindex="-1"
			on:click|stopPropagation
			on:keydown={handleCalendarKeydown}
		>
			<div class="date-calendar-header">
				<button
					class="date-calendar-nav"
					type="button"
					on:click={() => changeMonth(-1)}
					aria-label="Previous month"
				>
					<i class="bi bi-chevron-left" aria-hidden="true"></i>
				</button>
				<div class="date-calendar-title">{calendarTitle}</div>
				<button
					class="date-calendar-nav"
					type="button"
					on:click={() => changeMonth(1)}
					aria-label="Next month"
				>
					<i class="bi bi-chevron-right" aria-hidden="true"></i>
				</button>
			</div>

			<div class="date-calendar-weekdays" aria-hidden="true">
				{#each weekDays as weekDay}
					<span>{weekDay}</span>
				{/each}
			</div>

			<div class="date-calendar-grid">
				{#each calendarDays as day}
					<button
						class="date-calendar-day"
						class:outside-month={!day.inCurrentMonth}
						class:selected={day.selected}
						class:today={day.today}
						type="button"
						disabled={day.disabled}
						on:click={() => selectDate(day)}
						aria-label={`Select ${day.iso}`}
						aria-pressed={day.selected}
					>
						{day.day}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.date-filter-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.date-filter-fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.date-filter-legend {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0;
		margin: 0 0 6px 0;
		display: block;
	}

	.date-filter-inputs {
		display: flex;
		align-items: flex-end;
		gap: 12px;
		flex-wrap: wrap;
		overflow: visible;
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 156px;
	}

	.date-field-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.9;
	}

	.date-field-trigger {
		height: 42px;
		width: 100%;
		padding: 0 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		outline: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			background 0.15s ease;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		text-align: left;
	}

	.date-field-trigger:hover {
		border-color: var(--edit-btn);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.date-field-trigger:focus,
	.date-field-trigger.open {
		border-color: var(--edit-btn);
		box-shadow: 0 0 0 2px rgba(var(--edit-btn-rgb, 13, 110, 253), 0.15);
	}

	.date-field-value {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.date-field-icon {
		flex: 0 0 auto;
		font-size: 14px;
		line-height: 1;
		color: var(--text-primary) !important;
	}

	.date-separator {
		font-size: 18px;
		font-weight: 500;
		color: var(--text-muted);
		line-height: 42px;
		padding: 0 4px;
	}

	.date-calendar-popover {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
		max-height: calc(100vh - 24px);
		overflow-y: auto;
		padding: 12px;
	}

	.date-calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 10px;
	}

	.date-calendar-title {
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 700;
		text-align: center;
	}

	.date-calendar-nav {
		width: 30px;
		height: 30px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg-primary);
		color: var(--text-primary);
		display: inline-grid;
		place-items: center;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.date-calendar-nav:hover,
	.date-calendar-nav:focus {
		background: var(--dropdown-hover-bg);
		border-color: var(--edit-btn);
		outline: none;
	}

	.date-calendar-weekdays,
	.date-calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 4px;
	}

	.date-calendar-weekdays {
		margin-bottom: 6px;
	}

	.date-calendar-weekdays span {
		color: var(--text-muted);
		font-size: 10px;
		font-weight: 700;
		text-align: center;
		text-transform: uppercase;
	}

	.date-calendar-day {
		aspect-ratio: 1;
		min-width: 0;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--text-primary);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.date-calendar-day:hover:not(:disabled),
	.date-calendar-day:focus:not(:disabled) {
		background: var(--dropdown-hover-bg);
		border-color: var(--border);
		outline: none;
	}

	.date-calendar-day.outside-month {
		color: var(--text-muted);
		opacity: 0.68;
	}

	.date-calendar-day.today:not(.selected) {
		border-color: var(--edit-btn);
	}

	.date-calendar-day.selected {
		background: var(--edit-btn);
		border-color: var(--edit-btn);
		color: var(--bs-white, #fff);
	}

	.date-calendar-day:disabled {
		color: var(--text-muted);
		opacity: 0.35;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.date-filter-inputs {
			gap: 8px;
			flex-wrap: nowrap;
		}

		.date-field {
			min-width: 0;
			flex: 1 1 0;
		}

		.date-separator {
			display: none;
		}
	}
</style>
