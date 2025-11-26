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
		<i class="bi bi-layout-three-columns me-3" style="text-shadow: 0 0 1px #000;"></i>Select Columns
	</button>
	{#if showMenu}
		<div class="menu-dropdown position-absolute rounded p-3 shadow-sm" bind:this={menuElement}>
			<h6 class="fw-inter-800 mb-2">Column Visibility</h6>
			<div class="mb-2 small fw-inter-500" style="color: var(--text-muted);">DEFAULT COLUMNS</div>
			{#each defaultColumns as col}
				<div class="form-check mb-1">
					<input class="form-check-input" type="checkbox" checked disabled />
					<label class="form-check-label" for="column-{col.key}">{col.label}</label>
				</div>
			{/each}
			<hr />
			<div class="mt-3 mb-2 small fw-inter-500" style="color: var(--text-muted);">
				OPTIONAL COLUMNS
			</div>
			{#each optionalColumns as col}
				<div class="form-check mb-1">
					<input
						class="form-check-input"
						type="checkbox"
						checked={visibleColumns.includes(col.key)}
						on:change={() => toggleColumn(col.key)}
						id="column-{col.key}"
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
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.04),
			0 8px 20px rgba(0, 0, 0, 0.06);
	}
	.menu-dropdown {
		width: 18rem;
		right: 0;
		bottom: 100%;
		margin-bottom: 8px;
		z-index: 10;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}
	.form-check-input {
		width: 0.9em !important;
		height: 0.9em !important;
		margin-top: 0.15em !important;
		border: 1.5px solid var(--border) !important;
		background-color: var(--bg-primary) !important;
		cursor: pointer;
		position: relative;
		transition: all 0.2s ease;
		appearance: none !important;
		-webkit-appearance: none !important;
		-moz-appearance: none !important;
		background-image: none !important;
	}
	.form-check-input:checked {
		background-color: var(--text-primary) !important;
		border-color: var(--text-primary) !important;
	}
	.form-check-input:checked::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0.5em;
		height: 0.25em;
		border: 2px solid var(--bg-card);
		border-top: none;
		border-right: none;
		background: transparent;
		transform: translate(-50%, -65%) rotate(-45deg);
		transform-origin: center;
		opacity: 1;
		box-sizing: border-box;
	}
	.form-check-input:checked[type='checkbox'] {
		background-image: none !important;
	}
	.form-check-input:focus {
		box-shadow: 0 0 0 0.2rem rgba(33, 37, 41, 0.1) !important;
		border-color: var(--text-primary) !important;
		outline: none !important;
	}
	.form-check-input:disabled {
		background-color: var(--bg-primary) !important;
		border-color: var(--border) !important;
		opacity: 0.6;
	}
	.form-check-input:disabled:checked {
		background-color: var(--text-muted) !important;
		border-color: var(--border) !important;
	}
	.form-check-input:disabled:checked::before {
		border-color: var(--bg-card);
	}
	.form-check-label {
		cursor: pointer;
		margin-left: 0.5em;
		font-size: 0.9em;
		color: var(--text-primary);
	}
</style>
