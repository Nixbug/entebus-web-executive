<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import DeleteConfirmationModal from '../DeleteConfirmationModal.svelte';
	import CreationForm from '../CreationForm.svelte';
	import type { FetchBusStopListResponse } from '$lib/services/bus-stop';

	//-- Props --
	export let busStops: FetchBusStopListResponse = [];
	export let landmarkId: string = '';
	export let showAddForm: boolean = false;
	//-- Bus stop location WKT passed from MapPreview --
	export let busStopLocation: string | null = null;
	//-- Expose editing bus stop ID to parent for map drag interaction --
	export let editingBusStopId: string | null = null;

	export let hasBusStopDeletePermission = true;
	export let hasBusStopEditPermission = true;
	export let disabledDeleteTooltip = 'You do not have permission to delete this item.';
	export let disabledUpdateTooltip = 'You do not have permission to update this item.';

	type DeleteBusStopHandler = (
		busStopId: string | number
	) => boolean | void | Promise<boolean | void>;
	export let onDeleteBusStop: DeleteBusStopHandler = () => {};

	const dispatch = createEventDispatcher();
	//-- Enable Add Bus Stop button only when a location is selected --
	$: isButtonEnabled = !!busStopLocation;
	let showDeleteModal = false;
	let busStopToDelete: { id?: string; name?: string } | null = null;
	let isDeleting = false;

	//-- Inline editing state --
	let editableBusStop: { id?: string; name?: string; location?: string } = {};

	$: filteredBusStops = busStops.filter((bs) => String(bs.landmark_id) === String(landmarkId));

	//-- Bus stop form fields --
	const busStopFields = [
		{
			name: 'name',
			label: 'Name',
			placeholder: 'Enter bus stop name',
			required: true,
			fullWidth: true
		},
		{
			name: 'location',
			label: 'Location',
			placeholder: 'Enter bus stop location',
			required: true,
			fullWidth: true,
			readonly: true
		}
	];

	function handleAddClick() {
		showAddForm = true;
	}

	//-- Start inline editing --
	function handleEditClick(bs: FetchBusStopListResponse[number]) {
		editingBusStopId = String(bs.id) ?? null;
		editableBusStop = {
			id: String(bs.id),
			name: bs.name,
			location: bs.location
		};
	}

	//-- Confirm inline edit --
	function handleEditConfirm() {
		if (editingBusStopId && editableBusStop.name?.trim()) {
			dispatch('edit', { ...editableBusStop });
			editingBusStopId = null;
			editableBusStop = {};
		}
	}

	//-- Cancel inline edit --
	function handleEditCancel() {
		editingBusStopId = null;
		editableBusStop = {};
	}

	//-- Update location when bus stop is dragged on map --
	export function updateBusStopLocation(busStopId: string, location: string) {
		if (editingBusStopId === busStopId) {
			editableBusStop = { ...editableBusStop, location };
		}
	}

	//-- Delete bus stop handlers --
	function handleDeleteClick(bs: FetchBusStopListResponse[number]) {
		busStopToDelete = {
			id: String(bs.id),
			name: bs.name
		};
		showDeleteModal = true;
	}

	async function handleDeleteConfirm() {
		if (!busStopToDelete) return;
		isDeleting = true;
		try {
			const result = await onDeleteBusStop(busStopToDelete.id ?? '');
			if (result === false) return;
			showDeleteModal = false;
			busStopToDelete = null;
		} catch (e) {
			console.error(e);
		} finally {
			isDeleting = false;
		}
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
		busStopToDelete = null;
	}
</script>

