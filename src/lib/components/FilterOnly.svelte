<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CustomSelect from './CustomSelect.svelte';

	export let label: string = 'Filter';
	export let options: string[] = [];
	export let value: string = '';

	const dispatch = createEventDispatcher();

	function handleChange(v: any) {
		const val = String(v ?? '');
		value = val;
		dispatch('update', { value: val });
	}
</script>

<div class="filter-only">
	<label class="filter-label" for={label}>{label}</label>
	<div>
		<CustomSelect {label} {options} {value} onChange={(v) => handleChange(v)} />
	</div>
</div>

<style>
	.filter-only {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 160px;
	}
	.filter-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
