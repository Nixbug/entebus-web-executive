<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import NameCell from '$lib/components/TableNameCell.svelte';
	import { getColorFromName } from '$lib/color-palette';
	import { applySearchAndFilters, getInitialVisibleColumns, utcToIstFormat } from '$lib/helpers';
	import {
		GENDER,
		GENDER_LABEL_BY_VALUE,
		GENDER_VALUE_BY_LABEL,
		GENDER_FILTER_OPTIONS,
		STATUS,
		STATUS_LABEL_BY_VALUE,
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
	import { Store } from '$lib/stores/session-store';

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

	let executiveData: Executive[] = [];
	let filteredExecutiveData: Executive[] = [];
	let totalItems = 0;
	let loading = false;
	let loggedInUser = '';
	const getLoggedInUser = () => {
		if (typeof window === 'undefined') return '';
		try {
			const local = localStorage.getItem('username');
			if (local) return String(local).trim();

			const sessionRaw = sessionStorage.getItem('username');
			if (sessionRaw) {
				try {
					const parsed = JSON.parse(sessionRaw);
					if (typeof parsed === 'string') return parsed.trim();
					if (parsed && typeof parsed === 'object') {
						if ('username' in parsed) return String((parsed as any).username).trim();
					}
				} catch (e) {
					// not JSON, fallthrough to raw value
				}
				return sessionRaw.replace(/^"|"$/g, '').trim();
			}

			const stored = Store.fetchData<any>('username');
			if (stored && typeof stored === 'string') return stored.trim();
			if (stored && typeof stored === 'object' && 'username' in stored)
				return String(stored.username).trim();

			return '';
		} catch (err) {
			return '';
		}
	};

	function mapGenderToLabel(value: number | string | undefined | null): string {
		if (value === null || value === undefined || value === '') return '';
		if (typeof value === 'number') {
			return GENDER_LABEL_BY_VALUE[value as keyof typeof GENDER_LABEL_BY_VALUE] ?? '';
		}
		if (!Number.isNaN(Number(value))) {
			const numeric = Number(value);
			return GENDER_LABEL_BY_VALUE[numeric as keyof typeof GENDER_LABEL_BY_VALUE] ?? String(value);
		}
		const normalized = String(value).trim().toLowerCase();
		const matched = Object.values(GENDER_LABEL_BY_VALUE).find(
			(v) => v.toLowerCase() === normalized
		);
		return matched ?? String(value);
	}

	function mapStatusToLabel(value: number | string | undefined | null): string {
		if (value === null || value === undefined || value === '') return '';
		if (typeof value === 'number') {
			return STATUS_LABEL_BY_VALUE[value as keyof typeof STATUS_LABEL_BY_VALUE] ?? '';
		}
		if (!Number.isNaN(Number(value))) {
			const numeric = Number(value);
			return STATUS_LABEL_BY_VALUE[numeric as keyof typeof STATUS_LABEL_BY_VALUE] ?? String(value);
		}
		const normalized = String(value).trim().toLowerCase();
		const matched = Object.values(STATUS_LABEL_BY_VALUE).find(
			(v) => v.toLowerCase() === normalized
		);
		return matched ?? String(value);
	}

	async function loadExecutives() {
		loading = true;
		try {
			console.log(
				'Fetching executives with search:',
				searchTerm,
				'filters:',
				activeFilters,
				'limit:',
				itemsPerPage,
				'offset:',
				(currentPage - 1) * itemsPerPage
			);
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

			// Map API data to Executive type
			executiveData = apiData.map((item: any) => ({
				id: item.id ? `EXE-${item.id}` : '',
				rawId: item.id,
				username: item.username ?? '',
				password: '', // Placeholder since it's not returned by the API
				name: item.full_name ?? item.username ?? '',
				initials: item.full_name
					? item.full_name
							.split(' ')
							.map((n: string) => n[0])
							.join('')
							.toUpperCase()
					: '',
				isYou:
					loggedInUser &&
					String(item.username ?? item.full_name ?? item.email_id ?? '')
						.trim()
						.toLowerCase() === String(loggedInUser).toLowerCase(),
				designation: item.designation ?? '',
				gender: mapGenderToLabel(item.gender),
				status: mapStatusToLabel(item.status),
				statusValue: item.status,
				email: item.email_id ?? '',
				phone: item.phone_number ?? '',
				isActive: item.status === STATUS.ACTIVE,
				createdAt: utcToIstFormat(item.created_on ?? item.createdAt ?? ''),
				updatedAt: utcToIstFormat(item.updated_on ?? item.updatedAt ?? '')
			}));

		// Recalculate `isYou` in case `loggedInUser` was populated after initial mapping
		if (loggedInUser) {
			const norm = String(loggedInUser).trim().toLowerCase();
			executiveData = executiveData.map((e) => ({
				...e,
				isYou:
					String(e.username ?? e.name ?? e.email ?? '')
						.trim()
						.toLowerCase() === norm
			}));
		}
			// If API returns pagination metadata, use it; otherwise estimate to keep pagination visible while data may exist.
			const apiTotal = (apiData as any).total;
			if (typeof apiTotal === 'number' && !Number.isNaN(apiTotal)) {
				totalItems = apiTotal;
			} else if (Array.isArray(apiData)) {
				if (apiData.length === itemsPerPage) {
					// At least one more page likely exists
					totalItems = currentPage * itemsPerPage + 1;
				} else {
					// last page
					totalItems = (currentPage - 1) * itemsPerPage + apiData.length;
				}
			} else {
				totalItems = 0;
			}
			console.log({
				totalItems,
				itemsPerPage,
				currentPage,
				apiDataLength: apiData.length,
				apiDataTotal: apiTotal
			});
		} catch (e) {
			executiveData = [];
			totalItems = 0;
		}
		loading = false;
	}

	$: filteredExecutiveData = applySearchAndFilters(executiveData, searchTerm, {
		searchKeys: ['id', 'name', 'designation', 'email', 'gender', 'status'],
		filters: activeFilters as Record<string, string>
	});
	$: loadExecutives();

	function handlePageChange(p: number) {
		currentPage = p;
		loadExecutives();
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
		loadExecutives();
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
		loggedInUser = getLoggedInUser();
		loadExecutives();
	});
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
					data={filteredExecutiveData}
					columns={displayedColumns}
					{visibleColumns}
					{customRender}
					tableName="Executives"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each executiveData as exec}
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
									{exec.initials}
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
				{#if totalItems === 0}
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
			{#if totalItems > 0}
				<!-- Pagination -->
				<Pagination {totalItems} {itemsPerPage} {currentPage} onPageChange={handlePageChange} />
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
