<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';

	export let value: string = '';
	export let onChange: (v: string) => void = () => {};
	export let placeholder = 'Select item';
	export let loadOptions: ((q?: string) => Promise<Array<{ id: number; name: string }>>) | null =
		null;

	let open = false;
	let query = '';
	let items: Array<{ id: number; name: string }> = [];
	let filteredItems: Array<{ id: number; name: string }> = [];
	let loading = false;
	let rootEl: HTMLElement;

	let _debounceTimer: any = null;

	let displaySelected = false;

	$: selectedName = items.find((item) => String(item.id) === value)?.name || '';

	async function loadItems(search?: string) {
		loading = true;
		try {
			let fetchedItems: Array<{ id: number; name: string }> = [];
			if (typeof loadOptions === 'function') {
				fetchedItems = (await loadOptions(search)).map((r: any) => ({
					id: Number(r.id),
					name: String(r.name)
				}));
			} else {
				// no loader available: do not auto-fetch to keep component API-agnostic
				fetchedItems = [];
			}
			items = fetchedItems;
			filteredItems = items;
			// if value provided, try to pre-select by id
			if (value) {
				const v = Number(value);
				const found = items.find((item) => item.id === v);
				if (found) query = found.name;
			}
			// if we pre-selected by value, show it styled in the input
			if (value && items.find((item) => String(item.id) === String(value))) {
				displaySelected = true;
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// initial load
		loadItems();

		const handleClickOutside = (event: MouseEvent) => {
			if (open && rootEl && !rootEl.contains(event.target as Node)) {
				open = false;
			}
		};

		// Use capture mode so clicks inside components that stop propagation (e.g., modal-content) still close the dropdown
		document.addEventListener('click', handleClickOutside, true);

		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	onDestroy(() => {
		if (_debounceTimer) clearTimeout(_debounceTimer);
	});

	$: if (query !== undefined) {
		// debounce queries to avoid spamming API on fast typing
		if (_debounceTimer) clearTimeout(_debounceTimer);
		_debounceTimer = setTimeout(() => {
			const q = query.trim();
			loadItems(q || undefined);
		}, SEARCH_DEBOUNCE_DELAY);
	}

	function selectItem(item: { id: number; name: string }) {
		// set the input to the selected name and mark it as a selected display
		query = item.name;
		displaySelected = true;
		onChange(String(item.id));
		open = false;
	}
</script>

<div class="searchable-dropdown position-relative" bind:this={rootEl}>
	<div class="input-group">
		<input
			type="search"
			class="form-control"
			class:selected-value={displaySelected}
			on:input={() => (displaySelected = false)}
			placeholder={selectedName || placeholder}
			bind:value={query}
			on:focus={() => (open = true)}
			aria-label="Search and select item"
		/>
	</div>

	{#if open}
		<div class="menu-dropdown p-3 shadow-sm">
			{#if loading}
				<div class="small text-muted p-2">Loading...</div>
			{:else if filteredItems.length === 0}
				<div class="small text-muted p-2">No items found</div>
			{:else}
				<div class="list">
					{#each filteredItems as item}
						<button
							type="button"
							class="item w-100 text-start {Number(value) === item.id ? 'selected' : ''}"
							on:click={() => selectItem(item)}
						>
							<div class="d-flex w-100 align-items-center justify-content-between">
								<span class="item-text">{item.name}</span>
								{#if Number(value) === item.id}
									<i class="bi bi-check-lg selected-check" aria-hidden="true"></i>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.searchable-dropdown .list {
		max-height: 220px;
		overflow-y: auto;
	}
	.searchable-dropdown .menu-dropdown {
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		width: 100%;
		z-index: 1200;
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
	}
	.searchable-dropdown .item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
		font-size: 0.9rem;
	}
	.searchable-dropdown .item:hover {
		background: var(--dropdown-hover-bg, var(--bg-card));
		border-radius: 5px;
		color: var(--text-primary);
	}
	.searchable-dropdown .item.selected {
		background: var(--dropdown-hover-bg, var(--bg-card));
		border-radius: 5px;
		color: var(--text-primary);
	}
	.searchable-dropdown .selected-check {
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.searchable-dropdown .item .item-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
		padding-right: 0.5rem;
		color: var(--text-primary);
	}
	.searchable-dropdown .form-control {
		width: 100%;
		border-radius: 8px;
	}

	.searchable-dropdown .form-control.selected-value {
		color: var(--text-primary) !important;
	}
</style>
