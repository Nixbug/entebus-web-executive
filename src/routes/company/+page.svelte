<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { getInitialVisibleColumns, utcToIstFormat, titleCase } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import LocationMapModal from '$lib/components/company-components/LocationMapModal.svelte';
	import { createCompanyAccount, fetchCompanyAccount } from '$lib/services/company';
	import { companySchema } from '$lib/schemas';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import type { Company } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getCompanyDetailConfig } from '$lib/configs/company-detail.config';
	import { onMount } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import {
		COMPANY_TYPE_VALUE_BY_LABEL,
		COMPANY_TYPE_FILTER_OPTIONS,
		COMPANY_TYPE_LABEL_BY_VALUE,
		COMPANY_STATUS_VALUE_BY_LABEL,
		COMPANY_STATUS_FILTER_OPTIONS,
		COMPANY_STATUS_LABEL_BY_VALUE,
		type CompanyTypeEnum,
		type CompanyStatusEnum
	} from '$lib/constants';
	import { canCreateCompany, canUpdateCompany } from '$lib/utils/permissions';

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
	let hasNextPage = false;

	//-- request id to prevent stale response race conditions --
	let requestId = 0;

	let formattedCompanyData: Company[] = [];
	let totalItems = 0;
	let loading = false;

	//-- Fetch companies from API with current search, filters, and pagination --
	async function fetchCompanies() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const typeFilter =
				activeFilters.type && !String(activeFilters.type).toLowerCase().startsWith('all')
					? COMPANY_TYPE_VALUE_BY_LABEL[String(activeFilters.type)]
					: undefined;
			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? COMPANY_STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;

			const apiData = await fetchCompanyAccount({
				search: searchTerm,
				type: typeFilter,
				status: statusFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			//-- Stale response: discard and exit early but ensure loading clears in finally --
			if (currentRequestId !== requestId) return;

			formattedCompanyData = (Array.isArray(apiData) ? apiData : []).map((item: any) => ({
				id: item.id ? `COMP-${item.id}` : '',
				apiId: item.id ?? null,
				name: titleCase(item.name ?? ''),
				address: item.address ?? '',
				location: item.location ?? '',
				status: titleCase(COMPANY_STATUS_LABEL_BY_VALUE[item.status as CompanyStatusEnum] ?? ''),
				type: titleCase(COMPANY_TYPE_LABEL_BY_VALUE[item.type as CompanyTypeEnum] ?? ''),
				description: item.description ?? '',
				createdAt: utcToIstFormat(item.created_on ?? item.createdAt ?? ''),
				updatedAt: utcToIstFormat(item.updated_on ?? item.updatedAt ?? '')
			}));

			const apiTotal = (apiData as any)?.total;
			if (typeof apiTotal === 'number' && !Number.isNaN(apiTotal)) {
				totalItems = apiTotal;
				const fetchedCount = Array.isArray(apiData)
					? (currentPage - 1) * itemsPerPage + apiData.length
					: 0;
				hasNextPage = fetchedCount < apiTotal;
			} else if (Array.isArray(apiData)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + apiData.length;

				if (apiData.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchCompanies();
				}

				hasNextPage = apiData.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (e) {
			if (currentRequestId !== requestId) return;
			formattedCompanyData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch companies.');
		} finally {
			if (currentRequestId === requestId) {
				loading = false;
			}
		}
	}

	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchCompanies();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Status',
			key: 'status',
			options: COMPANY_STATUS_FILTER_OPTIONS
		},
		{
			label: 'Type',
			key: 'type',
			options: COMPANY_TYPE_FILTER_OPTIONS
		}
	];

	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchCompanies();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'address', label: 'Address' },
		{ key: 'type', label: 'Company Type', isChip: true },
		{ key: 'status', label: 'Status', isChip: true }
	];
	const optionalColumns = [
		{ key: 'createdAt', label: 'Created At' },
		{ key: 'updatedAt', label: 'Updated At' }
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
	let isSubmitting = false;
	let creationFormRef: CreationForm;
	let showLocationPicker = false;
	const companyFields = [
		{
			name: 'name',
			label: 'Company Name',
			placeholder: 'Enter company name',
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
			type: 'map-picker',
			placeholder: 'Click to pick location on map'
		},
		{
			name: 'type',
			label: 'Type',
			options: ['Other', 'Private', 'Government'],
			placeholder: 'Select type'
		},
		{
			name: 'status',
			label: 'Status',
			options: ['Under Verification', 'Verified', 'Suspended'],
			placeholder: 'Select status'
		},
		{
			name: 'description',
			label: 'Description',
			placeholder: 'Enter description'
		}
	];
	function handleAddCompany() {
		if (!canCreateCompany()) {
			toast.error('You are not authorized to create a company.');
			return;
		}
		showModal = true;
	}

	function handleFieldActivate(e: CustomEvent<{ fieldName: string }>) {
		if (e.detail.fieldName === 'location') {
			showLocationPicker = true;
		}
	}

	//-- create company --
	async function handleCreateCompanySubmit(e: CustomEvent) {
		const formData = e.detail as Record<string, string>;
		const payload = {
			name: formData.name,
			address: formData.address,
			location: formData.location,
			type:
				COMPANY_TYPE_VALUE_BY_LABEL[formData.type] !== undefined
					? COMPANY_TYPE_VALUE_BY_LABEL[formData.type]
					: COMPANY_TYPE_VALUE_BY_LABEL['Other'],
			status:
				COMPANY_STATUS_VALUE_BY_LABEL[formData.status] !== undefined
					? COMPANY_STATUS_VALUE_BY_LABEL[formData.status]
					: COMPANY_STATUS_VALUE_BY_LABEL['Under Verification'],
			description: formData.description || null
		};
		isSubmitting = true;
		try {
			const response = await createCompanyAccount(payload);
			if (response) {
				toast.success('Company created successfully.');
				showModal = false;
				fetchCompanies();
			}
		} catch (error) {
			const message = await handleApiError(error);
			toast.error(message || 'Failed to create company.');
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		fetchCompanies();
	});
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
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Company Management"
				subtitle="View and manage all companies."
				buttonLabel="Add Company"
				icon="bi-plus-lg"
				onButtonClick={handleAddCompany}
				isInitiallyEnabled={canCreateCompany()}
				disabledTooltip="You do not have permission to add companies."
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by company name, ID..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedCompanyData}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Companies"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedCompanyData as company}
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
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if formattedCompanyData.length === 0}
					<EmptyData message="No Companies found" />
				{/if}
				<FloatingAddButton
					onClick={handleAddCompany}
					isInitiallyEnabled={canCreateCompany()}
					tooltip="Add new company"
				/>
			</div>
			<CreationForm
				bind:this={creationFormRef}
				bind:open={showModal}
				fields={companyFields}
				schema={companySchema}
				title="Add New Company"
				{isSubmitting}
				titleIcon="bi bi-building-add"
				on:fieldactivate={handleFieldActivate}
				on:submit={handleCreateCompanySubmit}
				on:close={() => (showModal = false)}
			/>
			<LocationMapModal
				bind:isOpen={showLocationPicker}
				pickMode={true}
				zoom={8}
				locationName="Pick Company Location"
				on:locationConfirmed={(e) => {
					creationFormRef?.setFieldValue('location', e.detail.wkt);
					showLocationPicker = false;
				}}
			/>
			{#if totalItems > 0 || hasNextPage}
				<Pagination {totalItems} {itemsPerPage} {currentPage} onPageChange={handlePageChange} />
			{/if}
			{#if showDetail && detailConfig && selected}
				<DynamicDetailSidebar
					config={detailConfig}
					data={selected}
					sectionName="company"
					on:close={() => (showDetail = false)}
					hasUpdatePermission={canUpdateCompany()}
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
	.spinner-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.5);
		z-index: 9999;
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
