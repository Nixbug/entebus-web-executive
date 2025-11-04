<script lang="ts">
	import Sidebar from '$lib/components/sidebar.svelte';
	import FloatingButton from '$lib/components/FloatingButton.svelte';
	import DesktopTable from '$lib/components/DesktopTable.svelte';
	import type { ColumnConfig } from '$lib/type';
	import type { Executive } from '$lib/type';

	let executives: Executive[] = [
		{
			id: 1,
			name: 'Entebus Admin',
			phone: '9876543210',
			gender: 'Male',
			email: 'admin@example',
			designation: 'Admin',
			status: 'Active'
		},
		{
			id: 2,
			name: 'Entebus Guest',
			phone: '9876501234',
			gender: 'Female',
			email: 'guest@example',
			designation: 'Guest',
			status: 'Inactive'
		},
		{
			id: 3,
			name: 'John Doe',
			phone: '9123456789',
			gender: 'Male',
			email: 'john@example.com',
			designation: 'Manager',
			status: 'Active'
		},
		{
			id: 4,
			name: 'Jane Smith',
			phone: '9988776655',
			gender: 'Other',
			email: 'jane@example.com',
			designation: 'Developer',
			status: 'Inactive'
		}
	];

	//-- Column Config --
	const columnConfigs: ColumnConfig<keyof Executive>[] = [
		{ key: 'id', label: 'ID', alwaysVisible: true, filterType: 'text', width: '100px' },
		{ key: 'name', label: 'Name', alwaysVisible: true, filterType: 'text' },
		{ key: 'designation', label: 'Designation', alwaysVisible: true, filterType: 'text' },
		{
			key: 'gender',
			label: 'Gender',
			alwaysVisible: true,
			filterType: {
				type: 'select',
				options: ['All', 'Male', 'Female', 'Transgender', 'Other'],
				default: 'All'
			}
		},
		{ key: 'email', label: 'Email', alwaysVisible: false, filterType: 'text' },
		{ key: 'phone', label: 'Phone', alwaysVisible: false, filterType: 'text' },
		{ key: 'status', label: 'Status', alwaysVisible: false, filterType: 'text' }
	];

	//-- State --
	const defaultCols = columnConfigs
		.filter((c) => c.alwaysVisible)
		.map((c) => c.key) as (keyof Executive)[];
	const optionalCols = columnConfigs
		.filter((c) => !c.alwaysVisible)
		.map((c) => c.key) as (keyof Executive)[];
	let optionalChecked: Record<keyof Executive, boolean> = optionalCols.reduce(
		(a, k) => ({ ...a, [k]: false }),
		{} as Record<keyof Executive, boolean>
	);
	let searchTerms: Partial<Record<keyof Executive, string>> = {};
	let selectFilters: Partial<Record<keyof Executive, string>> = {};

	//-- visible columns --
	$: visibleColumns = [
		...defaultCols,
		...Object.entries(optionalChecked)
			.filter(([, v]) => v)
			.map(([k]) => k as keyof Executive)
	] as (keyof Executive)[];

	//-- filtered executives --
	$: filteredExecutives = executives.filter((exec) => {
		return visibleColumns.every((col) => {
			//-- Select Filter --
			if (selectFilters[col] && selectFilters[col] !== 'All') {
				return exec[col] === selectFilters[col];
			}
			//-- Text Filter --
			const term = searchTerms[col]?.trim().toLowerCase() ?? '';
			if (!term) return true;
			return String(exec[col] ?? '')
				.toLowerCase()
				.includes(term);
		});
	});

	function handleAdd() {
		alert('Add new executive');
	}
</script>

