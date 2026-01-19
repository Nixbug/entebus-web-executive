<script lang="ts">
	import { goto } from '$app/navigation';
	import CodeMirrorEditor from './CodeMirrorEditor.svelte';
	import CustomSelect from '../CustomSelect.svelte';
	import DeleteConfirmationModal from '../DeleteConfirmationModal.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	export let initialData: any = null;
	const dispatch = createEventDispatcher();

	let showDeleteModal = false;
	let showOutput = false;
	let loading = false;

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

	// Test state
	let testDistance = 5;
	let output = '';
	let fareResults: {
		distance: number;
		results: { type: string; fare: number }[];
		rangeResults?: { distance: string; fares: Record<string, number> }[];
	} | null = null;

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

	// Fare calculation
	function handleRun() {
		showOutput = true;
		const logs: string[] = [];
		const consoleMock = { log: (...args: any[]) => logs.push(args.join(' ')) };

		try {
			// Validate function name
			if (!/function\s+getFare\s*\(/.test(jsCode)) {
				output = "Error: Function name must be 'getFare'";
				fareResults = null;
				return;
			}

			// Create function
			const func = new Function('console', `${jsCode}; return getFare;`);
			const getFare = func(consoleMock);

			if (typeof getFare !== 'function') {
				output = "Error: 'getFare' is not a valid function";
				fareResults = null;
				return;
			}

			// Calculate for current distance
			const results = ticketTypes.map((t) => {
				try {
					const fare = getFare(t.name, testDistance * 1000, {});
					return { type: t.name, fare };
				} catch {
					return { type: t.name, fare: -1 };
				}
			});

			// Calculate range
			const rangeResults = [];
			for (let km = 1; km <= testDistance; km++) {
				const fares: Record<string, number> = {};
				ticketTypes.forEach((t) => {
					try {
						fares[t.name] = getFare(t.name, km * 1000, {});
					} catch {
						fares[t.name] = -1;
					}
				});
				rangeResults.push({
					distance: km === 1 ? '1 km' : `${km - 1}-${km} km`,
					fares
				});
			}

			fareResults = { distance: testDistance, results, rangeResults };
			output = logs.length
				? logs.join('\n') + '\nFare calculation completed.'
				: 'Fare calculation completed.';
		} catch (error) {
			fareResults = null;
			output = `Error: ${error instanceof Error ? error.message : 'Invalid code'}`;
		}
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
	<div class="container">
		<button class="back-btn" on:click={goBack} aria-label="Back">
			<i class="bi bi-arrow-left"></i>
		</button>
		<div class="position-relative">
			<h3>Fare Template </h3>
			<p>Fare templates are used to calculate fares for different types of tickets</p>
		</div>

		<div class="row g-4 layout-row">
			<!-- Left Panel -->
			<div class="col-lg-5">
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

						<div class="mb-4">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<h6 class="mb-0">Ticket Types</h6>
								<button class="btn btn-sm btn-outline-primary" on:click={addTicket}>
									+ Add Type
								</button>
							</div>

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

			<!-- Right Panel -->
			<div class="col-lg-7">
				<div class="card">
					<div class="card-header">
						<h6 class="mb-0">Fare Calculation Function</h6>
						<div class="d-flex align-items-center gap-2">
							<label for="testDistance" class="form-label mb-0">Test Distance (km):</label>
							<input
								type="number"
								class="form-control"
								style="width: 120px;"
								min="1"
								bind:value={testDistance}
								placeholder="km"
							/>
							<button class="btn btn-primary" on:click={handleRun}> Calculate </button>
						</div>
					</div>

					<div class="editor-area">
						{#if themeLoaded}
							<CodeMirrorEditor bind:value={jsCode} theme={editorTheme} />
						{/if}
					</div>

					{#if showOutput}
						<div class="output-section">
							<div class="output-header">
								<h6 class="mb-0">Output</h6>
								<button
									class="btn btn-sm btn-outline-danger"
									on:click={() => (showOutput = false)}
									aria-label="Close"
								>
									<i class="bi bi-x-lg"></i>
								</button>
							</div>
							<div class="output-content">
								<pre class="output-text">{output || 'No output yet'}</pre>

								{#if fareResults}
									<div>
										<h6 class="mt-3 mb-2">Results for {fareResults.distance} km:</h6>
										<table class="table">
											<thead>
												<tr>
													<th style="color: var(--text-primary);">Ticket Type</th>
													<th class="text-end" style="color: var(--text-primary);">Fare</th>
												</tr>
											</thead>
											<tbody>
												{#each fareResults.results as r}
													<tr>
														<td>{r.type}</td>
														<td class="text-end">
															{#if r.fare === -1}
																<span class="error">Error</span>
															{:else}
																{r.fare} {currency}
															{/if}
														</td>
													</tr>
												{/each}
											</tbody>
										</table>

										<h6 class="mt-4 mb-2" style="color: var(--text-primary);">
											Distance Breakdown:
										</h6>
										<div class="table-scroll">
											<table class="table">
												<thead>
													<tr>
														<th style="color: var(--text-primary);">Distance</th>
														{#each ticketTypes as t}
															<th class="text-end" style="color: var(--text-primary);">{t.name}</th>
														{/each}
													</tr>
												</thead>
												<tbody>
													{#each fareResults.rangeResults as row}
														<tr>
															<td>{row.distance}</td>
															{#each ticketTypes as t}
																<td class="text-end">
																	{#if row.fares[t.name] === -1}
																		<span class="error">-</span>
																	{:else}
																		{row.fares[t.name]}
																	{/if}
																</td>
															{/each}
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
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
	.fare-page {
		background: var(--bg-primary);
		min-height: 100vh;
		padding: 2rem 1rem;
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
		overflow-y: auto;
		flex: 1;
		padding: 1.5rem;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.card-header {
		background: transparent;
		border-bottom: 1px solid var(--border);
		padding: 1rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.editor-area {
		flex: 1;
		overflow: hidden;
		padding: 0.75rem;
		min-height: 0;
	}

	.output-section {
		border-top: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		max-height: 300px;
		flex-shrink: 0;
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.output-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
	}

	.output-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		color: inherit;
	}

	.table {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: 0 0 0 2px rgba(var(--border-rgb), 0.3) !important;
	}

	.table th {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		border-bottom: 2px solid var(--border);
	}

	.table td {
		background-color: var(--bg-card);
		color: var(--text-muted);
		border: none;
		border-bottom: 1px solid var(--border);
	}
	tr:hover td {
		background-color: var(--table-hover-bg);
	}

	.table-scroll {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.output-content,
	.table-scroll table {
		margin: 0;
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

	.error {
		color: var(--danger);
	}

	h5,
	h6 {
		color: var(--text-primary);
		font-weight: 600;
	}

	.layout-row {
		height: calc(100vh - 6rem);
	}

	.col-lg-5,
	.col-lg-7 {
		height: 100%;
	}

	.invalid-feedback {
		color: var(--error-color);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
</style>
