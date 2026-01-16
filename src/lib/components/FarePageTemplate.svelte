<script lang="ts">
	import { goto } from '$app/navigation';
	import CodeMirrorEditor from './CodeMirrorEditor.svelte';
	import CustomSelect from './CustomSelect.svelte';

	let name = '';
	let version = '1';
	let currency = 'INR';
	let distanceUnit = 'km';

	let ticketTypes: { id: string; name: string }[] = [
		{ id: '1', name: 'Adult' },
		{ id: '2', name: 'Child' },
		{ id: '3', name: 'Student' }
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

	function addTicketType() {
		ticketTypes = [...ticketTypes, { id: '', name: '' }];
	}

	function removeTicketType(idx: number) {
		ticketTypes = ticketTypes.filter((_, i) => i !== idx);
	}
	//-- Navigate back to listing page --
	function gotoListingPage() {
		goto('/global-fare');
	}
		let testDistance = '';
	function calculateFare() {
		console.log('Distance:', testDistance);
		console.log('Function:', jsCode);
	}
</script>

<div class="container-fluid py-4 fare-page">
	<div class="container">
		<button class="btn back-btn" aria-label="Go back" title="Back" on:click={gotoListingPage}>
			<i class="bi bi-arrow-left back-icon"></i>
		</button>

		<!-- Main content row -->
		<div class="row g-4">
			<!-- LEFT PANEL -->
			<div class="col-lg-5">
				<div class="card fare-card h-100">
					<div class="card-body">
						<h5 class="mb-4 fw-inter-700 fare-title">Fare Structure</h5>

						<!-- Fare Name -->
						<div class="mb-4">
							<label for="name" class="form-label" style="color: var(--text-primary);"
								>Fare Name *</label
							>
							<input
								id="name"
								class="form-control"
								bind:value={name}
								placeholder="Fare Name"
								style="background: var(--bg-card); color: var(--text-primary); border-color: var(--border);"
							/>
						</div>

						<!-- Attributes -->
						<div class="mb-4">
							<h6 class="text-muted mb-3 section-title">Attributes</h6>
							<div class="row g-3">
								<div class="col-4">
									<label for="currency" class="form-label label-primary">Currency</label>
									<CustomSelect options={['INR', 'USD']} bind:value={currency} />
								</div>
								<div class="col-4">
									<label for="distanceUnit" class="form-label label-primary">Unit</label>
									<CustomSelect options={['km', 'miles']} bind:value={distanceUnit} />
								</div>
								<div class="col-4">
									<label for="version" class="form-label label-primary">Version</label>
									<input id="version" class="form-control input-card" bind:value={version} />
								</div>
							</div>
						</div>

						<!-- Ticket Types -->
						<div class="mb-4">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<h6 class="mb-0 section-title">Ticket Types</h6>
								<button
									type="button"
									class="btn btn-sm btn-outline-primary"
									on:click={addTicketType}
								>
									+ Add Type
								</button>
							</div>

							{#each ticketTypes as ticket, idx}
								<div class="row g-2 align-items-center mb-2">
									<div class="col-7">
										<input
											class="form-control input-card"
											placeholder="Ticket Type Name"
											bind:value={ticket.name}
										/>
									</div>
									<div class="col-3">
										<input
											class="form-control input-card"
											placeholder="ID"
											bind:value={ticket.id}
										/>
									</div>
									<div class="col-2 text-end">
										<button
											type="button"
											class="btn btn-sm btn-outline-danger"
											on:click={() => removeTicketType(idx)}
											aria-label="Remove Ticket Type"
										>
											<i class="bi bi-trash"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>

						<button class="btn btn-primary w-100 mt-3">Save Fare</button>
					</div>
				</div>
			</div>

			<!-- RIGHT PANEL -->
			<!-- RIGHT PANEL -->
			<div class="col-lg-7">
				<div class="card editor-card h-100 d-flex flex-column">
					<div class="card-header bg-transparent border-bottom">
						<h6 class="mb-0">Fare Calculation Function</h6>
					</div>

					<!-- EDITOR (70%) -->
					<div class="editor-wrapper">
						<CodeMirrorEditor bind:value={jsCode} theme="dark" />
					</div>

					<!-- FOOTER CONTROLS -->
					<div class="editor-footer">
						<input
							type="number"
							class="form-control input-card"
							placeholder="Distance (meters)"
							bind:value={testDistance}
						/>

						<button class="btn btn-primary" on:click={calculateFare}> Calculate </button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.fare-page {
		background: var(--bg-primary);
		min-height: 100vh;
		padding-top: 2.5rem;
		padding-bottom: 2.5rem;
	}

	.fare-card {
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		height: 100%;
		min-height: 0;
	}

	.editor-card {
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-muted);
		font-weight: 500;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		position: relative;
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 64px;
		height: calc(100vh - 6rem);
		box-sizing: border-box;
	}

	.fare-page .row {
		height: 100%;
		align-items: stretch;
	}

	.fare-page .col-lg-5,
	.fare-page .col-lg-7 {
		height: 100%;
		min-height: 0;
	}

	.back-btn {
		position: absolute;
		top: 12px;
		left: 12px;
		z-index: 20;
		padding: 0.45rem 0.6rem;
	}

	.back-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: var(--home-button-bg);
		color: var(--home-button-bg);
		background: var(--bg-card);
		text-decoration: none;
	}

	.back-icon {
		font-size: 1.2rem;
		color: var(--text-muted);
		transition: color 0.2s ease;
	}

	.back-btn:hover .back-icon {
		color: var(--home-button-bg);
	}

	.h-100 {
		height: 100%;
		min-height: 0;
	}

	.card-header {
		padding: 1rem 1.25rem;
		font-weight: 600;
	}

	.fare-title {
		color: var(--text-primary);
	}
	.label-primary {
		color: var(--text-primary);
	}
	.section-title {
		color: var(--text-primary);
	}
	.input-card {
		background: var(--bg-card);
		color: var(--text-primary);
		border-color: var(--border);
	}

	.editor-wrapper {
		flex: 0 0 70%;
		padding: 12px;
		overflow: hidden;
		min-height: 0;
	}

	.editor-wrapper > :global(*) {
		height: 100%;
		min-height: 0;
	}

	.editor-footer {
		flex: 0 0 30%;
		display: flex;
		gap: 12px;
		padding: 12px;
		border-top: 1px solid var(--border);
		align-items: center;
		min-height: 0;
	}

	.fare-card .card-body {
		overflow: auto;
		min-height: 0;
	}

	.editor-footer input {
		flex: 1;
		min-height: 42px;
	}

	.editor-footer button {
		white-space: nowrap;
	}
</style>
