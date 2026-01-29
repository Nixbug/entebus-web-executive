<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import DeleteConfirmationModal from '../DeleteConfirmationModal.svelte';
	import CreationForm from '../CreationForm.svelte';

	export let busStops: any[] = [];
	export let landmarkId: string = '';
	export let showAddForm: boolean = false;
	//-- Bus stop location WKT passed from MapPreview --
	export let busStopLocation: string | null = null;

	const dispatch = createEventDispatcher();
	//-- Enable Add Bus Stop button only when a location is selected --
	$: isButtonEnabled = !!busStopLocation;
	let showDeleteModal = false;
	let busStopToDelete: { id?: string; name?: string } | null = null;

	$: filteredBusStops = busStops.filter((bs) => String(bs.landmarkId) === String(landmarkId));

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

	function handleDeleteClick(bs: { id?: string; name?: string }) {
		busStopToDelete = bs;
		showDeleteModal = true;
	}

	function handleDeleteConfirm() {
		if (busStopToDelete) {
			dispatch('delete', busStopToDelete);
		}
		showDeleteModal = false;
		busStopToDelete = null;
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
		busStopToDelete = null;
	}
</script>

<section class="section">
	<div class="section-header">
		<h4 class="fw-inter-700">Bus Stops</h4>
		<button 
			disabled={!isButtonEnabled} 
			class="btn btn-sm btn-primary" 
			on:click={handleAddClick} 
			aria-label="Add Bus Stop"
			title={!isButtonEnabled ? 'Mark a bus stop location on the map first' : 'Add Bus Stop'}
		>
			<i class="bi bi-plus-lg"></i> Add Bus Stop
		</button>
	</div>

	{#if filteredBusStops.length > 0}
		{#each filteredBusStops as bs}
			<div class="section-card busstop-card">
				<div class="busstop-row">
					<div class="busstop-info">
						<div class="busstop-id fw-inter-600">{bs.id}</div>
						<div class="busstop-name fw-inter-600" title={bs.name}>{bs.name || 'Unnamed Stop'}</div>
						{#if bs.location}
							<div class="busstop-location">{bs.location}</div>
						{/if}
					</div>
					<div class="busstop-actions">
						<button
							class="btn btn-sm btn-outline-primary"
							on:click={() => dispatch('edit', bs)}
							aria-label="Edit bus stop"
						>
							<i class="bi bi-pencil"></i>
						</button>
						<button
							class="btn btn-sm btn-outline-danger"
							on:click={() => handleDeleteClick(bs)}
							aria-label="Delete bus stop"
						>
							<i class="bi bi-trash"></i>
						</button>
					</div>
				</div>
			</div>
		{/each}
	{:else}
		<p class="empty-busstops">No bus stops for this landmark.</p>
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
	/>
{/if}

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

	.busstop-actions .btn {
		padding: 4px 8px;
		height: 32px;
	}

	.empty-busstops {
		margin: 0;
		padding: 18px 20px;
		color: var(--text-muted);
	}
</style>
