<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import NameCell from '$lib/components/TableNameCell.svelte';
	import { getColorFromName } from '$lib/color-palette';
	import {
		getInitialVisibleColumns,
		utcToIstFormat,
		titleCase,
		mapGenderToLabel,
		mapStatusToLabel,
		getLoggedInUserId,
		getInitials
	} from '$lib/helpers';
	import {
		GENDER_VALUE_BY_LABEL,
		GENDER_FILTER_OPTIONS,
		STATUS,
		STATUS_VALUE_BY_LABEL,
		STATUS_FILTER_OPTIONS
	} from '$lib/constants';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import { fetchExecutiveAccount } from '$lib/services/executive-account';
	import { executiveAccountSchema } from '$lib/schemas';
	import type { Executive } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getExecutiveDetailConfig } from '$lib/configs/executive-detail.config';
	import { onMount } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';

	let selected: Executive | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Open Detail Sidebar --
	function openDetail(row: Executive) {
		selected = row;
		detailConfig = getExecutiveDetailConfig(row);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;

	let formattedExecutiveData: Executive[] = [];
	let totalItems = 0;
	let loading = false;

	//-- Fetch executives from API with current search, filters, and pagination --
	async function fetchExecutives() {
		loading = true;
		try {
			const genderFilter =
				activeFilters.gender && !String(activeFilters.gender).toLowerCase().startsWith('all')
					? GENDER_VALUE_BY_LABEL[String(activeFilters.gender)]
					: undefined;
			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;

			const apiData = await fetchExecutiveAccount({
				search: searchTerm,
				gender: genderFilter,
				status: statusFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			formattedExecutiveData = apiData.map((item: any) => ({
				id: item.id ? `EXE-${item.id}` : '',
				username: item.username ?? '',
				password: '',
				name: titleCase(item.full_name ?? item.username ?? ''),
				designation: titleCase(item.designation ?? ''),
				gender: titleCase(mapGenderToLabel(item.gender)),
				status: titleCase(mapStatusToLabel(item.status)),
				email: item.email_id ?? '',
				phone: item.phone_number ?? '',
				isActive: item.status === STATUS.ACTIVE,
				isYou: item.id === getLoggedInUserId(),
				createdAt: utcToIstFormat(item.created_on ?? item.createdAt ?? '')
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
					return await fetchExecutives();
				}

				hasNextPage = apiData.length === itemsPerPage;
				totalItems = fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (e) {
			formattedExecutiveData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch executives.');
		}
		loading = false;
	}

	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchExecutives();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Gender',
			key: 'gender',
			options: GENDER_FILTER_OPTIONS
		},
		{ label: 'Status', key: 'status', options: STATUS_FILTER_OPTIONS }
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchExecutives();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'designation', label: 'Designation' },
		{ key: 'gender', label: 'Gender', isChip: true },
		{ key: 'status', label: 'Status', isChip: true }
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
	const customRender: Record<string, any> = {
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
			type: 'tel',
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
	//-- TODO: Implement proper form data processing, error handling, and success feedback for better UX. --
	function handleSubmit(_e: CustomEvent) {
		alert('Form submitted');
	}

	onMount(() => {
		fetchExecutives();
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
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedExecutiveData}
					columns={displayedColumns}
					{visibleColumns}
					{customRender}
					tableName="Executives"
					on:rowClick={(e: any) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedExecutiveData as exec}
					<div
						class="exec-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(exec)}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(exec);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(exec);
							}
						}}
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Avatar -->
							<div class="position-relative">
								<div
									class="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center"
									style="width: 48px; height: 48px; background-color: {getColorFromName(
										exec.name
									)};"
								>
									{getInitials(exec.initials, exec.name, '')}
									<span
										class="status-dot"
										class:active={exec.isActive}
										aria-label={exec.isActive ? 'Active' : 'Inactive'}
										role="status"
									></span>
								</div>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-inter-700 main-info">{exec.name}</div>
								<div class="small sub-info">{exec.designation}</div>
								<div class="small sub-info">{exec.id} • {exec.gender} • {exec.status}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary" aria-hidden="true"></i>
					</div>
				{/each}
				{#if !loading && totalItems === 0}
					<EmptyData message="No executives found" />
				{/if}

				<!-- Add Executive Button (Mobile)-->
				<FloatingAddButton onClick={handleAddExecutive} tooltip="Add new executive" />
			</div>
			<!-- Modal creation form  -->
			<CreationForm
				bind:open={showModal}
				fields={executiveFields}
				schema={executiveAccountSchema}
				title="Add New Executive"
				titleIcon="bi bi-person-plus"
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
					sectionName="executive"
					on:close={() => (showDetail = false)}
					onDelete={() => {
						if (selected) {
							//-- TODO: Implement delete logic for executive accounts (e.g., call API and update state). --
							console.log('Delete executive:', selected);
						}
					}}
					onSave={(updated: unknown) => {
						//-- TODO: Implement save logic for executive accounts (e.g., call API and update state). --
						console.log('Save executive:', updated);
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
	.spinner-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(var(--border-rgb), 0.6);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
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
	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--status-dot-inactive);
		border: 1px solid #fff;
	}

	.status-dot.active {
		background-color: var(--status-dot-active);
	}
</style>
