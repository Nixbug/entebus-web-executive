<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import {
		getInitialVisibleColumns,
		mapVehicleStatusToLabel,
		titleCase,
		utcToIstFormat
	} from '$lib/helpers';
	import { page } from '$app/stores';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import { companyVehicleSchema } from '$lib/schemas';
	import type { Vehicle } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getVehicleDetailConfig } from '$lib/configs/company-vehicle.config';
	import { fetchVehicleList, deleteVehicle } from '$lib/services/vehicle';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import { VEHICLE_STATUS_FILTER_OPTIONS, VEHICLE_STATUS_VALUE_BY_LABEL } from '$lib/constants';
	import { canDeleteVehicle } from '$lib/utils/permissions';

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	//-- Also refetches data when companyId changes (e.g., when coming from a different dashboard) --
	let companyId: string | null = null;
	let previousCompanyId: string | null | undefined = undefined;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	$: if (previousCompanyId === undefined) {
		previousCompanyId = companyId;
	} else if (previousCompanyId !== companyId) {
		previousCompanyId = companyId;
		currentPage = 1;
		fetchVehicles();
	}

	const canDelete = canDeleteVehicle();
	let selected: Vehicle | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Open Detail Sidebar --
	function openDetail(row: Vehicle) {
		const originalVehicle = formattedVehicleData.find((v) => v.id === row.id) || row;
		selected = originalVehicle;
		detailConfig = getVehicleDetailConfig(originalVehicle);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;

	//-- request id to prevent stale response race conditions --
	let requestId = 0;

	let formattedVehicleData: Vehicle[] = [];
	let totalItems = 0;
	let loading = false;

	//-- Fetch vehicles from API with current search, filters, and pagination --
	async function fetchVehicles() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			//-- Parse and validate companyId for API call --
			const parsedCompanyId = companyId ? Number(companyId) : undefined;
			const validCompanyId =
				typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
					? parsedCompanyId
					: undefined;

			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? VEHICLE_STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;
			const apiData = await fetchVehicleList({
				search: searchTerm,
				company_id: validCompanyId,
				status: statusFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return; //-- stale response, discard --

			const items = Array.isArray(apiData)
				? apiData
				: Array.isArray((apiData as any)?.data)
					? (apiData as any).data
					: [];

			formattedVehicleData = items.map((item: any) => ({
				id: item.id ? `VEH-${item.id}` : '',
				apiId: item.id ?? null,
				companyId: item.company_id ? String(item.company_id) : (companyId ?? ''),
				registrationNumber: item.registration_number ?? '',
				name: item.name ?? '',
				capacity: Number(item.capacity) || 0,
				status: titleCase(mapVehicleStatusToLabel(item.status)),
				manufactured_on: utcToIstFormat(item.manufactured_on ?? ''),
				insurance_upto: utcToIstFormat(item.insurance_upto ?? ''),
				fitness_upto: utcToIstFormat(item.fitness_upto ?? ''),
				pollution_upto: utcToIstFormat(item.pollution_upto ?? ''),
				road_tax_upto: utcToIstFormat(item.road_tax_upto ?? ''),
				createdAt: utcToIstFormat(item.created_on ?? item.createdAt ?? ''),
				updatedAt: utcToIstFormat(item.updated_on ?? item.updatedAt ?? '')
			}));

			const apiTotal =
				typeof apiData === 'object' && typeof (apiData as any).total === 'number'
					? (apiData as any).total
					: undefined;

			if (typeof apiTotal === 'number' && !Number.isNaN(apiTotal)) {
				totalItems = apiTotal;
				const fetchedCount = items.length ? (currentPage - 1) * itemsPerPage + items.length : 0;
				hasNextPage = fetchedCount < apiTotal;
			} else {
				const fetchedCount = (currentPage - 1) * itemsPerPage + items.length;

				if (items.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchVehicles();
				}

				hasNextPage = items.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount; //-- +1 signals next page exists --
			}
		} catch (e) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedVehicleData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch vehicles.');
		} finally {
			if (currentRequestId === requestId) {
				loading = false;
			}
		}
	}
	onMount(() => {
		fetchVehicles();
	});
	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchVehicles();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Status',
			key: 'status',
			options: VEHICLE_STATUS_FILTER_OPTIONS
		}
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchVehicles();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'registrationNumber', label: 'Registration Number' },
		{ key: 'capacity', label: 'Capacity', isChip: true },
		{ key: 'status', label: 'Status', isChip: true },
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

	//-- Delete selected vehicle --
	async function handleDeleteSelected() {
		if (!selected) return false;
		try {
			const id = Number(selected.apiId);
			if (!id || Number.isNaN(id)) {
				toast.error('Unable to determine vehicle id');
				return false;
			}

			await deleteVehicle(id);
			toast.success('Vehicle deleted successfully.');
			showDetail = false;
			selected = null;
			await fetchVehicles();
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to delete vehicle.');
			return false;
		}
	}
</script>

<!-- LAYOUT -->
<div class="main-div d-flex flex-column min-vh-100">
	{#if loading}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel="Back"
				to="/company/dashboard"
				preserveQuery={true}
			/>
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
					data={formattedVehicleData}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Vehicles"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedVehicleData as vehicle, i}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(vehicle)}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(vehicle);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(vehicle);
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
				{#if !loading && totalItems === 0}
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
			{#if totalItems > 0 || hasNextPage}
				<!-- Pagination -->
				<Pagination
					{totalItems}
					{itemsPerPage}
					{currentPage}
					hasMore={hasNextPage}
					onPageChange={handlePageChange}
				/>
			{/if}

			{#if showDetail && detailConfig && selected}
				<DynamicDetailSidebar
					config={detailConfig}
					data={selected}
					sectionName="vehicle"
					on:close={() => (showDetail = false)}
					hasDeletePermission={canDelete}
					onDelete={handleDeleteSelected}
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
