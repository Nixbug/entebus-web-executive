<script lang="ts">
	import { goto } from '$app/navigation';
	import CodeMirrorEditor from './CodeMirrorEditor.svelte';
	import CustomSelect from '../CustomSelect.svelte';
	import DeleteConfirmationModal from '../DeleteConfirmationModal.svelte';
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import HomeButton from '../HomeButton.svelte';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import type { Fare } from '$lib/types/type';

	//-- Props --
	export let initialData: Fare | null = null;
	export let pageTitle: string = 'Fare Template';
	export let pageDescription: string =
		'Fare templates are used to calculate fares for different types of tickets';
	export let listingHref: string = '/global-fare';
	
		const dispatch = createEventDispatcher();

	let showDeleteModal = false;
	let loading = false;

	//-- Responsive/mobile state --
	let isMobile = false;
	let activeView: 'form' | 'editor' = 'form';
	let editorHeight = '530px';

	//-- Form state --
	let name = '';
	let version = 1;
	let currency = 'INR';
	let distanceUnit = 'm';

	let ticketTypes: { id: number; name: string }[] = [
		{ id: 1, name: 'Adult' },
		{ id: 2, name: 'Child' },
		{ id: 3, name: 'Student' }
	];

	//-- refs to ticket name inputs so we can focus newly added / first-empty ones --
	let ticketNameEls: (HTMLInputElement | null)[] = [];

	//-- Default JS code template --
	let jsCode = `function getFare(ticket_type, distance, extra) {
const base_fare_distance = 2.5;
const base_fare = 10;
const rate_per_km = 1;

distance = distance / 1000;
if (ticket_type == "Student") {
	if (distance <= 2.5) return 1;
	else if (distance <= 7.5) return 2;
	else if (distance <= 17.5) return 3;
	else if (distance <= 27.5) return 4;
	else return 5;
}

if (ticket_type == "Adult") {
	if (distance <= base_fare_distance) return base_fare;
	else return base_fare + ((distance - base_fare_distance) * rate_per_km);
}

if (ticket_type == "Child") {
	if (distance <= base_fare_distance) return base_fare / 2;
	else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
}
return -1;
	}`;

	//-- Track form initial state for comparison --
	let initialFormState = {
		name: '',
		version: 1,
		currency: 'INR',
		distanceUnit: 'm',
		ticketTypes: [] as { id: number; name: string }[],
		jsCode: ''
	};

	//-- Computed property to check if form has changed --
	$: formHasChanged = (() => {
		if (!initialData) return false;

		const currentState = {
			name: name.trim(),
			version,
			currency,
			distanceUnit,
			ticketTypes: JSON.parse(JSON.stringify(ticketTypes)),
			jsCode: jsCode.trim()
		};

		return JSON.stringify(currentState) !== JSON.stringify(initialFormState);
	})();

	//-- Handler for window resize --
	function handleResize() {
		isMobile = window.innerWidth <= DESKTOP_BREAKPOINT;
		//-- keep default view as form on mobile --
		if (isMobile) activeView = activeView || 'form';
		//-- desktop: both panels visible, keep form as default activeView --
		if (!isMobile) activeView = 'form';
	}

	//-- Initialize form (if provided) and set up resize listener --
	onMount(() => {
		//-- Initialize form with initialData if available --
		if (initialData) {
			name = initialData.name || '';
			version = Number(initialData.version) || 1;
			currency = initialData.attributes?.currency_type || 'INR';
			distanceUnit = initialData.attributes?.distance_unit || 'm';

			if (initialData.attributes?.ticket_types) {
				ticketTypes = initialData.attributes.ticket_types.map((t: any) => ({
					id: Number(t.id || t.key || 0),
					name: t.name || ''
				}));
			}
			if (initialData.function) jsCode = initialData.function;

			//-- Store initial state after initializing form --
			initialFormState = {
				name: name,
				version,
				currency,
				distanceUnit,
				ticketTypes: JSON.parse(JSON.stringify(ticketTypes)), // Deep clone
				jsCode: jsCode
			};
		}

		//-- Set up resize listener (always) --
		if (typeof window !== 'undefined') {
			handleResize();
			window.addEventListener('resize', handleResize);
		}
	});

	//-- Clean up resize listener --
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize);
	});

	//-- Ticket Types management (add, remove, validate)--

	function validateTickets() {
		const errors: any = ticketTypes.map((t) => (!t.name.trim() ? 'Name required' : ''));
		if (ticketTypes.length === 0) {
			errors.push('At least one ticket type required');
		}
		return errors;
	}

	function addTicket() {
		//-- focus first empty ticket name if any (only check existing tickets) --
		const firstEmpty = ticketTypes.findIndex((t) => !t.name.trim());
		if (firstEmpty !== -1) {
			//-- ensure input refs updated then focus --
			tick().then(() => ticketNameEls[firstEmpty]?.focus());
			return;
		}
		const newId = Math.max(0, ...ticketTypes.map((t) => t.id)) + 1;
		ticketTypes = [...ticketTypes, { id: newId, name: '' }];
		//-- ensure input refs updated then focus --
		const newIndex = ticketTypes.length - 1;
		tick().then(() => ticketNameEls[newIndex]?.focus());
	}

	function removeTicket(idx: number) {
		ticketTypes = ticketTypes.filter((_, i) => i !== idx);
		ticketNameEls.splice(idx, 1);
	}

	//-- Handle form submission (create/update) --
	async function handleSubmit() {
		const data = {
			name: name.trim(),
			function: jsCode,
			attributes: {
				df_version: version,
				ticket_types: ticketTypes,
				currency_type: currency,
				distance_unit: distanceUnit,
				extra: {}
			}
		};

		loading = true;
		try {
			if (initialData) {
				dispatch('update', { id: initialData.id, ...data });
				initialFormState = {
					name: name,
					version,
					currency,
					distanceUnit,
					ticketTypes: JSON.parse(JSON.stringify(ticketTypes)),
					jsCode: jsCode
				};
			} else {
				dispatch('create', data);
			}
			console.log('Fare saved (dispatched)', data);
		} finally {
			loading = false;
		}
	}

	//-- Handle cancel (reset form to initial data) --
	function onCancelClick() {
		name = initialData?.name || '';
		version = Number(initialData?.version ?? 1);
		currency = initialData?.attributes?.currency_type || 'INR';
		distanceUnit = initialData?.attributes?.distance_unit || 'm';
		ticketTypes = initialData?.attributes?.ticket_types
			? JSON.parse(JSON.stringify(initialData.attributes.ticket_types))
			: [];
		jsCode = initialData?.function || '';
	}

	//-- Delete management --
	function openDeleteModal() {
		showDeleteModal = true;
	}

	function cancelDelete() {
		showDeleteModal = false;
	}
	function confirmDelete() {
		showDeleteModal = false;
		if (initialData?.id) dispatch('delete', initialData.id);
	}
