<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let label = '';
	export let value = '';
	export let options: string[] = [];
	export let error = '';
	export let onChange: (v: string) => void = () => {};

	let open = false;
	let dropdownElement: HTMLDivElement;
	let triggerElement: HTMLDivElement;
	let menuElement: HTMLDivElement;
	let menuStyle = '';

	let activeIndex = -1;

	function selectOption(option: string) {
		onChange(option);
		open = false;
	}

	function computeMenuPosition() {
		if (!triggerElement) return;
		const r = triggerElement.getBoundingClientRect();
		// position the menu just below the trigger using fixed positioning
		menuStyle = `position: fixed; top: ${r.bottom}px; left: ${r.left}px; width: ${r.width}px; z-index: 99999;`;
	}

	function toggle(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		e.preventDefault();
		open = !open;

		if (open) {
			activeIndex = options.indexOf(value);
			// compute after DOM update
			setTimeout(() => computeMenuPosition(), 0);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		if (!open) return;
		const target = event.target as Node;
		const insideDropdown = dropdownElement && dropdownElement.contains(target);
		const insideMenu = menuElement && menuElement.contains(target);
		if (!insideDropdown && !insideMenu) {
			open = false;
		}
	}

	onMount(() => {
		if (!browser) return;
		document.addEventListener('click', handleClickOutside, true);
		window.addEventListener('resize', computeMenuPosition);
		window.addEventListener('scroll', computeMenuPosition, true);
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('click', handleClickOutside, true);
		window.removeEventListener('resize', computeMenuPosition);
		window.removeEventListener('scroll', computeMenuPosition, true);
	});

	$: selectedLabel = value || `Select ${label}`;
</script>

<div class="dropdown-wrapper" bind:this={dropdownElement}>
	<!-- Trigger -->
	<div
		class="custom-dropdown-trigger {error ? 'is-invalid' : ''}"
		bind:this={triggerElement}
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

	<!-- Dropdown Menu -->
	{#if open}
		<div
			class="custom-dropdown-menu"
			bind:this={menuElement}
			style={menuStyle}
			role="listbox"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					activeIndex = (activeIndex + 1) % options.length;
				}
				if (e.key === 'ArrowUp') {
					e.preventDefault();
					activeIndex = (activeIndex - 1 + options.length) % options.length;
				}
				if (e.key === 'Enter') {
					e.preventDefault();
					if (activeIndex >= 0) selectOption(options[activeIndex]);
				}
				if (e.key === 'Escape') {
					open = false;
				}
			}}
		>
			{#each options as option, i}
				<div
					class="custom-dropdown-item
					{option === value ? 'selected' : ''}
					{activeIndex === i ? 'active' : ''}"
					on:click|stopPropagation={() => selectOption(option)}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							selectOption(option);
						}
					}}
					role="option"
					aria-selected={option === value}
					tabindex="-1"
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

<!--Styles -->
<style>
	.dropdown-wrapper {
		position: relative;
		width: 100%;
	}

	.custom-dropdown-menu {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		margin-top: 0.25rem;
		padding: 0.5rem 0;
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
		border-color: var(--error-color);
	}

	svg.rotated {
		transform: rotate(180deg);
	}
	svg {
		margin-left: 10px;
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
		color: var(--error-color);
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}
</style>
