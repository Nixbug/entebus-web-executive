<script lang="ts">
	import Sidebar from '$lib/components/sidebar.svelte';
	import type { Executive } from '$lib/schema';
	import FloatingButton from '$lib/components/FloatingButton.svelte';

	let executivesData: Executive[] = [
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
			gender: 'Female',
			email: 'jane@example.com',
			designation: 'Developer',
			status: 'Inactive'
		}
	];

	//-- Column visibility --
	const defaultColumns = ['id', 'name', 'designation', 'gender'] as const;
	type OptionalColumn = 'email' | 'phone' | 'status';
	type Column = (typeof defaultColumns)[number] | OptionalColumn;

	let optionalChecked: Record<OptionalColumn, boolean> = {
		email: false,
		phone: false,
		status: false
	};
	$: visibleColumns = [
		...defaultColumns,
		...(Object.entries(optionalChecked)
			.filter(([, v]) => v)
			.map(([k]) => k) as OptionalColumn[])
	] as Column[];

	//-- column search state --
	let searchTerms: Record<Column, string> = {
		id: '',
		name: '',
		phone: '',
		gender: '',
		email: '',
		designation: '',
		status: ''
	};

	//-- search terms for dynamic columns --
	$: visibleColumns.forEach((col) => {
		if (!(col in searchTerms)) {
			searchTerms[col] = '';
		}
	});

	//-- Gender filter --
	let genderFilter: string = 'All';

	function setGender(filter: string) {
		genderFilter = filter;
	}

	//-- Filtering Logic --
	$: filteredExecutives = executivesData.filter((exec) => {
		//-- Check each visible column --
		return visibleColumns.every((col) => {
			if (col === 'gender') {
				return genderFilter === 'All' || exec.gender === genderFilter;
			}
			const searchValue = searchTerms[col]?.trim().toLowerCase() || '';
			if (!searchValue) return true;
			const cellValue = (exec as any)[col];
			return cellValue?.toString().toLowerCase().includes(searchValue);
		});
	});

	function handleAdd() {
		alert('Add new executive');
	}
</script>

