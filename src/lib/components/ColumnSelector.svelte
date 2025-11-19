<script lang="ts">
	import { onMount } from 'svelte';

	export let defaultColumns: { key: string; label: string }[] = [];
	export let optionalColumns: { key: string; label: string }[] = [];
	export let visibleColumns: string[] = [];
	export let onChange: (columns: string[]) => void;

	let showMenu = false;
	let menuElement: HTMLDivElement;
	let buttonElement: HTMLButtonElement;

	const toggleColumn = (key: string) => {
		const currentOptional = visibleColumns.filter((c) => !defaultColumns.some((d) => d.key === c));
		const updatedOptional = currentOptional.includes(key)
			? currentOptional.filter((c) => c !== key)
			: [...currentOptional, key];
		onChange(updatedOptional);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (
			menuElement &&
			buttonElement &&
			!menuElement.contains(event.target as Node) &&
			!buttonElement.contains(event.target as Node)
		) {
			showMenu = false;
		}
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="position-relative d-none d-md-block main-div">
	<button
		class="btn btn-rounded d-flex align-items-center fw-inter-600"
		type="button"
		on:click={() => (showMenu = !showMenu)}
		bind:this={buttonElement}
	>
		<i class="bi bi-layout-three-columns me-1"></i> Select Columns
	</button>
	{#if showMenu}
		<div class="menu-dropdown position-absolute rounded p-3 shadow-sm" bind:this={menuElement}>
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
	:global(.btn.btn-rounded),
	:global(.btn.btn-rounded:focus),
	:global(.btn.btn-rounded:hover),
	:global(.btn.btn-rounded:active) {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border-radius: 15px;
		border: 1px solid var(--border);
		height: 48px;
		font-size: small;
		outline: none;
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
