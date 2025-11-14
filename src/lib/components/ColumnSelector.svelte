<script lang="ts">
	export let defaultColumns: { key: string; label: string }[] = [];
	export let optionalColumns: { key: string; label: string }[] = [];
	export let visibleColumns: string[] = [];
	export let onChange: (columns: string[]) => void;
	let showMenu = false;
	const toggleColumn = (key: string) => {
		const currentOptional = visibleColumns.filter((c) => !defaultColumns.some((d) => d.key === c));
		const updatedOptional = currentOptional.includes(key)
			? currentOptional.filter((c) => c !== key)
			: [...currentOptional, key];
		onChange(updatedOptional);
	};
</script>

<div class="position-relative d-none d-md-block main-div">
	<button
		class="btn btn-outline-secondary d-flex align-items-center"
		type="button"
		on:click={() => (showMenu = !showMenu)}
	>
		<i class="bi bi-layout-three-columns me-1"></i> Select Columns
	</button>
	{#if showMenu}
		<div class=" menu-dropdown position-absolute rounded p-3 shadow-sm">
			<h6 class="fw-bold mb-2">Column Visibility</h6>
			<div class="mb-2 small fw-semibold">DEFAULT COLUMNS</div>
			{#each defaultColumns as col}
				<div class="form-check mb-1">
					<input class="form-check-input" type="checkbox" checked disabled />
					<label class="form-check-label" for="column-{col.key}">{col.label}</label>
				</div>
			{/each}
			<div class="mt-3 mb-2 small fw-semibold">OPTIONAL COLUMNS</div>
			{#each optionalColumns as col}
				<div class="form-check mb-1">
					<input
						class="form-check-input"
						type="checkbox"
						checked={visibleColumns.includes(col.key)}
						on:change={() => toggleColumn(col.key)}
					/>
					<label class="form-check-label" for="column-{col.key}">{col.label}</label>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.main-div {
		background-color: var(--bg-card);
	}
	button {
		color: var(--text-primary);
		border-radius: 8px;
	}
	.menu-dropdown {
		width: 250px;
		right: 0;
		bottom: 100%;
		margin-bottom: 8px;
		z-index: 10;
		background-color: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}
</style>
