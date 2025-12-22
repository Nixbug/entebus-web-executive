<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { applySearchAndFilters, getInitialVisibleColumns } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ModalForm from '$lib/components/CreationForm.svelte';
	import { companies } from '$lib/dummy-data';
	import { companySchema } from '$lib/schemas';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import type { Company } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getCompanyDetailConfig } from '$lib/configs/company-detail.config';

	//-- Open Detail Sidebar --
	let selected: Company | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	function openDetail(row: Company) {
		selected = row;
		detailConfig = getCompanyDetailConfig(row);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let filtered = [...companies];
	let paginated: Company[] = [];

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
		{
			label: 'Status',
			key: 'status',
			options: ['All Status', 'Verified', 'Validating', 'Suspended']
		},
		{
			label: 'Type',
			key: 'type',
			options: ['All Types', 'Public', 'Private']
		}
	];
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		filtered = applySearchAndFilters(companies, searchTerm, {
			searchKeys: ['name', 'ownerName', 'id', 'email', 'phone'],
			filters: activeFilters
		});

		currentPage = 1;
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'ownerName', label: 'Owner Name' },
		{ key: 'phone', label: 'Phone Number' },
		{ key: 'status', label: 'Status', isChip: true }
	];
	const optionalColumns = [
		{ key: 'type', label: 'Company Type', isChip: true },
		{ key: 'email', label: 'Email' },
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
	//-- Add Company --
	let showModal = false;
	const companyFields = [
		{
			name: 'name',
			label: 'Company Name',
			placeholder: 'Enter company name',
			required: true,
			fullWidth: true
		},
		{
			name: 'ownerName',
			label: 'Owner Name',
			placeholder: 'Enter owner name',
			required: true
		},
		{
			name: 'address',
			label: 'Address',
			placeholder: 'Enter address',
			required: true
		},
		{
			name: 'location',
			label: 'Location',
			required: true,
			placeholder: 'Enter location'
		},
		{
			name: 'type',
			required: true,
			label: 'Type',
			options: ['Private', 'Public'],
			placeholder: 'Select type'
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
			type: 'tel',
			placeholder: '+91 98765 43210'
		}
	];
	function handleAddCompany() {
		showModal = true;
	}
	//-- TODO: Implement proper form data processing, error handling, and success feedback for better UX. --
	function handleSubmit(e: CustomEvent) {
		alert('Form submitted');
	}
</script>

<!-- LAYOUT -->
<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Company Management"
				subtitle="View and manage all companies."
				buttonLabel="Add Company"
				icon="bi-plus-lg"
				onButtonClick={handleAddCompany}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by company name, ID, owner name, or phone..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={paginated}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Companies"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as company}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(company)}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(company);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(company);
							}
						}}
					>
						<div class="d-flex align-items-center gap-3">
							<!-- Company Icon -->
							<div
								class="company-icon d-flex align-items-center justify-content-center rounded-circle"
								style="width: 50px; height: 50px; background-color: var(--bg-primary); color: var(--text-primary);"
							>
								<i class="bi bi-building-fill"></i>
							</div>

							<!-- Info -->
							<div style="color: var(--text-primary);">
								<div class="fw-inter-700">{company.name}</div>
								<div class="small">{company.id}</div>
								<div class="small">{company.ownerName}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if paginated.length === 0}
					<EmptyData message="No Companies found" />
				{/if}
				<FloatingAddButton onClick={handleAddCompany} tooltip="Add new company" />
			</div>
			<ModalForm
				bind:open={showModal}
				fields={companyFields}
				schema={companySchema}
				title="Add New Company"
				titleIcon="bi bi-building-add"
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
			{#if showDetail && detailConfig && selected}
				<DynamicDetailSidebar
					config={detailConfig}
					data={selected}
					on:close={() => (showDetail = false)}
					onDelete={() => {
						if (selected) {
							//-- TODO: Implement delete logic for companies (e.g., call API and update state). --
							console.log('Delete company:', selected);
						}
					}}
					onSave={(updated: unknown) => {
						//-- TODO: Implement save logic for companies (e.g., call API and update state). --
						console.log('Save company:', updated);
					}}
				/>
			{/if}
			<div class="mt-3" style="position: fixed; bottom: 1rem; right: 1rem;">
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
	@media (max-width: 768px) {
		main {
			padding: 2rem;
		}
	}
	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
</style>
