<script context="module" lang="ts">
export interface TimeSelection {
    days?: number;
    hours?: number;
    minutes?: number;
    period?: 'AM' | 'PM';
}
export let value: TimeSelection = { days: 0, hours: 12, minutes: 0, period: 'AM' };

// options
const daysOptions = Array.from({ length: 11 }, (_, i) => i); // 0-10 days
const hoursOptions = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 hours
const periodOptions: Array<'AM' | 'PM'> = ['AM', 'PM'];
const minutesOptions = Array.from({ length: 60 }, (_, i) => i); // 0-59 minutes

// ensure binding object exists
// svelte-ignore reactive_declaration_invalid_placement
$: if (!value) {
    value = { days: 0, hours: 0, minutes: 0, period: 'AM' };
}
</script>

<div class="time-selector d-flex gap-2 align-items-end">
    <div class="select-group d-flex flex-column">
        <label>Days</label>
        <select bind:value={value.days}>
            {#each daysOptions as d}
                <option value={d}>{d}</option>
            {/each}
        </select>
    </div>
    <div class="select-group d-flex flex-column">
        <label>Hours</label>
        <select bind:value={value.hours}>
            {#each hoursOptions as h}
                <option value={h}>{h}</option>
            {/each}
        </select>
    </div>
    <div class="select-group d-flex flex-column">
        <label>Minutes</label>
        <select bind:value={value.minutes}>
            {#each minutesOptions as m}
                <option value={m}>{m.toString().padStart(2, '0')}</option>
            {/each}
        </select>
    </div>    <div class="select-group d-flex flex-column">
        <label>AM/PM</label>
        <select bind:value={value.period}>
            {#each periodOptions as p}
                <option value={p}>{p}</option>
            {/each}
        </select>
    </div></div>

<style>
label {
    font-size: 0.75rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.9rem;
    min-width: 3.5rem;
}

/* ensure selects are the same width on small screens */
.time-selector .select-group {
    min-width: 3.5rem;
}
</style>