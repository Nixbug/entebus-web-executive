<script lang="ts">
	import { goto } from '$app/navigation';
	import CodeMirrorEditor from './CodeMirrorEditor.svelte';
	import CustomSelect from '../CustomSelect.svelte';
	import DeleteConfirmationModal from '../DeleteConfirmationModal.svelte';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	export let initialData: any = null;
	const dispatch = createEventDispatcher();

	let showDeleteModal = false;
	let showOutput = false;
	let loading = false;

	// Responsive/mobile state
	let isMobile = false;
	let activeView: 'form' | 'editor' = 'form';
	let editorHeight = '400px';
	let containerEl: HTMLDivElement | null = null;

	// Form state
	let name = '';
	let version = 1;
	let currency = 'INR';
	let distanceUnit = 'm';

	let ticketTypes: { id: number; name: string }[] = [
		{ id: 1, name: 'Adult' },
		{ id: 2, name: 'Child' },
		{ id: 3, name: 'Student' }
	];

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


	// Errors
	let ticketErrors: string[] = [];
	// Editor theme (read from localStorage on mount)
	let editorTheme: 'dark' | 'light' = 'dark';
	let themeLoaded = false;

	// Initialize
	onMount(() => {
		if (browser) {
			const saved = localStorage.getItem('theme');
			editorTheme = saved === 'dark' ? 'dark' : 'light';
			themeLoaded = true;
		}

		if (!initialData) return;

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
	});


function updateEditorHeight() {
	// Compute header/footer offsets inside this page to get a stable editor height
	if (!containerEl) {
		editorHeight = 'calc(100vh - 220px)';
		return;
	}

	const header = containerEl.querySelector('.position-relative');
	const headerHeight = header ? Math.round((header as HTMLElement).getBoundingClientRect().height) : 120;
	const topOffset = Math.round(containerEl.getBoundingClientRect().top);
	const extra = 40; // spacing/padding compensation
	const totalOffset = headerHeight + topOffset + extra;
	editorHeight = `calc(100vh - ${totalOffset}px)`;
}

function handleResize() {
	isMobile = window.innerWidth <= 1024;
	// keep default view as form on mobile
	if (isMobile) activeView = activeView || 'form';
	// desktop: both panels visible, keep form as default activeView
	if (!isMobile) activeView = 'form';
	updateEditorHeight();
}

onMount(() => {
	if (typeof window !== 'undefined') {
		handleResize();
		window.addEventListener('resize', handleResize);
	}
});

onDestroy(() => {
	if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize);
});

	// Ticket types
	function addTicket() {
		const newId = Math.max(0, ...ticketTypes.map((t) => t.id)) + 1;
		ticketTypes = [...ticketTypes, { id: newId, name: '' }];
		ticketErrors = [...ticketErrors, ''];
	}

	function removeTicket(idx: number) {
		ticketTypes = ticketTypes.filter((_, i) => i !== idx);
		ticketErrors = ticketErrors.filter((_, i) => i !== idx);
	}
	function validateTickets() {
		const errors: any = ticketTypes.map((t) => (!t.name.trim() ? 'Name required' : ''));
		if (ticketTypes.length === 0) errors[0] = 'At least one ticket type required';
		return errors;
	}

	// Form submission
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
			} else {
				dispatch('create', data);
			}
			console.log('Fare saved (dispatched)', data);
		} finally {
			loading = false;
		}
	}

	// Delete modal
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

	// Navigation
	function goBack() {
		goto('/global-fare');
	}
</script>

<div class="fare-page">
	<div class="container" bind:this={containerEl}>
		<button class="back-btn" on:click={goBack} aria-label="Back">
			<i class="bi bi-arrow-left"></i>
		</button>
		<div class="position-relative">
			<h3>Fare Template</h3>
			<p>Fare templates are used to calculate fares for different types of tickets</p>
		</div>

		<div class="row g-4 layout-row">
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
							<div class="row g-3">
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
												class="form-control {ticketErrors[idx] ? 'is-invalid' : ''}"
												bind:value={ticket.name}
												on:blur={() => (ticketErrors = validateTickets())}
												placeholder="Type name"
											/>
											{#if ticketErrors[idx]}
												<div class="invalid-feedback">{ticketErrors[idx]}</div>
											{/if}
										</div>
										<div class="col-3">
											<input
												class="form-control"
												type="number"
												min="1"
												bind:value={ticket.id}
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
							<div class=" d-flex gap-2 space-between mt-3">
								<button class="btn btn-danger w-100" on:click={openDeleteModal} disabled={loading}>
									Delete Fare
								</button>
								<button class="btn btn-primary w-100" on:click={handleSubmit} disabled={loading}
									>Update</button
								>
							</div>
						{:else}
							<div class="mt-4">
								<button class="btn btn-primary w-100" on:click={handleSubmit} disabled={loading}>
									{loading ? 'Saving...' : 'Save Fare'}
								</button>
							</div>
						{/if}
					</div>
				</div>
				</div>
			{/if}

			<!-- Right Panel / Editor (only mounted when visible) -->
			{#if !isMobile || activeView === 'editor'}
				<div class={isMobile ? 'col-12' : 'col-lg-7'}>
					<CodeMirrorEditor
						bind:value={jsCode}
						theme={editorTheme}
						{ticketTypes}
						{currency}
						height={editorHeight}
					/>
				</div>
			{/if}
		</div>

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
	h3, p {
		color: var(--text-primary);
	}
	.fare-page {
		background: var(--bg-primary);
		min-height: 100vh;
		padding:4rem 1rem;
		/* Prevent horizontal overflow from wide children */
		overflow-x: hidden;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		position: relative;
		padding-top: 3rem;
	}

	.back-btn {
		position: absolute;
		top: 0;
		left: 0;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-primary);
		transition: all 0.2s;
	}

	.back-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
		outline: var(--home-button-bg) solid 2px;
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

	.form-control {
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-primary);
	}

	.form-control:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 0.2rem rgba(var(--primary-rgb), 0.25);
	}

	h5,
	h6 {
		color: var(--text-primary);
		font-weight: 600;
	}

	.layout-row {
		height: auto;
		max-height: calc(100vh - 6rem);
		overflow: auto;
	}

	.col-lg-5,
	.col-lg-7 {
		height: 100%;
		max-width: 100%;
		min-height: 0;
	}

	.invalid-feedback {
		color: var(--error-color);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	/* Ticket types scrollable section */
	.ticket-types-section {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.ticket-types-container {
		flex: 1;
		overflow-y: auto;
		max-height: 300px;
		padding-right: 0.5rem;
		margin-right: -0.5rem;
		-ms-overflow-style: none;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

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

	/* Floating action button for mobile view */
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
		box-shadow: 0 8px 20px rgba(0,0,0,0.16);
		border: none;
		z-index: var(--home-button-z-index, 500);
	}

	.fab i {
		font-size: 18px;
	}

	/* Ensure editor/output can be scrolled into view on narrow screens */
@media (max-width: 1024px) {
	.layout-row {
		height: auto;
		max-height: calc(100vh - 6rem);
		overflow: auto;
	}

	/* Force mobile column to stretch so child .card height:100% works */
	.col-12 {
		height: 100%;
		min-height: 0;
	}
}
</style>