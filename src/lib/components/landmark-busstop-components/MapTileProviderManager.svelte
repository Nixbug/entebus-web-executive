<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { tileProviders } from '$lib/stores/tile-providers';
	import { browser } from '$app/environment';
	import type { TileProvider } from '$lib/types/type';

	//-- Props --
	export let providers: TileProvider[] = [];
	export let show: boolean = false;

	//-- Local state --
	let showTileList = false;
	let newProviderName = '';
	let newProviderUrl = '';
	let newProviderAttribution = '';
	let newProviderMaxZoom = 19;
	let addProviderError = '';
	let fileInput: HTMLInputElement | null = null;
	let selectedNames = new Set<string>();
	//-- reactive count for Svelte templates --
	$: selectedCount = selectedNames.size;
	//-- true when any selected provider is built-in (e.g. default OSM) --
	$: selectedHasBuiltIn = Array.from(selectedNames).some((n) =>
		providers.some((p) => p.name === n && p.isBuiltIn)
	);

	const dispatch = createEventDispatcher();

	//-- Prevent background/page scrolling while modal is open --
	$: if (browser) {
		if (show) {
			const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.overflow = 'hidden';
			if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
		} else {
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		}
	}

	onDestroy(() => {
		if (browser) {
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		}
	});

	//-- Functions --
	function handleClose() {
		dispatch('close');
	}

	//-- Handle adding a new provider --
	function handleAddProvider() {
		addProviderError = '';

		if (!newProviderName.trim()) {
			addProviderError = 'Provider name is required';
			return;
		}
		if (!newProviderUrl.trim()) {
			addProviderError = 'Tile URL template is required';
			return;
		}
		//-- Basic URL validation - must contain {x}, {y}, {z} placeholders --
		//-- Require safe protocol --
		const trimmedUrl = newProviderUrl.trim();
		if (!/^https?:\/\//i.test(trimmedUrl)) {
			addProviderError = 'URL must start with http:// or https://';
			return;
		}

		//-- Basic URL validation - must contain {x}, {y}, {z} placeholders --
		if (!trimmedUrl.includes('{x}') || !trimmedUrl.includes('{y}') || !trimmedUrl.includes('{z}')) {
			addProviderError = 'URL must contain {x}, {y}, and {z} placeholders';
			return;
		}

		const success = tileProviders.addProvider({
			name: newProviderName.trim(),
			url: newProviderUrl.trim(),
			attribution: newProviderAttribution.trim() || undefined,
			maxZoom: newProviderMaxZoom
		});

		if (!success) {
			addProviderError = 'A provider with this name already exists';
			return;
		}

		resetForm();
	}

	//-- Handle resetting the add provider form --
	function resetForm() {
		newProviderName = '';
		newProviderUrl = '';
		newProviderAttribution = '';
		newProviderMaxZoom = 19;
		addProviderError = '';
	}

	//-- Handle removing a provider --
	function handleRemoveProvider(name: string) {
		if (!confirm(`Remove provider "${name}"?`)) return;

		const success = tileProviders.removeProvider(name);
		if (success) {
			dispatch('providerRemoved', { name });
			if (selectedNames.has(name)) {
				selectedNames = new Set(Array.from(selectedNames).filter((n) => n !== name));
			}
		}
	}

	//-- Handle importing providers from JSON file --
	function handleFileImport(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = () => {
			const content = reader.result as string;
			const result = tileProviders.importProviders(content);
			if (result.error) {
				alert('Failed to import providers: ' + result.error);
			} else if (result.added > 0) {
				alert(
					`Imported ${result.added} provider(s)` +
						(result.skipped > 0 ? ` (${result.skipped} skipped)` : '')
				);
			} else if (result.skipped > 0) {
				alert(`${result.skipped} provider(s) skipped — they may already exist or contain invalid data.`);
			} else {
				alert('No valid providers found in file');
			}
		};
		reader.onerror = () => {
			alert('Failed to read file');
		};
		reader.readAsText(file);

		// Reset input
		input.value = '';
	}

	//-- Handle exporting a single provider to JSON file --
	function exportSingleProvider(name: string) {
		const json = tileProviders.exportProviders([name]);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${name.replace(/[^a-z0-9-_]/gi, '_') || 'provider'}.json`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}

	//-- Handle toggling selection of a provider in the list --
	function toggleSelection(name: string, checked: boolean) {
		if (checked) selectedNames.add(name);
		else selectedNames.delete(name);
		selectedNames = new Set(Array.from(selectedNames));
	}

	$: allSelected = providers.length > 0 && providers.every((p) => selectedNames.has(p.name));

	//-- Handle toggling selection of all providers in the list --
	function toggleSelectAll(checked: boolean) {
		if (checked) {
			selectedNames = new Set(providers.map((p) => p.name));
		} else {
			selectedNames = new Set();
		}
	}

	//-- Handle exporting selected providers to JSON file --
	function exportSelected() {
		if (selectedCount === 0) return;
		const names = Array.from(selectedNames);
		const json = tileProviders.exportProviders(names);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'tile-providers-selected.json';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}

	//-- Handle deleting selected providers --
	function deleteSelected() {
		if (selectedCount === 0) return;
		const names = Array.from(selectedNames);
		// Partition selected into deletable (non-built-in) and non-deletable (built-in)
		const deletable = providers
			.filter((p) => names.includes(p.name) && !p.isBuiltIn)
			.map((p) => p.name);
		const nonDeletable = names.filter((n) => !deletable.includes(n));

		if (deletable.length === 0) {
			alert('Default or built-in providers cannot be deleted.');
			return;
		}

		let confirmMsg = '';
		if (nonDeletable.length > 0) {
			confirmMsg = `Some selected providers are built-in and cannot be deleted (e.g. ${nonDeletable[0]}). Delete ${deletable.length} other selected provider(s)?`;
		} else {
			confirmMsg = `Remove ${deletable.length} selected provider(s)?`;
		}

		if (!confirm(confirmMsg)) return;

		const removed = tileProviders.removeProviders(deletable);
		// remove deleted names from selection reactively
		selectedNames = new Set(Array.from(selectedNames).filter((n) => !deletable.includes(n)));
		if (removed > 0) {
			dispatch('providersRemoved', { removed });
		}
	}
</script>

{#if show}
	<div class="modal-backdrop" aria-hidden="true" on:click={handleClose}></div>
	<div class="provider-modal">
		<div
			class="provider-panel"
			role="dialog"
			aria-labelledby="map-providers-title"
			aria-modal="true"
		>
			<div class="provider-panel-header">
				<h4 id="map-providers-title">Map Providers</h4>
				<button class="btn btn-sm btn-close-modal" on:click={handleClose} title="Close">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="provider-actions">
				<button
					class="btn btn-sm btn-toggle"
					class:btn-primary={showTileList}
					on:click={() => {
						showTileList = !showTileList;
						selectedNames = new Set();
					}}
					title="Show existing tile providers"><i class="bi bi-list"></i></button
				>
				{#if !showTileList}
					<button class="btn btn-sm" on:click={() => fileInput?.click()} title="Import from JSON">
						<i class="bi bi-upload"></i> Import
					</button>
				{/if}
			</div>
			<!-- Add provider form -->
			{#if !showTileList}
				<div class="add-provider-form">
					<h5>Add Custom Provider</h5>
					{#if addProviderError}
						<div class="form-error">{addProviderError}</div>
					{/if}
					<div class="form-group">
						<label for="provider-name">Name</label>
						<input
							id="provider-name"
							type="text"
							bind:value={newProviderName}
							placeholder="e.g., Google Satellite"
							class="form-control"
						/>
					</div>
					<div class="form-group">
						<label for="provider-url">Tile URL Template</label>
						<input
							id="provider-url"
							type="text"
							bind:value={newProviderUrl}
							placeholder={'https://example.com/tiles/{z}/{x}/{y}.png'}
							class="form-control"
						/>
						<small class="form-hint">Must include {'{x}'}, {'{y}'}, {'{z}'} placeholders</small>
					</div>
					<div class="form-group">
						<label for="provider-attribution">Attribution (optional)</label>
						<input
							id="provider-attribution"
							type="text"
							bind:value={newProviderAttribution}
							placeholder="© Provider Name"
							class="form-control"
						/>
					</div>
					<div class="form-group">
						<label for="provider-maxzoom">Max Zoom</label>
						<input
							id="provider-maxzoom"
							type="number"
							bind:value={newProviderMaxZoom}
							min="1"
							max="19"
							class="form-control"
						/>
					</div>
					<div class="form-actions">
						<button
							class="btn btn-secondary"
							on:click={() => {
								resetForm();
							}}>Cancel</button
						>
						<button class="btn  btn-primary" on:click={handleAddProvider}>Save</button>
					</div>
				</div>
			{/if}
			{#if showTileList}
				<div class="select-all-row">
					<label class="provider-select">
						<input
							type="checkbox"
							checked={allSelected}
							on:change={(e) => toggleSelectAll((e.target as HTMLInputElement).checked)}
						/>
					</label>
					<span class="select-all-label">{allSelected ? 'Deselect all' : 'Select all'}</span>
				</div>
				<div class="provider-list">
					{#each providers as provider}
						<div class="provider-item">
							<label class="provider-select">
								<input
									type="checkbox"
									checked={selectedNames.has(provider.name)}
									on:change={(e) =>
										toggleSelection(provider.name, (e.target as HTMLInputElement).checked)}
								/>
							</label>
							<div class="provider-info">
								<strong>{provider.name}</strong>
								{#if provider.isBuiltIn}
									<span class="badge badge-builtin">Built-in</span>
								{/if}
								{#if provider.url}
									<small class="provider-url" title={provider.url}
										>{provider.url.slice(0, 40)}...</small
									>
								{:else}
									<small class="provider-url">Default OSM tiles</small>
								{/if}
							</div>
							<div class="provider-actions-inline">
								{#if !provider.isBuiltIn && selectedCount <= 1}
									<button
										class="btn btn-sm btn-danger"
										on:click={() => handleRemoveProvider(provider.name)}
										title="Remove provider"
									>
										<i class="bi bi-trash"></i>
									</button>
								{/if}
								{#if selectedCount <= 1}
									<button
										class="btn btn-sm inline-export-btn"
										on:click={() => exportSingleProvider(provider.name)}
										title="Export this provider"
									>
										<i class="bi bi-download"></i>
									</button>
								{/if}
							</div>
						</div>
					{/each}
					{#if selectedCount > 1}
					<div class="selection-actions">
						<div class="selection-count">{selectedCount} selected</div>
						<div class="selection-buttons">
							<button class="btn btn-sm btn-danger" on:click={deleteSelected}>
								<i class="bi bi-trash"></i> Delete
							</button>
							<button class="btn btn-sm export-btn" on:click={exportSelected}>
								<i class="bi bi-download"></i> Export
							</button>
						</div>
					</div>
				{/if}
				</div>
				
			{/if}

			<!-- Hidden file input for import -->
			<input
				type="file"
				accept="application/json,.json"
				bind:this={fileInput}
				style="display:none"
				on:change={handleFileImport}
			/>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
	}

	.provider-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.provider-panel {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		padding-bottom: 2.5rem;
		max-height: 70vh;
		width: 90vw;
		max-width: 420px;
		overflow-y: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		pointer-events: auto;
		position: relative;
	}
	.provider-panel::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}

	.provider-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.provider-panel-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.btn-close-modal {
		width: 26px;
		height: 26px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		color: var(--text-primary);
		transition: background 0.2s;
		font-size: 0.75rem;
	}

	.btn-close-modal:hover {
		background: var(--icon-hover-bg);
	}

	.select-all-row {
		display: flex;
		align-items: center;
		padding: 0.3rem 0.5rem;
		margin-bottom: 0.3rem;
		border-bottom: 1px solid var(--border);
	}

	.select-all-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-left: 0.35rem;
		user-select: none;
	}

	.provider-list {
		margin-bottom: 0.5rem;
	}

	.provider-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.5rem;
		border-radius: 4px;
		margin-bottom: 0.3rem;
		background: var(--bg-primary);
		border: 1px solid var(--border);
	}

	.provider-select {
		display: inline-flex;
		align-items: center;
		margin-right: 0.5rem;
	}

	.provider-actions-inline {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.provider-info {
		flex: 1;
		min-width: 0;
	}

	.provider-info strong {
		display: block;
		font-size: 0.82rem;
		color: var(--text-primary);
	}

	.provider-info .provider-url {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 250px;
	}

	.badge-builtin {
		display: inline-block;
		font-size: 0.65rem;
		padding: 2px 6px;
		border-radius: 10px;
		background: var(--edit-btn);
		color: white;
		margin-left: 0.5rem;
		vertical-align: middle;
	}

	.provider-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.provider-actions .btn {
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border);
	}
	.provider-actions .btn.btn-primary {
		background: var(--edit-btn);
		color: white;
		border: none;
	}

	.provider-actions .btn.btn-toggle {
		margin-right: auto;
	}
	.add-provider-form {
		background: var(--bg-primary);
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		margin-top: 0.5rem;
		border: 1px solid var(--border);
	}

	.add-provider-form h5 {
		margin: 0 0 0.4rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.form-group {
		margin-bottom: 0.4rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8rem;
		font-weight: 500;
		margin-bottom: 0.15rem;
		color: var(--text-primary);
	}

	.form-group .form-control {
		width: 100%;
		padding: 0.3rem 0.45rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.8rem;
		background: var(--bg-card);
		color: var(--text-primary);
		height: 30px;
	}

	.form-group .form-control::placeholder {
		color: var(--text-muted);
	}

	.form-group .form-control:focus {
		border-color: var(--field-border);
		outline: none;
		box-shadow: 0 0 0 2px rgba(var(--field-border-rgb), 0.2);
	}

	.form-group .form-hint {
		display: block;
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 0.1rem;
	}

	.form-error {
		background: var(--clear-btn-bg);
		color: var(--error-color);
		padding: 0.35rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		margin-bottom: 0.4rem;
		border: 1px solid var(--error-color);
	}

	.form-actions {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	.form-actions .btn {
		flex: 1;
		text-align: center;
	}

	.selection-actions {
		position: sticky;
		bottom: -2.5rem;
		z-index: 10;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 0.75rem;
		margin: 0 -0.75rem -2.5rem;
		background: var(--bg-card);
		border-top: 1px solid var(--border);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
		border-radius: 0 0 10px 10px;
	}
	.inline-export-btn {
		color: var(--text-primary);
	}
	.selection-count {
		font-size: 0.8rem;
		color: var(--text-primary);
	}

	.selection-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.export-btn {
		color: var(--text-primary);
		background: var(--bg-card);
		border: 1px solid var(--border);
	}

	.export-btn:hover {
		background: var(--icon-hover-bg);
	}
</style>
