<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import NameCell from '$lib/components/TableNameCell.svelte';
	import { applySearchAndFilters, getInitialVisibleColumns } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ModalForm from '$lib/components/CreationForm.svelte';
	import { executives } from '$lib/dummy-data';
	import { executiveAccountSchema } from '$lib/schemas';

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let filtered = [...executives];
	let paginated: any = [];

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end);
	}

	function handlePageChange(p: number) {
		currentPage = p;
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters = {};
	const filters = [
		{ label: 'Gender', key: 'gender', options: ['All Genders', 'Male', 'Female', 'Transgender'] },
		{ label: 'Status', key: 'status', options: ['All Status', 'Active', 'Inactive'] }
	];
	//-- Handle search/filter updates --
	function handleUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		filtered = applySearchAndFilters(executives, searchTerm, {
			searchKeys: ['name', 'id'],
			filters: activeFilters
		});
		currentPage = 1; // reset when searching
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'designation', label: 'Designation' },
		{ key: 'gender', label: 'Gender', isChip: true }
	];
	const optionalColumns = [
		{ key: 'email', label: 'Email' },
		{ key: 'phone', label: 'Phone Number' },
		{ key: 'createdAt', label: 'Created At' }
	];

	//-- Start with only default columns visible, no optional ones --
	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
	}

	//-- Custom Renderers --
	const customRender: any = {
		name: NameCell
	};

	//-- Add Executive --
	let showModal = false;
	const executiveFields = [
		{
			name: 'fullName',
			label: 'Full Name',
			placeholder: 'Enter full name',
			required: true,
			fullWidth: true
		},
		{
			name: 'username',
			label: 'Username',
			placeholder: 'Enter username',
			required: true
		},
		{
			name: 'password',
			label: 'Password',
			type: 'password',
			placeholder: 'Enter password',
			required: true
		},
		{
			name: 'gender',
			required: true,
			label: 'Gender',
			options: ['Male', 'Female', 'Transgender', 'Other'],
			placeholder: 'Select gender'
		},
		{
			name: 'email',
			label: 'Email Address',
			type: 'email',
			placeholder: 'name@entebus.com'
		},
		{
			name: 'phone',
			label: 'Phone Number',
			type: 'number',
			placeholder: '+91 98765 43210'
		},
		{
			name: 'designation',
			label: 'Designation',
			placeholder: 'e.g., Operations Manager'
		}
	];
	function handleAddExecutive() {
		showModal = true;
	}
	function handleSubmit(e: CustomEvent) {
		console.log('Form submitted:', e.detail);
	}
</script>

<!-- LAYOUT -->
<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-4">
			<!-- HOME BUTTON -->
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Account Management"
				subtitle="View and manage all executive accounts"
				buttonLabel="Add Executive"
				icon="bi-plus-lg"
				onButtonClick={handleAddExecutive}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, designation, or email..."
				{filters}
				on:update={handleUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable data={paginated} columns={displayedColumns} {visibleColumns} {customRender} />
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as exec}
					<div
						class="exec-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Avatar -->
							<div class="position-relative">
								<div
									class="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center"
									style="width: 48px; height: 48px; background-color: {exec.color};"
								>
									{exec.initials}
									<span
										class="status-dot"
										class:active={exec.isActive}
										aria-label={exec.isActive ? 'Online' : 'Offline'}
										title={exec.isActive ? 'Online' : 'Offline'}
									></span>
								</div>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-inter-700 main-info">{exec.name}</div>
								<div class=" small sub-info">{exec.designation}</div>
								<div class="small sub-info">{exec.id} • {exec.gender}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if paginated.length === 0}
					<div
						class=" card d-flex flex-column align-items-center justify-content-center py-5 gap-2"
						style="background-color: var(--bg-card);"
					>
						<div
							class="d-flex align-items-center justify-content-center rounded-circle"
							style="width:70px; height:70px; background:rgba(255,255,255,0.05);"
						>
							<i class="bi bi-search fs-2" style="color:var(--text-muted);"></i>
						</div>

						<h5 class="m-0 fw-inter-700" style="color:var(--text-muted);">No data found</h5>
						<p class="m-0 small" style="color:var(--text-muted);">
							Try adjusting your search or filters
						</p>
					</div>
				{/if}
				<FloatingAddButton onClick={handleAddExecutive} tooltip="Add new executive" />
			</div>
			<ModalForm
				bind:open={showModal}
				fields={executiveFields}
				schema={executiveAccountSchema}
				title="Add New Executive"
				titleIcon="bi bi-person-plus"
				submitText="Add Executive"
				on:submit={handleSubmit}
				on:close={() => (showModal = false)}
			/>
			{#if paginated.length > 0}
				<!-- Pagination -->
				<Pagination
					totalItems={filtered.length}
					{itemsPerPage}
					{currentPage}
					onPageChange={handlePageChange}
				/>
			{/if}
			<div class="float-end mt-3" style="position: fixed; bottom: 1rem; right: 1rem;">
				<ColumnSelector
					{defaultColumns}
					{optionalColumns}
					{visibleColumns}
					onChange={handleColumnChange}
				/>
			</div>
		</main>
	</div>
</div>

<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}
	main {
		padding: 2rem !important;
	}
	@media (max-width: 768px) {
		main {
			padding: 1rem !important;
		}
	}
	.main-info {
		color: var(--text-primary);
	}
	.sub-info {
		color: var(--text-muted);
	}
	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: #94a3b8;
		border: 1px solid #fff;
	}

	.status-dot.active {
		background-color: #4ade80;
	}
</style>
