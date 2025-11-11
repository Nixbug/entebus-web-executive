<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let searchPlaceholder: string = 'Search...';
	export let filters: { label: string; key: string; options: string[] }[] = [];

	let showFilters = false;
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};

	const toggleFilters = () => (showFilters = !showFilters);

	// emit values upward whenever anything changes
	$: dispatch('update', { searchTerm, activeFilters });

	// handle click outside dropdown
	function handleClickOutside(event: MouseEvent) {
		const dropdown = document.getElementById('filter-panel');
		if (dropdown && !dropdown.contains(event.target as Node)) {
			showFilters = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="d-flex justify-content-between align-items-center mb-3 gap-3">
	<!-- Search -->
	<div class="position-relative" style="width: 80rem;">
		<i
			class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3"
			style="color: var(--text-muted);"
		></i>

		<input
			type="text"
			class="form-control form-control-lg ps-5 custom-search-input"
			placeholder={searchPlaceholder}
			bind:value={searchTerm}
			style="background-color: var(--bg-card); border: none;"
		/>
	</div>

	<!-- Filter Button -->
	<div class="position-relative" id="filter-panel" style=" background-color: var(--bg-card);">
		<button
			class="btn btn-outline-secondary"
			type="button"
			on:click|stopPropagation={toggleFilters}
		>
			<i class="bi bi-funnel me-1"></i> Filters
		</button>

		{#if showFilters}
			<div
				class="position-absolute end-0 mt-2 p-3 border rounded-4 shadow-sm"
				style="width: 18rem; z-index: 1050; background-color: var(--bg-primary);"
			>
				<h6 class="fw-semibold mb-3" style="color: var(--text-primary);">Filters</h6>
				{#each filters as f}
					<div class="mb-3">
						<label class="form-label fw-inter-400" style="color: var(--text-muted);" for={f.key}
							>{f.label}</label
						>
						<select class="form-select" bind:value={activeFilters[f.key]}>
							{#each f.options as opt}
								<option>{opt}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-search-input::placeholder {
		color: var(--text-muted);
		opacity: 1;
	}
	.custom-search-input {
		color: var(--text-primary);
		box-shadow: none;
		border-radius: 0.75rem;
	}
	.custom-search-input:focus {
		border: 1px solid var(--bs-primary);
		box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
	}
</style>
