<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CustomSelect from './CustomSelect.svelte';

	const dispatch = createEventDispatcher();

	export let searchPlaceholder: string = 'Search...';
	export let filters: { label: string; key: string; options: string[] }[] = [];
    export let showSearch: boolean = true;
    export let showFilter: boolean = true;

	let showFilters = false;
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	let openDropdown: string | null = null;

	const toggleFilters = () => (showFilters = !showFilters);

	//-- Count how many filters are actually active --
	$: activeCount = Object.values(activeFilters).filter(
		(v) => v && !v.toLowerCase().includes('all')
	).length;

	//-- Get active filters for display --
	$: displayedActiveFilters = filters
		.filter((f) => activeFilters[f.key] && !activeFilters[f.key].toLowerCase().includes('all'))
		.map((f) => ({
			label: f.label,
			value: activeFilters[f.key],
			key: f.key
		}));

	//-- emit values upward whenever anything changes --
	$: dispatch('update', { searchTerm, activeFilters });

	//-- handle click outside dropdown --
	function handleClickOutside(event: MouseEvent) {
		const dropdown = document.getElementById('filter-panel');
		if (dropdown && !dropdown.contains(event.target as Node)) {
			showFilters = false;
			openDropdown = null;
		}
	}

	function selectFilterOption(key: string, option: string) {
		activeFilters[key] = option;
		activeFilters = { ...activeFilters };
		openDropdown = null;
	}

	function clearAllFilters() {
		activeFilters = {};
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="search-filter-container">
	<!-- Search and Filter Row -->
	<div class="d-flex justify-content-between align-items-center mb-3 gap-2">
		<!-- Search -->
		{#if showSearch}
		<div class="position-relative search-container">
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
		{/if}

		<!-- Filter Button -->
		{#if showFilter}
		<div class="position-relative" id="filter-panel">
			<button
				class="btn filter-button position-relative d-flex align-items-center"
				type="button"
				on:click|stopPropagation={toggleFilters}
			>
				<i class="bi bi-funnel me-md-3"></i>
				<span class="d-none fw-inter-600 d-md-inline">Filters</span>
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
					style="width: 20rem; z-index: 1050; background-color: var(--bg-primary); border: 1px solid var(--border);"
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

					{#each filters as f (f.key)}
						<div class="mb-3">
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label
								class="form-label fw-inter-400 mb-2"
								style="color: var(--text-muted); display: block;"
							>
								{f.label}
							</label>

							<!-- Custom Dropdown -->
							<div class="position-relative">
								<CustomSelect
									label={f.label}
									value={activeFilters[f.key] || ''}
									options={f.options}
									onChange={(v) => selectFilterOption(f.key, v)}
								/>
							</div>
						</div>
					{/each}

					{#if activeCount > 0}
						<button class="btn w-100 mt-2 clear-btn fw-inter-600" on:click={clearAllFilters}>
							<i class="bi bi-x me-1"></i> Clear Filters
						</button>
					{/if}
				</div>
			{/if}
		</div>
		{/if}
	</div>

	<!-- Active Filters Display -->
	{#if displayedActiveFilters.length > 0}
		<div class="active-filters-container mt-2 pb-4">
			<div class="d-flex align-items-center gap-2 flex-wrap">
				<span class=" active-filters-label small fw-inter-700">Active filters:</span>
				{#each displayedActiveFilters as filter}
					<div class="active-filter-chip d-flex align-items-center gap-1">
						<span class="filter-label fw-inter-700">{filter.label}:</span>
						<span class="filter-value fw-inter-700">{filter.value}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.search-filter-container {
		width: 100%;
	}

	.search-container {
		flex: 1;
		min-width: 200px;
	}

	.form-control.custom-search-input:focus {
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--field-border) 80%, transparent) !important;
		outline: none !important;
	}

	.form-control {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--border) 80%, transparent) !important;
	}
	.custom-search-input::placeholder {
		color: var(--text-muted);
	}

	.custom-search-input {
		color: var(--text-primary);
		font-size: 1rem;
	}
	.filter-button {
		border: 1px solid var(--border);
		color: var(--text-primary);
		background-color: var(--bg-card);
		box-shadow: none;
		border-radius: 12px;
		padding: 0.5rem 1rem;
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--border) 80%, transparent) !important;
	}
	.filter-dropdown {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.clear-btn {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		transition: background 0.2s ease;
	}

	.clear-btn:hover {
		background-color: var(--bg-card);
		border: 1px solid #eb0e24;
		color: #eb0e24;
	}

	.active-filter-chip {
		background-color: rgba(21, 155, 232, 0.075);
		padding: 0.3rem;
		border-radius: 8px;
		border: 1px solid rgb(45, 85, 216);
		color: rgb(21, 155, 232);
		font-size: 0.65rem;
	}
	.active-filters-label {
		color: var(--text-muted);
		font-size: 0.7rem;
	}
</style>