<section class="section">
	<div class="section-header">
		<h4 class="fw-inter-700">Bus Stops</h4>
		{#if isButtonEnabled}
			<span title={!isButtonEnabled ? 'Mark a bus stop location on the map first' : 'Add Bus Stop'}>
				<button
					disabled={!isButtonEnabled}
					class="btn btn-sm btn-primary"
					on:click={handleAddClick}
					aria-label="Add Bus Stop"
				>
					<i class="bi bi-plus-lg"></i> Add Bus Stop
				</button>
			</span>
		{/if}
	</div>

	{#if filteredBusStops.length > 0}
		{#each filteredBusStops as bs}
			<div class="section-card busstop-card">
				<div class="busstop-row">
					{#if editingBusStopId === String(bs.id)}
						<!-- Inline Edit Mode -->
						<div class="busstop-edit-wrapper">
							<div class="busstop-edit-form">
								<div class="edit-field">
									<label for="id-input" class="edit-label fw-inter-600">ID</label>
									<input
										id="id-input"
										type="text"
										class="edit-input"
										value={editableBusStop.id || ''}
										readonly
									/>
								</div>
								<div class="edit-field">
									<label for="name-input" class="edit-label fw-inter-600"
										>Name <span class="text-danger">*</span></label
									>
									<!-- svelte-ignore a11y_autofocus -->
									<input
										id="name-input"
										type="text"
										class="edit-input"
										bind:value={editableBusStop.name}
										placeholder="Enter bus stop name"
										autofocus
									/>
								</div>
								<div class="edit-field">
									<label for="location-input" class="edit-label fw-inter-600">Location</label>
									<input
										id="location-input"
										type="text"
										class="edit-input"
										value={editableBusStop.location || ''}
										readonly
									/>
								</div>
							</div>
							<div class="busstop-edit-actions">
								<button
									class="btn btn-sm btn-outline-secondary edit-btn"
									on:click={handleEditCancel}
									aria-label="Cancel edit"
								>
									<i class="bi bi-x-lg"></i> Cancel
								</button>
								<button
									class="btn btn-sm btn-primary edit-btn"
									on:click={handleEditConfirm}
									aria-label="Confirm edit"
									disabled={!editableBusStop.name?.trim()}
								>
									<i class="bi bi-check-lg"></i> Confirm
								</button>
							</div>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="busstop-info">
							<div class="busstop-id fw-inter-600">BS-{bs.id}</div>
							<div class="busstop-name fw-inter-600" title={bs.name}>
								{bs.name || 'Unnamed Stop'}
							</div>
							{#if bs.location}
								<div class="busstop-location">{bs.location}</div>
							{/if}
						</div>
						<div class="busstop-actions">
							<button
								class="icon-btn edit"
								class:disabled={!hasBusStopEditPermission}
								aria-label="Edit"
								aria-disabled={!hasBusStopEditPermission}
								title={!hasBusStopEditPermission ? disabledUpdateTooltip : undefined}
								tabindex={!hasBusStopEditPermission ? -1 : undefined}
								on:click={() => handleEditClick(bs)}
							>
								<i class="bi bi-pencil"></i>
							</button>
							<button
								class="icon-btn delete"
								class:disabled={!hasBusStopDeletePermission}
								aria-label="Delete"
								aria-disabled={!hasBusStopDeletePermission}
								title={!hasBusStopDeletePermission ? disabledDeleteTooltip : undefined}
								tabindex={!hasBusStopDeletePermission ? -1 : undefined}
								on:click={() => handleDeleteClick(bs)}
							>
								<i class="bi bi-trash"></i>
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{:else}
		<p class="empty-busstops">No bus stops found for this landmark.</p>
	{/if}
</section>
<hr style="color: var(--text-muted);" />

<CreationForm
	bind:open={showAddForm}
	fields={busStopFields}
	values={{ location: busStopLocation ?? '' }}
	title="Add New Bus Stop"
	titleIcon="bi bi-geo-alt-fill"
	on:close={() => (showAddForm = false)}
	on:submit={(e) => {
		dispatch('addBusStop', { ...e.detail, landmarkId });
		showAddForm = false;
	}}
/>

{#if showDeleteModal && busStopToDelete}
	<DeleteConfirmationModal
		id={busStopToDelete.id ?? ''}
		name={busStopToDelete.name ?? ''}
		sectionName="bus stop"
		onConfirm={handleDeleteConfirm}
		onCancel={handleDeleteCancel}
		loading={isDeleting}
	/>
{/if}

<!-- Styles -->
<style>
	.section {
		margin-top: 30px;
	}

	.section h4 {
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.section-card {
		background: var(--bg-card);
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--border);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.busstop-card {
		margin-bottom: 10px;
	}

	.busstop-card:last-of-type {
		margin-bottom: 0;
	}

	.busstop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		gap: 12px;
	}

	.busstop-info {
		flex: 1;
		min-width: 0;
	}

	.busstop-name,
	.busstop-id {
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.busstop-location {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.busstop-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-shrink: 0;
	}

	.icon-btn {
		width: 38px;
		height: 38px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: 0.2s ease-in-out;
		font-size: 18px;
	}

	.icon-btn.edit:hover {
		border-color: var(--edit-btn);
		color: var(--edit-btn);
		background: var(--clear-btn-bg);
	}

	.icon-btn.delete:not(.disabled):hover {
		border-color: var(--delete-btn);
		color: var(--delete-btn);
		background: var(--clear-btn-bg);
	}

	.icon-btn.delete.disabled,
	.icon-btn.edit.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		border-color: var(--border) !important;
		color: var(--text-muted) !important;
		background: var(--bg-card) !important;
	}

	.empty-busstops {
		margin: 0;
		padding: 18px 20px;
		color: var(--text-muted);
	}

	.busstop-edit-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.busstop-edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.edit-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.edit-input {
		width: 100%;
		padding: 8px 12px;
		font-size: 13px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		color: var(--text-primary);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}
	input:focus {
		outline: none;
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: var(--bg-primary);
	}

	.busstop-edit-actions {
		display: flex;
		gap: 10px;
		width: 100%;
		border-top: 1px solid var(--border);
		padding-top: 12px;
	}

	.busstop-edit-actions .edit-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		height: 38px;
		font-size: 13px;
		border-radius: 8px;
	}
</style>
