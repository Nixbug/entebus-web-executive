<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';

	export let label = '';
	export let value = '';
	export let options: string[] = [];
	export let error = '';
	export let onChange: (v: string) => void = () => {};
	export let id: string = '';
	export let isSearchable: boolean = false;

	let open = false;
	let dropdownElement: HTMLDivElement;
	let triggerElement: HTMLDivElement;
	let menuElement: HTMLDivElement;
	let menuWrapperElement: HTMLDivElement;
	let searchInputElement: HTMLInputElement;
	let menuStyle = '';
	let searchInput = '';

	let activeIndex = -1;

	$: filteredOptions = searchInput
		? options.filter((opt) => opt.toLowerCase().includes(searchInput.toLowerCase()))
		: options;

	//-- Keep activeIndex valid when filteredOptions change --
	$: if (filteredOptions) {
		if (filteredOptions.length === 0) {
			activeIndex = -1;
		} else if (activeIndex < 0 || activeIndex >= filteredOptions.length) {
			const idx = filteredOptions.indexOf(value);
			activeIndex = idx >= 0 ? idx : 0;
		}
	}

	function selectOption(option: string) {
		onChange(option);
		closeDropdown();
	}

	//-- Helper: close dropdown and optionally restore focus to trigger --
	function closeDropdown(restoreFocus: boolean = true) {
		open = false;
		searchInput = '';
		if (restoreFocus && triggerElement) {
			triggerElement.focus();
		}
	}

	//-- Compute and set menu position based on trigger element --
	function computeMenuPosition() {
		//-- If dropdown is not open, no need to compute position --
		if (!open) return;
		if (!triggerElement) return;
		const r = triggerElement.getBoundingClientRect();
		const targetElement = menuWrapperElement || menuElement;
		if (targetElement) {
			menuStyle = `position: fixed; top: ${r.bottom}px; left: ${r.left}px; width: ${r.width}px; z-index: 99999;`;
		}
	}

	async function toggle(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		e.preventDefault();

		if (!open) {
			activeIndex = options.indexOf(value);
			open = true;
			searchInput = '';
			await tick();
			computeMenuPosition();
			requestAnimationFrame(() => computeMenuPosition());
			//-- Focus search input if searchable, otherwise focus the menu for keyboard navigation --
			if (isSearchable && searchInputElement) {
				searchInputElement.focus();
			} else if (menuElement) {
				menuElement.focus();
			}
		} else {
			closeDropdown();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		if (!open) return;
		const target = event.target as Node;
		const insideDropdown = dropdownElement && dropdownElement.contains(target);
		const insideMenu = menuElement && menuElement.contains(target);
		const insideMenuWrapper = menuWrapperElement && menuWrapperElement.contains(target);
		if (!insideDropdown && !insideMenu && !insideMenuWrapper) {
			//-- Don't restore focus when closing via outside click; let user's click focus naturally --
			closeDropdown(false);
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
		{id}
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
		<div class="custom-dropdown-menu-wrapper" bind:this={menuWrapperElement} style={menuStyle}>
			{#if isSearchable}
				<div class="search-input-wrapper">
					<input
						type="text"
						placeholder="Search..."
						bind:value={searchInput}
						bind:this={searchInputElement}
						aria-label="Search options"
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								//-- Prevent form submission when pressing Enter in search field --
								e.preventDefault();
								e.stopPropagation();
							} else if (e.key === 'Escape') {
								e.preventDefault();
								e.stopPropagation();
								closeDropdown();
							} else if (e.key === 'ArrowDown') {
								//-- Move focus to menu for arrow key navigation --
								e.preventDefault();
								if (menuElement) menuElement.focus();
							}
						}}
						class="search-input"
					/>
				</div>
			{/if}

			<div
				class="custom-dropdown-menu"
				bind:this={menuElement}
				role="listbox"
				tabindex="0"
				on:keydown={(e) => {
					//-- guard when there are no filtered results --
					if (filteredOptions.length === 0) {
						if (e.key === 'Escape') {
							e.preventDefault();
							closeDropdown();
						} else if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
							//-- prevent default to avoid form submission, page scroll --
							e.preventDefault();
						}
						return;
					}
					if (e.key === 'ArrowDown') {
						e.preventDefault();
						activeIndex = (activeIndex + 1) % filteredOptions.length;
					}
					if (e.key === 'ArrowUp') {
						e.preventDefault();
						activeIndex = (activeIndex - 1 + filteredOptions.length) % filteredOptions.length;
					}
					if (e.key === 'Enter') {
						e.preventDefault();
						if (activeIndex >= 0) selectOption(filteredOptions[activeIndex]);
					}
					if (e.key === 'Escape') {
						e.preventDefault();
						closeDropdown();
					}
				}}
			>
				{#each filteredOptions as option, i}
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

				{#if filteredOptions.length === 0}
					<div
						class="no-results"
						role="option"
						aria-selected="false"
						aria-disabled="true"
						tabindex="-1"
					>
						No results found
					</div>
				{/if}
			</div>
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

	.custom-dropdown-menu-wrapper {
		position: fixed;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-height: 350px;
		overflow: hidden;
		z-index: 99999;
	}

	.custom-dropdown-menu {
		background-color: var(--bg-card);
		border: none;
		border-radius: 0;
		box-shadow: none;
		margin-top: 0;
		padding: 0;
		max-height: 300px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.search-input-wrapper {
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.search-input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: var(--bg-card);
		color: var(--text-primary);
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
	}

	.search-input::placeholder {
		color: var(--text-muted);
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
		flex-shrink: 0;
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

	.no-results {
		padding: 1rem 0.75rem;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.invalid-feedback {
		color: var(--error-color);
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}
</style>
