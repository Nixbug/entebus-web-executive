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
	import type { Executive } from '$lib/type';

	//-- Data --
	const executives: Executive[] = [
		{
			id: 'EXE-001',
			initials: 'EA',
			name: 'Entebus Admin',
			designation: 'System Administrator',
			gender: 'Male',
			color: '#E65858',
			isYou: true,
			email: 'admin@entebus.com',
			phone: '+91 98765 00001',
			createdAt: 'Jan 15, 2024'
		},
		{
			id: 'EXE-002',
			initials: 'JM',
			name: 'John Mathew',
			designation: 'Executive Manager',
			gender: 'Male',
			color: '#7A58E6',
			email: 'john@entebus.com',
			phone: '+91 98765 00002',
			createdAt: 'Jan 18, 2024'
		},
		{
			id: 'EXE-003',
			initials: 'SW',
			name: 'Sarah Williams',
			designation: 'Operations Head',
			gender: 'Female',
			color: '#F27E4B',
			email: 'sarah@entebus.com',
			phone: '+91 98765 00003',
			createdAt: 'Jan 20, 2024'
		},
		{
			id: 'EXE-004',
			initials: 'RK',
			name: 'Rajesh Kumar',
			designation: 'Regional Manager',
			gender: 'Male',
			color: '#589BE6',
			email: 'rajesh@entebus.com',
			phone: '+91 98765 00004',
			createdAt: 'Jan 22, 2024'
		},
		{
			id: 'EXE-005',
			initials: 'PS',
			name: 'Priya Sharma',
			designation: 'Fleet Manager',
			gender: 'Female',
			color: '#C158E6',
			email: 'priya@entebus.com',
			phone: '+91 98765 00005',
			createdAt: 'Feb 01, 2024'
		},
		{
			id: 'EXE-001',
			initials: 'EA',
			name: 'Entebus Admin',
			designation: 'System Administrator',
			gender: 'Male',
			color: '#E65858',
			email: 'admin@entebus.com',
			phone: '+91 98765 00001',
			createdAt: 'Jan 15, 2024'
		},
		{
			id: 'EXE-002',
			initials: 'JM',
			name: 'John Mathew',
			designation: 'Executive Manager',
			gender: 'Male',
			color: '#7A58E6',
			email: 'john@entebus.com',
			phone: '+91 98765 00002',
			createdAt: 'Jan 18, 2024'
		},
		{
			id: 'EXE-003',
			initials: 'SW',
			name: 'Sarah Williams',
			designation: 'Operations Head',
			gender: 'Female',
			color: '#F27E4B',
			email: 'sarah@entebus.com',
			phone: '+91 98765 00003',
			createdAt: 'Jan 20, 2024'
		},
		{
			id: 'EXE-004',
			initials: 'RK',
			name: 'Rajesh Kumar',
			designation: 'Regional Manager',
			gender: 'Male',
			color: '#589BE6',
			email: 'rajesh@entebus.com',
			phone: '+91 98765 00004',
			createdAt: 'Jan 22, 2024'
		},
		{
			id: 'EXE-005',
			initials: 'PS',
			name: 'Priya Sharma',
			designation: 'Fleet Manager',
			gender: 'Female',
			color: '#C158E6',
			email: 'priya@entebus.com',
			phone: '+91 98765 00005',
			createdAt: 'Feb 01, 2024'
		},
		{
			id: 'EXE-002',
			initials: 'JM',
			name: 'John Mathew',
			designation: 'Executive Manager',
			gender: 'Male',
			color: '#7A58E6',
			email: 'john@entebus.com',
			phone: '+91 98765 00002',
			createdAt: 'Jan 18, 2024'
		},
		{
			id: 'EXE-002',
			initials: 'JM',
			name: 'John Mathew',
			designation: 'Executive Manager',
			gender: 'Male',
			color: '#7A58E6',
			email: 'john@entebus.com',
			phone: '+91 98765 00002',
			createdAt: 'Jan 18, 2024'
		},
		{
			id: 'EXE-003',
			initials: 'SW',
			name: 'Sarah Williams',
			designation: 'Operations Head',
			gender: 'Female',
			color: '#F27E4B',
			email: 'sarah@entebus.com',
			phone: '+91 98765 00003',
			createdAt: 'Jan 20, 2024'
		},
		{
			id: 'EXE-004',
			initials: 'RK',
			name: 'Rajesh Kumar',
			designation: 'Regional Manager',
			gender: 'Male',
			color: '#589BE6',
			email: 'rajesh@entebus.com',
			phone: '+91 98765 00004',
			createdAt: 'Jan 22, 2024'
		},
		{
			id: 'EXE-005',
			initials: 'PS',
			name: 'Priya Sharma',
			designation: 'Fleet Manager',
			gender: 'Female',
			color: '#C158E6',
			email: 'priya@entebus.com',
			phone: '+91 98765 00005',
			createdAt: 'Feb 01, 2024'
		},
		{
			id: 'EXE-001',
			initials: 'EA',
			name: 'Entebus Admin',
			designation: 'System Administrator',
			gender: 'Male',
			color: '#E65858',
			email: 'admin@entebus.com',
			phone: '+91 98765 00001',
			createdAt: 'Jan 15, 2024'
		},
		{
			id: 'EXE-002',
			initials: 'JM',
			name: 'John Mathew',
			designation: 'Executive Manager',
			gender: 'Male',
			color: '#7A58E6',
			email: 'john@entebus.com',
			phone: '+91 98765 00002',
			createdAt: 'Jan 18, 2024'
		},
		{
			id: 'EXE-003',
			initials: 'SW',
			name: 'Sarah Williams',
			designation: 'Operations Head',
			gender: 'Female',
			color: '#F27E4B',
			email: 'sarah@entebus.com',
			phone: '+91 98765 00003',
			createdAt: 'Jan 20, 2024'
		},
		{
			id: 'EXE-004',
			initials: 'RK',
			name: 'Rajesh Kumar',
			designation: 'Regional Manager',
			gender: 'Male',
			color: '#589BE6',
			email: 'rajesh@entebus.com',
			phone: '+91 98765 00004',
			createdAt: 'Jan 22, 2024'
		},
		{
			id: 'EXE-005',
			initials: 'PS',
			name: 'Priya Sharma',
			designation: 'Fleet Manager',
			gender: 'Female',
			color: '#C158E6',
			email: 'priya@entebus.com',
			phone: '+91 98765 00005',
			createdAt: 'Feb 01, 2024'
		}
	];

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

	//-- Add Executive --
	function handleAddExecutive() {
		alert('Add Executive button clicked');
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
		{ key: 'gender', label: 'Gender' }
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
	const customRender = {
		name: NameCell
	};
</script>

<!-- LAYOUT -->
<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="flex-grow-1">
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
				searchPlaceholder="Search by name or ID..."
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
								</div>
								<span
									class="status-dot position-absolute bottom-0 end-0 translate-middle rounded-circle bg-success border border-2 border-dark"
									style="width:10px;height:10px;"
								></span>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-bold text-white">{exec.name}</div>
								<div class="text-muted small">{exec.designation}</div>
								<div class="text-secondary small">{exec.id} • {exec.gender}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>

					<FloatingAddButton onClick={handleAddExecutive} tooltip="Add new executive" />
				{/each}
			</div>
			<!-- Pagination -->
			<Pagination
				totalItems={filtered.length}
				{itemsPerPage}
				{currentPage}
				onPageChange={handlePageChange}
			/>
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
	}
	main {
		padding: 5rem !important;
	}
	@media (max-width: 768px) {
		main {
			padding: 1rem !important;
		}
	}
</style>
