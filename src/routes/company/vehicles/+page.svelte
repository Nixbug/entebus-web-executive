<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { applySearchAndFilters, getInitialVisibleColumns, utcToIstFormat } from '$lib/helpers';
	import { page } from '$app/stores';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import { vehicles } from '$lib/dummy-data';
	import { companyVehicleSchema } from '$lib/schemas';
	import type { Vehicle } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getVehicleDetailConfig } from '$lib/configs/company-vehicle.config';

	let selected: Vehicle | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Vehicles scoped to current company (or all if no companyId provided) --
	$: baseVehicles = companyId ? vehicles.filter((v) => v.companyId === companyId) : vehicles;

	//-- Open Detail Sidebar --
	function openDetail(row: Vehicle) {
		// Find the original vehicle with raw ISO dates from paginated (not formattedPaginated)
		const originalVehicle = paginated.find((v) => v.id === row.id) || row;
		selected = originalVehicle;
		detailConfig = getVehicleDetailConfig(originalVehicle);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let paginated: Vehicle[] = [];
	//-- Filtered list: recomputes whenever baseVehicles, searchTerm, or activeFilters change --
	$: filtered = applySearchAndFilters(baseVehicles, searchTerm, {
		searchKeys: ['name', 'id', 'registrationNumber', 'capacity'],
		filters: activeFilters
	}) as Vehicle[];
	//-- Paginated with formatted date fields (IST) for display --
	let formattedPaginated: Vehicle[] = [];

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end);
		formattedPaginated = paginated.map(
			(v) =>
				({
					...v,
					manufactured_on: utcToIstFormat(v.manufactured_on),
					insurance_upto: utcToIstFormat(v.insurance_upto),
					fitness_upto: utcToIstFormat(v.fitness_upto),
					pollution_upto: utcToIstFormat(v.pollution_upto),
					road_tax_upto: utcToIstFormat(v.road_tax_upto)
				}) as unknown as Vehicle
		);
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
			options: ['All Status', 'ACTIVE', 'MAINTENANCE', 'SUSPENDED']
		}
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		currentPage = 1;
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'registrationNumber', label: 'Registration Number' },
		{ key: 'capacity', label: 'Capacity' },
		{ key: 'manufactured_on', label: 'Manufactured On' }
	];
	const optionalColumns = [
		{ key: 'insurance_upto', label: 'Insurance Upto' },
		{ key: 'fitness_upto', label: 'Fitness Upto' },
		{ key: 'pollution_upto', label: 'Pollution Upto' },
		{ key: 'road_tax_upto', label: 'Road Tax Upto' }
	];

	//-- Start with only default columns visible, no optional ones --
	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
	}

	//-- Add Vehicle --
	let showModal = false;
	const vehicleFormFields = [
		{
			name: 'registrationNumber',
			label: 'Registration Number',
			placeholder: 'Enter registration number',
			required: true,
			fullWidth: true
		},
		{
			name: 'name',
			label: 'Vehicle Name',
			placeholder: 'Enter vehicle name',
			required: true
		},
		{
			name: 'capacity',
			label: 'Capacity',
			type: 'number',
			placeholder: 'Enter vehicle capacity',
			required: true
		},
		{
			name: 'manufactured_on',
			label: 'Manufactured On',
			type: 'date',
			placeholder: 'Enter manufacture date',
			required: true
		},
		{
			name: 'insurance_upto',
			label: 'Insurance Upto',
			type: 'date',
			placeholder: 'Enter insurance expiry date'
		},
		{
			name: 'fitness_upto',
			label: 'Fitness Upto',
			type: 'date',
			placeholder: 'Enter fitness expiry date'
		},
		{
			name: 'pollution_upto',
			label: 'Pollution Upto',
			type: 'date',
			placeholder: 'Enter pollution expiry date'
		},
		{
			name: 'road_tax_upto',
			label: 'Road Tax Upto',
			type: 'date',
			placeholder: 'Enter road tax expiry date'
		}
	];
	function handleAddVehicle() {
		showModal = true;
	}
	//-- TODO: Implement proper form data processing, error handling, and success feedback for better UX. --
	function handleSubmit(_e: CustomEvent) {
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
			<HomeButton icon="bi bi-arrow-left" ariaLabel="Back" to="/company/dashboard" preserveQuery={true} />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Company Vehicle Management"
				subtitle="View and manage all company vehicles"
				buttonLabel="Add Vehicle"
				icon="bi-plus-lg"
				onButtonClick={handleAddVehicle}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, or registration number..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedPaginated}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Vehicles"
					on:rowClick={(e) => {
						const index = formattedPaginated.findIndex((v) => v.id === e.detail.id);
						if (index !== -1) openDetail(paginated[index]);
					}}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedPaginated as vehicle, i}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(paginated[i])}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(paginated[i]);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(paginated[i]);
							}
						}}
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Avatar -->
							<div class="position-relative">
								<div
									class="d-flex align-items-center justify-content-center rounded-circle"
									style="width: 50px; height: 50px; background-color: var(--bg-primary); color: var(--text-primary);"
								>
									<i class="bi bi-bus-front"></i>
								</div>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-inter-700 main-info">{vehicle.name}</div>
								<div class="small sub-info">{vehicle.id}</div>
								<div class="small sub-info">
									{vehicle.registrationNumber}
								</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary" aria-hidden="true"></i>
					</div>
				{/each}
				{#if paginated.length === 0}
					<EmptyData message="No vehicles found" />
				{/if}

				<!-- Add Vehicle Button (Mobile)-->
				<FloatingAddButton onClick={handleAddVehicle} tooltip="Add new vehicle" />
			</div>
			<!-- Modal creation form  -->
			<CreationForm
				bind:open={showModal}
				fields={vehicleFormFields}
				schema={companyVehicleSchema}
				title="Add New Vehicle"
				titleIcon="bi bi-plus-lg"
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
					sectionName="vehicle"
					on:close={() => (showDetail = false)}
					onDelete={() => {
						if (selected) {
							//-- TODO: Implement delete logic for vehicle accounts (e.g., call API and update state). --
							console.log('Delete vehicle:', selected);
						}
					}}
					onSave={(updated: unknown) => {
						//-- TODO: Implement save logic for vehicle accounts (e.g., call API and update state). --
						console.log('Save vehicle:', updated);
					}}
				/>
			{/if}
			<!-- Column Selector -->
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

<!-- style -->
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
	.main-info {
		color: var(--text-primary);
	}
	.sub-info {
		color: var(--text-muted);
	}
</style>
