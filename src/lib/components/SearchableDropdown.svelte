<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';
	import toast from '$lib/utils/toast';

	export let value: string = '';
	export let initialLabel: string = ''; // shown immediately while first page loads
	export let onChange: (v: string) => void = () => {};
	export let placeholder = 'Select item';
	export let pageSize: number = 10;
	export let disabled: boolean = false;
	export let disabledMessage: string = 'You do not have permission';
	export let ariaLabelledBy: string = '';
	export let loadOptions:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;

	let open = false;
	let query = initialLabel ? initialLabel : '';
	let items: Array<{ id: number; name: string }> = [];
	let filteredItems: Array<{ id: number; name: string }> = [];
	let loading = false;
	let loadingMore = false;
	let rootEl: HTMLElement;
	let listEl: HTMLElement;

	let _debounceTimer: any = null;
	let displaySelected = !!initialLabel;
	let _lastSyncValue = value;
	let _lastSyncInitialLabel = initialLabel;

	//-- Pagination state --
	let currentOffset = 0;
	let hasMore = true;
	let currentSearch: string | undefined = undefined;
	let _currentRequestId = 0;

	$: selectedName = items.find((item) => String(item.id) === value)?.name || '';

	//-- Sync with external value changes (e.g. when form is reset or programmatically changed) --
	$: if (value !== _lastSyncValue || initialLabel !== _lastSyncInitialLabel) {
		_lastSyncValue = value;
		_lastSyncInitialLabel = initialLabel;
		const v = Number(value);
		const found = items.find((item) => item.id === v);
		if (found) {
			query = found.name;
			displaySelected = true;
		} else if (initialLabel) {
			query = initialLabel;
			displaySelected = true;
		}
	}

	//-- Load items from the provided loadOptions function --
	async function loadItems(search?: string, append = false, restoreSelection = true) {
		if (!append) {
			_currentRequestId++;
			loading = true;
			currentOffset = 0;
			hasMore = true;
			items = [];
		} else {
			loadingMore = true;
		}
		currentSearch = search;
		const requestId = _currentRequestId;

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

			//-- Ignore stale responses from previous requests --
			if (requestId !== _currentRequestId) {
				return;
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
			if (restoreSelection && value) {
				const v = Number(value);
				const found = items.find((item) => item.id === v);
				if (found) {
					query = found.name;
					displaySelected = true;
				} else if (initialLabel) {
					query = initialLabel;
					displaySelected = true;
				}
			}
		} catch (err: any) {
			console.error('SearchableDropdown.loadItems error', err);
			items = [];
			filteredItems = [];
			hasMore = false;
			toast.error('Failed to load options.');
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

	//-- Initial load and click outside handler --
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

	//-- Open handler: used by the input to open the menu and lazily load options when needed --
	function handleFocus() {
		if (disabled) return;
		open = true;
		if (items.length === 0) loadItems();
	}

	//-- Cleanup debounce timer on destroy --
	onDestroy(() => {
		if (_debounceTimer) clearTimeout(_debounceTimer);
	});

	//-- Handle user input with debounced search (avoid triggering on programmatic changes) --
	function handleInput() {
		if (_debounceTimer) clearTimeout(_debounceTimer);
		_debounceTimer = setTimeout(() => {
			const q = query.trim();
			loadItems(q || undefined, false, false);
		}, SEARCH_DEBOUNCE_DELAY);
	}

	//-- When an item is selected from the dropdown --
	function selectItem(item: { id: number; name: string }) {
		query = item.name;
		displaySelected = true;
		onChange(String(item.id));
		open = false;
	}

	//-- Clear selection and reset --
	function clearSelection() {
		query = '';
		displaySelected = false;
		onChange('');
		open = false;
		loadItems();
	}
</script>

<div
	class="searchable-dropdown position-relative"
	style:z-index={open ? 1300 : 'auto'}
	bind:this={rootEl}
>
	<div class="input-group position-relative">
		<input
			type="search"
			class="form-control"
			class:selected-value={displaySelected}
			on:input={() => {
				displaySelected = false;
				handleInput();
			}}
			placeholder={selectedName || placeholder}
			bind:value={query}
			on:focus={handleFocus}
			{disabled}
			title={disabled ? disabledMessage : ''}
			aria-labelledby={ariaLabelledBy || undefined}
			aria-label={ariaLabelledBy ? undefined : 'Search and select item'}
		/>
		{#if (query || displaySelected) && !disabled}
			<button
				type="button"
				class="clear-btn"
				on:click={clearSelection}
				aria-label="Clear selection"
				title="Clear"
			>
				<i class="bi bi-x-lg"></i>
			</button>
		{/if}
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
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.searchable-dropdown .list::-webkit-scrollbar {
		display: none;
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
		padding-right: 40px;
	}

	.searchable-dropdown .form-control.selected-value {
		color: var(--text-primary) !important;
	}

	.searchable-dropdown .input-group {
		position: relative;
	}

	.searchable-dropdown .clear-btn {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		transition: color 0.2s ease;
	}

	.searchable-dropdown .clear-btn:hover {
		color: var(--text-primary);
	}

	.searchable-dropdown input::-webkit-search-cancel-button {
		display: none;
	}
</style>
