<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let value: string = '';
	export let onChange: (v: string) => void = () => {};
	export let placeholder = 'Select role...';
	// Optional loader to make this component dynamic. Should return
	// Promise<Array<{id:number,name:string}>> when provided.
	// Without loader, component will not fetch roles by itself.
	export let loadOptions: ((q?: string) => Promise<Array<{ id: number; name: string }>>) | null =
		null;
	export let debounceMs = 250;

	let open = false;
	let query = '';
	let roles: Array<{ id: number; name: string }> = [];
	let filtered: Array<{ id: number; name: string }> = [];
	let loading = false;
	let rootEl: HTMLElement;

	let _debounceTimer: any = null;

	$: selectedName = roles.find((r) => String(r.id) === value)?.name || '';

	async function loadRoles(search?: string) {
		loading = true;
		try {
			let items: Array<{ id: number; name: string }> = [];
			if (typeof loadOptions === 'function') {
				items = (await loadOptions(search)).map((r: any) => ({
					id: Number(r.id),
					name: String(r.name)
				}));
			} else {
				// no loader available: do not auto-fetch to keep component API-agnostic
				items = [];
			}
			roles = items;
			filtered = roles;
			// if value provided, try to pre-select by id
			if (value) {
				const v = Number(value);
				const found = roles.find((r) => r.id === v);
				if (found) query = found.name;
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// initial load
		loadRoles();

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
			loadRoles(q || undefined);
		}, debounceMs);
	}

	function selectRole(r: { id: number; name: string }) {
		onChange(String(r.id));
		open = false;
	}
</script>

<div class="role-select position-relative" bind:this={rootEl}>
	<div class="input-group">
		<input
			type="search"
			class="form-control"
			placeholder={selectedName || placeholder}
			bind:value={query}
			on:focus={() => (open = true)}
			aria-label="Search and select role"
		/>
	</div>

	{#if open}
		<div class="menu-dropdown role-dropdown p-3 shadow-sm">
			{#if loading}
				<div class="small text-muted p-2">Loading...</div>
			{:else if filtered.length === 0}
				<div class="small text-muted p-2">No roles found</div>
			{:else}
				<div class="list">
					{#each filtered as r}
						<button
							type="button"
							class="item w-100 text-start {Number(value) === r.id ? 'selected' : ''}"
							on:click={() => selectRole(r)}
						>
							<div class="d-flex align-items-center justify-content-between">
								<span>{r.name}</span>
								{#if Number(value) === r.id}
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
	.role-select .list {
		max-height: 220px;
		overflow-y: auto;
	}
	.role-select .role-dropdown {
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
	.role-select .item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
		font-size: 0.9rem;
	}
	.role-select .item:hover {
		background: var(--dropdown-hover-bg, var(--bg-card));
		border-radius: 5px;
		color: var(--text-primary);
	}
	.role-select .item.selected {
		background: var(--dropdown-hover-bg, var(--bg-card));
		border-radius: 5px;
		color: var(--text-primary);
	}
	.role-select .selected-check {
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.role-select .form-control {
		width: 100%;
		border-radius: 8px;
	}
</style>
