<script lang="ts">
	import { onDestroy } from 'svelte';

	export let label = '';
	export let value = '';
	export let options: string[] = [];
	export let error = '';
	export let onChange: (v: string) => void = () => {};

	let open = false;
	let dropdownElement: HTMLDivElement;

	function selectOption(option: string) {
		onChange(option);
		open = false;
	}

	function toggle(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		e.preventDefault();
		open = !open;
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			open = false;
		}
	}

	//-- Reactive: safe listener handling --
	$: {
		//-- Remove existing listener (prevents duplicates) --
		document.removeEventListener('click', handleClickOutside, true);

		//-- Add listener only when dropdown is open --
		if (open) {
			document.addEventListener('click', handleClickOutside, true);
		}
	}

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside, true);
	});

	$: selectedLabel = value || `Select ${label}`;
</script>

<div class="dropdown-wrapper" bind:this={dropdownElement}>
	<!-- Trigger -->
	<div
		class="custom-dropdown-trigger {error ? 'is-invalid' : ''}"
		on:click={toggle}
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggle(e);
			}
		}}
		role="button"
		tabindex="0"
		aria-expanded={open}
		aria-haspopup="listbox"
	>
		<span>{selectedLabel}</span>
		<svg width="14" height="14" class:rotated={open}>
			<path d="M4 7l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
	</div>

	<!-- Menu with higher z-index -->
	{#if open}
		<div class="custom-dropdown-menu" role="listbox">
			{#each options as option}
				<div
					class="custom-dropdown-item {option === value ? 'selected' : ''}"
					on:click|stopPropagation={() => selectOption(option)}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							selectOption(option);
						}
					}}
					role="option"
					aria-selected={option === value}
					tabindex="0"
				>
					<span>{option}</span>
					{#if option === value}
						<svg width="16" height="16" class="tick">
							<path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" />
						</svg>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if error}
		<div class="invalid-feedback d-block">{error}</div>
	{/if}
</div>

<style>
	.dropdown-wrapper {
		position: relative;
		width: 100%;
	}

	.custom-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		margin-top: 0.25rem;
		padding: 0.5rem 0;
		z-index: 9999;
		max-height: 200px;
		overflow-y: auto;
	}

	.custom-dropdown-trigger {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		font-size: 0.9rem;
		padding: 0.55rem 0.75rem;
		transition: all 0.2s ease;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 48px;
		user-select: none;
	}

	.custom-dropdown-trigger:hover {
		background-color: var(--bg-hover);
		border-color: var(--primary);
	}

	.custom-dropdown-trigger.is-invalid {
		border-color: #d9534f;
	}

	svg.rotated {
		transform: rotate(180deg);
	}
	svg {
		transition: transform 0.2s ease;
	}

	.custom-dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}
	.custom-dropdown-menu:hover .custom-dropdown-item.selected:not(:hover) {
		background-color: transparent;
	}

	.custom-dropdown-item:hover {
		background-color: var(--dropdown-hover-bg);
		border-radius: 5px;
	}

	.custom-dropdown-item.selected {
		background-color: var(--dropdown-hover-bg);
		border-radius: 5px;
	}

	.invalid-feedback {
		color: #d9534f;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}
</style>
