<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';

	export let value: string = '';
	export let onChange: (v: string) => void = () => {};
	export let placeholder = 'Select item';
	export let pageSize: number = 10;
	export let loadOptions:
		| ((q?: string, limit?: number, offset?: number) => Promise<Array<{ id: number; name: string }>>)
		| null = null;

	let open = false;
	let query = '';
	let items: Array<{ id: number; name: string }> = [];
	let filteredItems: Array<{ id: number; name: string }> = [];
	let loading = false;
	let loadingMore = false;
	let rootEl: HTMLElement;
	let listEl: HTMLElement;

	let _debounceTimer: any = null;
	let displaySelected = false;

	//-- Pagination state --
	let currentOffset = 0;
	let hasMore = true;
	let currentSearch: string | undefined = undefined;

	$: selectedName = items.find((item) => String(item.id) === value)?.name || '';

	async function loadItems(search?: string, append = false) {
		if (!append) {
			loading = true;
			currentOffset = 0;
			hasMore = true;
			items = [];
		} else {
			loadingMore = true;
		}
		currentSearch = search;
		try {
			let fetchedItems: Array<{ id: number; name: string }> = [];
			if (typeof loadOptions === 'function') {
				fetchedItems = (await loadOptions(search, pageSize, currentOffset)).map((r: any) => ({
					id: Number(r.id),
					name: String(r.name)
				}));
			} else {
				fetchedItems = [];
			}

			if (append) {
				items = [...items, ...fetchedItems];
			} else {
				items = fetchedItems;
			}
			filteredItems = items;

			//-- If fewer items returned than pageSize, no more pages --
			hasMore = fetchedItems.length >= pageSize;
			currentOffset += fetchedItems.length;

			// if value provided, try to pre-select by id
			if (value) {
				const v = Number(value);
				const found = items.find((item) => item.id === v);
				if (found) query = found.name;
			}
			if (value && items.find((item) => String(item.id) === String(value))) {
				displaySelected = true;
			}
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	//-- Load next page when scrolled near bottom --
	function handleListScroll() {
		if (!listEl || loadingMore || !hasMore) return;
		const { scrollTop, scrollHeight, clientHeight } = listEl;
		if (scrollTop + clientHeight >= scrollHeight - 30) {
			loadItems(currentSearch, true);
		}
	}

	onMount(() => {
		loadItems();

		const handleClickOutside = (event: MouseEvent) => {
			if (open && rootEl && !rootEl.contains(event.target as Node)) {
				open = false;
			}
		};

		document.addEventListener('click', handleClickOutside, true);

		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	onDestroy(() => {
		if (_debounceTimer) clearTimeout(_debounceTimer);
	});

	$: if (query !== undefined) {
		if (_debounceTimer) clearTimeout(_debounceTimer);
		_debounceTimer = setTimeout(() => {
			const q = query.trim();
			loadItems(q || undefined);
		}, SEARCH_DEBOUNCE_DELAY);
	}

	function selectItem(item: { id: number; name: string }) {
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
				<div class="list" bind:this={listEl} on:scroll={handleListScroll}>
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
					{#if loadingMore}
						<div class="small text-muted text-center p-2">Loading more...</div>
					{/if}
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