<div class="d-flex">
	<Sidebar header="Account Management" />
	<main class="flex-grow-1 ml-auto vh-100 p-3">
		<!-- Header -->
		<div
			class="container-fluid header-desktop-only align-items-center justify-content-between p-3 d-none d-md-block d-tablet-none"
		>
			<h4 class="fw-inter-700 text-dark mb-0">Account Management</h4>
			<div class="d-flex align-items-center gap-2">
				<div class="dropdown">
					<button
						class="btn selection-button btn-outline-secondary dropdown-toggle"
						type="button"
						data-bs-toggle="dropdown">Select Columns</button
					>
					<ul class="dropdown-menu p-2">
						{#each defaultCols as col}
							<li class="form-check">
								<input class="form-check-input" type="checkbox" id="col-{col}" checked disabled />
								<label class="form-check-label" for="col-{col}"
									>{columnConfigs.find((c) => c.key === col)?.label}</label
								>
							</li>
						{/each}
						{#each optionalCols as col (col)}
							<li class="form-check">
								<input
									class="form-check-input"
									type="checkbox"
									id="col-{col}"
									bind:checked={optionalChecked[col]}
								/>
								<label class="form-check-label" for="col-{col}"
									>{columnConfigs.find((c) => c.key === col)?.label}</label
								>
							</li>
						{/each}
					</ul>
				</div>
				<button class="btn create-button-color" on:click={handleAdd}>Add Executive</button>
			</div>
		</div>

		<!-- Desktop View -->
		<div class="d-none d-md-block d-tablet-none">
			<DesktopTable
				{columnConfigs}
				data={filteredExecutives}
				{visibleColumns}
				bind:searchTerms
				bind:selectFilters
			/>
		</div>

		<!-- Mobile View -->
		<div class="d-md-none p-2 d-tablet-block pt-5 px-3">
			<!-- Search Input -->
			<div class="position-relative mb-4">
				<input
					type="text"
					class="form-control form-control-lg shadow-sm"
					placeholder="Search by name..."
					on:input={(e) => {
						const value = (e.target as HTMLInputElement).value.trim();
						searchTerms.name = value.toLowerCase();
					}}
				/>
			</div>

			<!-- Executive Cards -->
			{#each filteredExecutives as exec (exec.id)}
				<div
					class="card border-0 mb-3 overflow-hidden bg-light shadow-sm rounded-3 position-relative"
				>
					<div class="p-3 pt-5">
						<!-- Header -->
						<div class="d-flex align-items-center mb-3">
							
							<div
								class="flex-shrink-0 rounded-circle d-flex justify-content-center align-items-center me-3 text-white shadow-sm"
								style="
										width: 3rem;
										height: 3rem;
										background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
										"
							>
								<i class="bi bi-person-fill fs-4"></i>
							</div>
							<div class="flex-grow-1 d-flex justify-content-between align-items-center">
								<!-- Name & ID -->
								<div>
									<h6 class="mb-1 fw-bold text-dark">{exec.name}</h6>
									<small class="text-muted fw-medium">ID: {exec.id}</small>
								</div>
								<!-- Edit & Delete Icons-->
								<div class="d-flex gap-2">
									<button
										class="btn btn-sm btn-outline-success p-1 shadow-sm"
										title="Edit"
										style="width: 28px; height:  28px;"
									>
										<i class="bi bi-pencil-fill"></i>
									</button>
									<button
										class="btn btn-sm btn-outline-danger p-1 shadow-sm"
										title="Delete"
										style="width: 28px; height:  28px;"
									>
										<i class="bi bi-trash-fill"></i>
									</button>
								</div>
							</div>
						</div>

						<hr class="my-2" />

						<div class="row text-muted small">
							<!-- Phone -->
							<div class="col-12 d-flex align-items-center mb-2">
								<div
									class="icon-circle me-2 d-flex align-items-center justify-content-center text-success"
								>
									<i class="bi bi-telephone-fill"></i>
								</div>
								<span class="text-truncate">{exec.phone}</span>
							</div>
							<!-- Email -->
							<div class="col-12 d-flex align-items-center mb-2">
								<div
									class="icon-circle me-2 d-flex align-items-center justify-content-center text-primary"
								>
									<i class="bi bi-envelope-fill"></i>
								</div>
								<span class="text-truncate">{exec.email}</span>
							</div>
							<!-- Designation -->
							<div class="col-12 d-flex align-items-center mb-2">
								<div
									class="icon-circle me-2 d-flex align-items-center justify-content-center text-warning"
								>
									<i class="bi bi-briefcase-fill"></i>
								</div>
								<span>{exec.designation}</span>
							</div>
							<!-- Status & Gender (Badges) -->
							<div class="col-12 d-flex align-items-center justify-content-between">
								<div class="d-flex align-items-center">
									<div
										class="icon-circle me-2 d-flex align-items-center justify-content-center text-info"
									>
										<i class="bi bi-check-circle-fill"></i>
									</div>
									<span
										class="badge rounded-pill px-2 py-1"
										class:bg-success={exec.status === 'Active'}
										class:bg-danger={exec.status !== 'Active'}
									>
										{exec.status}
									</span>
								</div>

								<div class="d-flex align-items-center">
									<div
										class="icon-circle me-2 d-flex align-items-center justify-content-center text-secondary"
									>
										{#if exec.gender === 'Male'}
											<i class="bi bi-gender-male"></i>
										{:else if exec.gender === 'Female'}
											<i class="bi bi-gender-female"></i>
										{:else}
											<i class="bi bi-gender-ambiguous"></i>
										{/if}
									</div>
									<span class="text-capitalize">{exec.gender}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}

			<!-- Floating Add Button -->
			<FloatingButton onClick={handleAdd} tooltip="Add new executive" />
		</div>
	</main>
</div>

<!-- Styles -->
<style>
	main {
		background-color: #f7f9fc;
		transition: margin-left 0.3s ease;
	}
	.header-desktop-only {
		display: none !important;
	}

	@media (min-width: 1024.1px) {
		.header-desktop-only {
			display: flex !important;
		}
	}
	@media (min-width: 1025px) {
		main {
			margin-left: 250px;
		}
	}
	@media (max-width: 1024px) {
		.d-tablet-none {
			display: none !important;
		}
		.d-tablet-block {
			display: block !important;
		}
	}

	.form-check-input:checked {
		background-color: #28a745 !important;
		border-color: #28a745 !important;
	}
</style>
