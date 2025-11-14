<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let searchPlaceholder: string = 'Search...';
	export let filters: { label: string; key: string; options: string[] }[] = [];

	let showFilters = false;
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};

	const toggleFilters = () => (showFilters = !showFilters);

	//-- Count how many filters are actually active --
	$: activeCount = Object.values(activeFilters).filter(
		(v) => v && !v.toLowerCase().includes('all')
	).length;

	//-- emit values upward whenever anything changes --
	$: dispatch('update', { searchTerm, activeFilters });

	//-- handle click outside dropdown --
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
		/>
	</div>

	<!-- Filter Button -->
	<div class="position-relative" id="filter-panel">
		<button
			class="btn filter-button position-relative d-flex align-items-center"
			type="button"
			on:click|stopPropagation={toggleFilters}
		>
			<i class="bi bi-funnel me-1"></i>
			<span class="d-none d-md-inline">Filters</span>
			{#if activeCount > 0}
				<span
					class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
					style="font-size: 0.7rem;"
				>
					{activeCount}
				</span>
			{/if}
		</button>

		{#if showFilters}
			<div
				class="position-absolute end-0 mt-2 p-3 rounded-4 shadow-sm filter-dropdown"
				style="width: 18rem; z-index: 1050; background-color: var(--bg-primary); border: 1px solid var(--border);"
			>
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h6 class="fw-semibold m-0" style="color: var(--text-primary);">Filters</h6>
					{#if activeCount > 0}
						<span
							class="badge rounded-pill bg-primary-subtle text-primary fw-semibold small"
							style="font-size: 0.75rem;"
						>
							{activeCount} active
						</span>
					{/if}
				</div>

				{#each filters as f}
					<div class="mb-3">
						<label class="form-label fw-inter-400" style="color: var(--text-muted);" for={f.key}>
							{f.label}
						</label>
						<select class="form-select custom-select" bind:value={activeFilters[f.key]}>
							{#each f.options as opt}
								<option class="options">{opt}</option>
							{/each}
						</select>
					</div>
				{/each}

				{#if activeCount > 0}
					<button class="btn w-100 mt-2 clear-btn" on:click={() => (activeFilters = {})}>
						<i class="bi bi-x me-1"></i> Clear Filters
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.form-control {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
	}
	.custom-search-input::placeholder {
		color: var(--text-muted);
	}
	.custom-search-input:focus {
		border: 1px solid var(--bg-card);
	}

	.filter-button {
		border: 1px solid var(--border);
		color: var(--text-muted);
		background-color: var(--bg-card);
		box-shadow: none;
		border-radius: 12px;
	}
	.filter-dropdown {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.custom-select {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		font-size: 0.9rem;
		padding: 0.55rem 0.75rem;
	}

	.clear-btn {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border: none;
		transition: background 0.2s ease;
	}
</style>
