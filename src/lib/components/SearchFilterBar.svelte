<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import CustomSelect from './CustomSelect.svelte';
	import { browser } from '$app/environment';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';

	export let searchPlaceholder: string = 'Search...';
	export let filters: { label: string; key: string; options: string[] }[] = [];
	export let showSearch: boolean = true;
	export let showFilter: boolean = true;
	export let activeFilters: Record<string, string> = {};

	let showFilters = false;
	let searchTerm = '';
	let internalActiveFilters: Record<string, string> = { ...activeFilters };
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Sync internal filters when prop changes
	$: if (activeFilters) internalActiveFilters = { ...activeFilters };

	const dispatch = createEventDispatcher();
	const toggleFilters = () => (showFilters = !showFilters);

	//-- Count how many filters are actually active --
	$: activeCount = Object.values(internalActiveFilters).filter(
		(v) => v && !v.toLowerCase().includes('all')
	).length;

	//-- Get active filters for display --
	$: displayedActiveFilters = filters
		.filter((f) => internalActiveFilters[f.key] && !internalActiveFilters[f.key].toLowerCase().includes('all'))
		.map((f) => ({
			label: f.label,
			value: internalActiveFilters[f.key],
			key: f.key
		}));

	function dispatchUpdate() {
		dispatch('update', { searchTerm, activeFilters: internalActiveFilters });
	}

	function scheduleSearchUpdate() {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			dispatchUpdate();
		}, SEARCH_DEBOUNCE_DELAY);
	}

	//-- handle click outside dropdown --
	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		const dropdown = document.getElementById('filter-panel');
		if (dropdown && !dropdown.contains(event.target as Node)) {
			showFilters = false;
		}
	}
	onMount(() => {
		if (browser) {
			window.addEventListener('click', handleClickOutside, true);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('click', handleClickOutside, true);
		}
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
	});

	//-- Select a filter option --
	function selectFilterOption(key: string, option: string) {
		internalActiveFilters[key] = option;
		internalActiveFilters = { ...internalActiveFilters };
		dispatch('update', { searchTerm, activeFilters: internalActiveFilters });
	}

	//-- Clear all filters --
	function clearAllFilters() {
		internalActiveFilters = {};
		dispatch('update', { searchTerm, activeFilters: internalActiveFilters });
	}
</script>

{#if showSearch || showFilter}
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
						on:input={scheduleSearchUpdate}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
								dispatchUpdate();
							}
						}}
						aria-label="Search input"
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
									<label
										class="form-label fw-inter-400 mb-2"
										style="color: var(--text-muted); display: block;"
										for={'filter-' + f.key}
									>
										{f.label}
									</label>

									<!-- Custom Dropdown -->
									<div class="position-relative">
										<CustomSelect
											label={f.label}
										value={internalActiveFilters[f.key] || ''}
											options={f.options}
											onChange={(v) => selectFilterOption(f.key, v)}
										/>
									</div>
								</div>
							{/each}

							{#if activeCount > 0}
								<button
									class="btn w-100 mt-2 clear-btn fw-inter-600 d-flex align-items-center justify-content-center gap-2"
									on:click={clearAllFilters}
								>
									<i class="bi bi-x fs-4"></i>
									<span>Clear Filters</span>
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
					<span class="active-filters-label small fw-inter-700">Active filters:</span>
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
{/if}

<!-- Styles -->
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
		box-shadow: 0 0 0 2px rgba(var(--field-border-rgb), 0.2) !important;
		outline: none !important;
	}

	.form-control {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: 0 0 0 1px rgba(var(--border-rgb), 0.2) !important;
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
		box-shadow: 0 0 0 1px rgba(var(--border-rgb), 0.2) !important;
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
		background-color: var(--clear-btn-bg);
		border: 1px solid var(--clear-btn);
		color: var(--clear-btn);
	}

	.active-filter-chip {
		background-color: var(--active-filter-chip-bg);
		padding: 0.3rem;
		border-radius: 8px;
		border: 1px solid var(--active-filter-chip-border);
		color: var(--active-filter-chip);
		font-size: 0.65rem;
	}
	.active-filters-label {
		color: var(--text-muted);
		font-size: 0.7rem;
	}
</style>