<!-- Layout -->
<div class="d-flex">
	<Sidebar />

	<main class="flex-grow-1 ml-auto vh-100 p-3">
		<!-- Header -->
		<div class="container-fluid header-desktop-only align-items-center justify-content-between p-3">
			<h4 class="fw-inter-700 text-dark mb-0">Account Management</h4>
			<div class="d-flex align-items-center gap-2">
				<div class="dropdown">
					<button
						class="btn selection-button btn-outline-secondary dropdown-toggle"
						type="button"
						data-bs-toggle="dropdown"
						aria-expanded="false"
					>
						Select Columns
					</button>
					<ul class="dropdown-menu p-2">
						{#each defaultColumns as col}
							<li class="form-check">
								<input class="form-check-input" type="checkbox" id="col-{col}" checked disabled />
								<label class="form-check-label" for="col-{col}">
									{col.charAt(0).toUpperCase() + col.slice(1)}
								</label>
							</li>
						{/each}
						{#each Object.keys(optionalChecked) as opt (opt)}
							<li class="form-check">
								<input
									class="form-check-input"
									type="checkbox"
									id="col-{opt}"
									bind:checked={optionalChecked[opt as OptionalColumn]}
								/>
								<label class="form-check-label" for="col-{opt}">
									{opt.charAt(0).toUpperCase() + opt.slice(1)}
								</label>
							</li>
						{/each}
					</ul>
				</div>
				<button class="btn create-button" on:click={handleAdd}>Add Executive</button>
			</div>
		</div>
		<!-- DESKTOP TABLE -->
		<div class="card d-none d-md-block d-tablet-none p-3 shadow-sm border-0">
			<table class="table table-hover align-middle mb-0 custom-table">
				<thead>
					<!-- Header Row -->
					<tr>
						{#each visibleColumns as col}
							<th class="text-center text-secondary fw-inter-800">
								{col.charAt(0).toUpperCase() + col.slice(1)}
							</th>
						{/each}
					</tr>

					<!-- Search / Filter Row -->
					<tr class="search-row">
						{#each visibleColumns as col}
							<td class="text-center">
								{#if col === 'gender'}
									<div class="dropdown border rounded custom-select-dropdown">
										<button
											class="btn btn-light dropdown-toggle w-100"
											type="button"
											data-bs-toggle="dropdown"
											aria-expanded="false"
										>
											{genderFilter}
										</button>
										<ul class="dropdown-menu p-2 w-100">
											{#each ['All', 'Male', 'Female', 'Transgender', 'Other'] as option}
												<li>
													<button
														class="dropdown-item"
														class:active={genderFilter === option}
														type="button"
														on:click={() => setGender(option)}
													>
														{option}
													</button>
												</li>
											{/each}
										</ul>
									</div>
								{:else}
									<input
										class="form-control p-2 form-control-sm text-center"
										placeholder="Search"
										bind:value={searchTerms[col]}
									/>
								{/if}
							</td>
						{/each}
					</tr>
				</thead>

				<tbody>
					{#each filteredExecutives as exec (exec.id)}
						<tr>
							{#each visibleColumns as col}
								<td class="text-center">{(exec as any)[col] ?? '-'}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- MOBILE VIEW -->
		<div class="d-md-none d-tablet-block pt-5">
			<!-- Mobile search (only name) -->
			<input
				type="text"
				class="form-control mb-3"
				placeholder="Search by name..."
				on:input={(e) => {
					const value = (e.target as HTMLInputElement).value.trim();
					searchTerms.name = value.toLowerCase();
				}}
			/>

			{#each filteredExecutives as exec (exec.id)}
				<div class="card border-0 mb-3 p-3 shadow-sm">
					<div class="d-flex align-items-center">
						<div
							class="icon person-icon rounded-circle d-flex justify-content-center align-items-center me-3"
						>
							<i class="bi bi-person fs-1 text-success"></i>
						</div>
						<div>
							<h6 class="mb-1 fw-inter-700">{exec.name}</h6>
							<small class="text-muted">ID: {exec.id}</small>
						</div>
					</div>

					<hr class="my-2" />

					<div class="d-flex justify-content-between text-muted small">
						<div><i class="bi bi-telephone me-1"></i>{exec.phone}</div>
						<div>{exec.gender}<i class="bi bi-gender-ambiguous me-1"></i></div>
					</div>

					<div class="mt-1 text-muted small"><i class="bi bi-envelope me-1"></i>{exec.email}</div>

					<div class="mt-1 text-muted small">
						<i class="bi bi-briefcase me-1"></i>{exec.designation}
					</div>
					<div class="mt-1 text-muted small">
						<i class="bi bi-check-circle me-1"></i>{exec.status}
					</div>
				</div>
			{/each}

			<FloatingButton onClick={handleAdd} tooltip="Add new item" />
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
	.custom-table td,
	.custom-table th {
		padding: 1rem !important;
		vertical-align: middle;
	}

	/* Make the header (first row) a subtle light green to distinguish it */
	.custom-table thead tr:first-child th {
		background-color: #e8f5e9 !important; /* light green */
		border-bottom: 2px solid #b1becc !important;
		font-weight: 700 !important;
	}

	/* Highlight the first data row in tbody with the same light green */
	.custom-table tbody tr:first-child td {
		background-color: #9dd84b !important;
	}

	.form-check-input:checked {
		background-color: #28a745 !important;
		border-color: #28a745 !important;
	}

	.custom-select-dropdown .dropdown-item.active {
		background-color: #9dd84b !important;
		color: #fff !important;
		border-radius: 8px;
	}
	.custom-select-dropdown .dropdown-item:hover {
		background-color: #b8e986;
		color: #000;
		border-radius: 8px;
	}

	.person-icon {
		width: 3rem;
		height: 3rem;
		background-color: #afd2b2;
	}
</style>
