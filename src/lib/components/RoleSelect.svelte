<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let value: string = '';
	export let onChange: (v: string) => void = () => {};
	export let placeholder = 'Select role...';
	// Optional loader to make this component dynamic. Should return
	// Promise<Array<{id:number,name:string}>> when provided.
	// Without loader, component will not fetch roles by itself.
	export let loadOptions: ((q?: string) => Promise<Array<{ id: number; name: string }>>) | null = null;
	export let debounceMs = 250;

	let open = false;
	let query = '';
	let roles: Array<{ id: number; name: string }> = [];
	let filtered: Array<{ id: number; name: string }> = [];
	let loading = false;

	let _debounceTimer: any = null;

	async function loadRoles(search?: string) {
		loading = true;
		try {
			let items: Array<{ id: number; name: string }> = [];
			if (typeof loadOptions === 'function') {
				items = (await loadOptions(search)).map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
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

<div class="role-select">
	<div class="input-group">
		<input
			type="search"
			class="form-control"
			placeholder={placeholder}
			bind:value={query}
			on:focus={() => (open = true)}
		/>
		<button type="button" class="btn btn-outline-secondary" on:click={() => loadRoles(query)} disabled={loading} aria-label="Search roles">
			<i class="bi bi-search" aria-hidden="true"></i>
		</button>
	</div>

	{#if open}
		<div class="list mt-2">
			{#if loading}
				<div class="small text-muted p-2">Loading...</div>
			{:else if filtered.length === 0}
				<div class="small text-muted p-2">No roles</div>
			{:else}
				{#each filtered as r}
					<button type="button" class="item" on:click={() => selectRole(r)}>
						<div class="fw-medium">{r.name}</div>
						<div class="small text-muted">ID: {r.id}</div>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.role-select .list {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 6px;
		max-height: 240px;
		overflow: auto;
	}
	.role-select .item {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid rgba(255,255,255,0.02);
		cursor: pointer;
	}
	.role-select .item:hover { background: var(--dropdown-hover-bg); }
	.input-group .form-control { height: 40px; }
	.input-group .btn { height: 40px; }
</style>