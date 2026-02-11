<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { tileProviders } from '$lib/stores/tile-providers';
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

	const dispatch = createEventDispatcher();

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
				alert(`No new providers imported (${result.skipped} skipped - may already exist)`);
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

	//-- Handle exporting custom providers to JSON file --
	function handleExportProviders() {
		const json = tileProviders.exportProviders();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'tile-providers.json';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
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
					on:click={() => (showTileList = !showTileList)}
					title="Show existing tile providers"><i class="bi bi-list"></i></button
				>
				<button class="btn btn-sm" on:click={() => fileInput?.click()} title="Import from JSON">
					<i class="bi bi-upload"></i> Import
				</button>
				<button class="btn btn-sm" on:click={handleExportProviders} title="Export custom providers">
					<i class="bi bi-download"></i> Export
				</button>
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
						<button class="btn btn-sm btn-primary" on:click={handleAddProvider}>Save</button>
						<button
							class="btn btn-sm"
							on:click={() => {
								resetForm();
							}}>Cancel</button
						>
					</div>
				</div>
			{/if}
			{#if showTileList}
				<div class="provider-list">
					{#each providers as provider}
						<div class="provider-item">
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
							{#if !provider.isBuiltIn}
								<button
									class="btn btn-sm btn-danger"
									on:click={() => handleRemoveProvider(provider.name)}
									title="Remove provider"
								>
									<i class="bi bi-trash"></i>
								</button>
							{/if}
						</div>
					{/each}
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
		z-index: 1050;
	}

	.provider-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1100;
		width: 90%;
		max-width: 480px;
	}

	.provider-panel {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		padding: 1.25rem;
		max-height: 80vh;
		overflow-y: auto;
	}

	.provider-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.provider-panel-header h4 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.btn-close-modal {
		width: 32px;
		height: 32px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		color: var(--text-primary);
		transition: background 0.2s;
	}

	.btn-close-modal:hover {
		background: var(--icon-hover-bg);
	}

	.provider-list {
		margin-bottom: 1rem;
	}

	.provider-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border);
	}

	.provider-info {
		flex: 1;
		min-width: 0;
	}

	.provider-info strong {
		display: block;
		font-size: 0.9rem;
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
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
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

	/* push the toggle button to the left edge of the actions row */
	.provider-actions .btn.btn-toggle {
		margin-right: auto;
	}
	.add-provider-form {
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 6px;
		margin-top: 1rem;
		border: 1px solid var(--border);
	}

	.add-provider-form h5 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.form-group {
		margin-bottom: 0.75rem;
	}

	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--text-primary);
	}

	.form-group .form-control {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.85rem;
		background: var(--bg-card);
		color: var(--text-primary);
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
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.form-error {
		background: var(--clear-btn-bg);
		color: var(--error-color);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
		border: 1px solid var(--error-color);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.form-actions .btn {
		color: var(--text-primary);
		background: var(--bg-card);
		border: 1px solid var(--border);
	}

	.form-actions .btn:hover {
		background: var(--icon-hover-bg);
	}

	.form-actions .btn-primary {
		background: var(--edit-btn);
		color: white;
		border: none;
	}

	.btn-danger {
		background: var(--delete-btn);
		color: white;
		border: none;
	}

	.btn-danger:hover {
		opacity: 0.9;
	}

	@media (max-width: 480px) {
		.provider-modal {
			width: 95%;
			max-width: none;
		}

		.provider-panel {
			max-height: 85vh;
			padding: 1rem;
		}
	}
</style>