</script>

<div class="fare-page">
	<div class="container">
		<HomeButton to={listingHref} icon="bi bi-arrow-left" ariaLabel="Back" />
		<div class="position-relative">
			<h3>{pageTitle}</h3>
			<p>{pageDescription}</p>
		</div>

		<div class="row g-4 mt-3">
			<!-- Left Panel -->
			{#if !isMobile || activeView === 'form'}
				<div class={isMobile ? 'col-12' : 'col-lg-5'}>
					<div class="card fare-card">
						<div class="card-body">
							<h5 class="mb-4">Fare Structure</h5>

							<div class="mb-4">
								<label for="name" class="form-label">Fare Name</label>
								<input
									id="name"
									placeholder="Enter fare name"
									class="form-control"
									bind:value={name}
								/>
							</div>

							<div class="mb-4">
								<h6 class="mb-3">Attributes</h6>
								<div class="row g-2">
									<div class="col-4">
										<label for="currency" class="form-label">Currency</label>
										<CustomSelect options={['INR']} bind:value={currency} />
									</div>
									<div class="col-4">
										<label for="distanceUnit" class="form-label">Unit</label>
										<CustomSelect options={['m']} bind:value={distanceUnit} />
									</div>
									<div class="col-4">
										<label for="version" class="form-label">Version</label>
										<input class="form-control" bind:value={version} readonly />
									</div>
								</div>
							</div>

							<div class="mb-4 ticket-types-section">
								<div class="d-flex justify-content-between align-items-center mb-2">
									<h6 class="mb-0">Ticket Types</h6>
									<button class="btn btn-sm btn-outline-primary" on:click={addTicket}>
										+ Add Type
									</button>
								</div>

								<div class="ticket-types-container">
									{#each ticketTypes as ticket, idx}
										<div class="row g-2 align-items-center mb-2">
											<div class="col-7">
												<input
													class="form-control"
													bind:value={ticket.name}
													placeholder="Type name"
													bind:this={ticketNameEls[idx]}
												/>
											</div>
											<div class="col-3">
												<input
													class="form-control"
													type="number"
													min="1"
													bind:value={ticket.id}
													readonly
													placeholder="ID"
												/>
											</div>
											<div class="col-2 text-end">
												<button
													class="btn btn-sm btn-outline-danger"
													on:click={() => removeTicket(idx)}
													aria-label="Remove"
												>
													<i class="bi bi-trash"></i>
												</button>
											</div>
										</div>
									{/each}
								</div>
							</div>

							{#if initialData}
								<div class=" d-flex gap-2 mt-3">
									{#if formHasChanged}
										<button class="btn btn-outline-secondary w-100" on:click={onCancelClick}>
											Cancel
										</button>
									{:else}
										<button
											class="btn btn-outline-danger w-100"
											on:click={openDeleteModal}
											disabled={loading}
										>
											Delete Fare
										</button>
									{/if}
									{#if formHasChanged}
										<button
											class="btn btn-outline-primary w-100"
											on:click={handleSubmit}
											disabled={loading || !formHasChanged}
										>
											{loading ? 'Saving...' : 'Update'}
										</button>
									{/if}
								</div>
							{:else}
								<div class="mt-4">
									<button
										class="btn btn-outline-primary w-100"
										on:click={handleSubmit}
										disabled={loading}
									>
										{loading ? 'Saving...' : 'Save Fare'}
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Right Panel -->
			{#if !isMobile || activeView === 'editor'}
				<div class={isMobile ? 'col-12' : 'col-lg-7'}>
					<CodeMirrorEditor bind:value={jsCode} {ticketTypes} {currency} height={editorHeight} />
				</div>
			{/if}
		</div>

		<!-- Mobile view switcher -->
		{#if isMobile}
			<!-- Floating action button to toggle views on mobile -->
			<button
				class="fab btn btn-primary"
				aria-label="Toggle editor"
				on:click={() => (activeView = activeView === 'form' ? 'editor' : 'form')}
			>
				{#if activeView === 'form'}
					<i class="bi bi-code"></i>
				{:else}
					<i class="bi bi-file-earmark-text"></i>
				{/if}
			</button>
		{/if}
	</div>

	<!-- Delete confirmation modal -->
	{#if showDeleteModal}
		<DeleteConfirmationModal
			id={initialData?.id}
			name={initialData?.name}
			sectionName="fare"
			onConfirm={confirmDelete}
			onCancel={cancelDelete}
		/>
	{/if}
</div>

<style>
	h3,
	p {
		color: var(--text-primary);
	}
	.fare-page {
		background: var(--bg-primary);
		min-height: 100vh;
		padding: 1rem 1rem;
		overflow-x: hidden;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		position: relative;
		padding-top: 2rem;
	}

	.card {
		border: 1px solid var(--border);
		background: var(--bg-card);
		border-radius: 12px;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.fare-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	h5,
	h6 {
		color: var(--text-primary);
		font-weight: 600;
	}

	.col-lg-5,
	.col-lg-7 {
		height: 100%;
		max-width: 100%;
		min-height: 0;
	}

	.ticket-types-section {
		display: flex;
		flex-direction: column;
		flex: none;
		min-height: 0;
	}

	.ticket-types-container {
		overflow-y: auto;
		min-height: calc(3 * 56px);
		max-height: calc(3 * 56px);
		padding-right: 0.5rem;
		margin-right: -0.5rem;
		-ms-overflow-style: none;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

	/*-- Hide scrollbar --*/
	.ticket-types-container::-webkit-scrollbar {
		width: 6px;
	}

	.ticket-types-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.ticket-types-container::-webkit-scrollbar-thumb {
		background-color: var(--border);
		border-radius: 3px;
	}

	.ticket-types-container > div:last-child {
		margin-bottom: 0;
	}

	.fab {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 56px;
		height: 56px;
		border-radius: 999px;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
		border: none;
		z-index: var(--home-button-z-index);
	}

	.fab i {
		font-size: 18px;
	}

	@media (max-width: 1024px) {
		.col-12 {
			height: 100%;
			min-height: 0;
		}
	}
</style>
