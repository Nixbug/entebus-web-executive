<script lang="ts">
	import { goto } from '$app/navigation';
	import MonacoEditor from './MonacoEditor.svelte';
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

	let jsCode = `
 function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;

  if (ticket_type === "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    return base_fare + ((distance - base_fare_distance) * rate_per_km);
}

  if (ticket_type === "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    return base_fare / 2 + ((distance - base_fare_distance) * rate_per_km);
}

  if (ticket_type === "Student") {
    if (distance <= base_fare_distance) return base_fare / 3;
    return base_fare / 3 + ((distance - base_fare_distance) * rate_per_km);
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
</script>

<div class="container-fluid py-4 fare-page">
	<button class="btn p-0 back-btn" aria-label="Go back" title="Back" on:click={gotoListingPage}>
		<i class="bi bi-arrow-left back-icon"></i>
	</button>
	<div class="row g-4">
		<!-- LEFT PANEL -->
		<div class="col-lg-5">
			<div class="card fare-card">
				<div class="card-body">
					<h5 class="mb-4 fw-semibold">Fare Structure</h5>

					<!-- Fare Name -->
					<div class="mb-4">
						<label for="name" class="form-label">Fare Name *</label>
						<input id="name" class="form-control" bind:value={name} placeholder="Fare Name" />
					</div>

					<!-- Attributes -->
					<div class="mb-4">
						<h6 class="text-muted mb-3">Attributes</h6>
						<div class="row g-3">
							<div class="col-4">
								<label for="currency" class="form-label">Currency</label>
								<CustomSelect options={['INR', 'USD']} bind:value={currency} />
							</div>
							<div class="col-4">
								<label for="distanceUnit" class="form-label">Unit</label>
								<CustomSelect options={['km', 'miles']} bind:value={distanceUnit} />
							</div>
							<div class="col-4">
								<label for="version" class="form-label">Version</label>
								<input id="version" class="form-control" bind:value={version} />
							</div>
						</div>
					</div>

					<!-- Ticket Types -->
					<div class="mb-4">
						<div class="d-flex justify-content-between align-items-center mb-2">
							<h6 class="mb-0">Ticket Types</h6>
							<button type="button" class="btn btn-sm btn-outline-primary" on:click={addTicketType}>
								+ Add Type
							</button>
						</div>

						{#each ticketTypes as ticket, idx}
							<div class="row g-2 align-items-center mb-2">
								<div class="col-7">
									<input
										class="form-control"
										placeholder="Ticket Type Name"
										bind:value={ticket.name}
									/>
								</div>
								<div class="col-3">
									<input class="form-control" placeholder="ID" bind:value={ticket.id} />
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

					<button class="btn btn-primary w-100">Save Fare</button>
				</div>
			</div>
		</div>

		<!-- RIGHT PANEL -->
		<div class="col-lg-7">
			<div class="card editor-card h-100">
				<div class="card-body p-0">
					<MonacoEditor bind:value={jsCode} language="javascript" theme="vs-dark" height="60vh" />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.back-btn {
		width: 35px;
		height: 35px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		border: 1px solid var(--border);
	}

	.back-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
		outline: rgb(27, 126, 207) solid 2px;
	}

	.back-icon {
		font-size: 1.5rem;
		color: var(--text-muted);
	}
	.back-icon:hover {
		color: rgb(27, 126, 207);
	}
	.fare-page {
		background: #f5f7fb;
	}

	.fare-card {
		border-radius: 12px;
		border: none;
	}

	.editor-card {
		border-radius: 12px;
		border: none;
		background: #1e1e1e;
	}
</style>
