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
		mapGenderToLabel,
		mapStatusToLabel,
		mapOperatorTypeToLabel,
		titleCase,
		utcToIstFormat
	} from '$lib/helpers';
	import { page } from '$app/stores';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import { operatorAccountSchema } from '$lib/schemas';
	import type { Operator } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getOperatorDetailConfig } from '$lib/configs/company-operator.config';
	import { fetchOperatorAccount } from '$lib/services/operator-account';
	import { fetchOperatorRoleMap } from '$lib/services/operator-role-map';
	import { fetchOperatorRoleList } from '$lib/services/operator-role';
	import {
		GENDER_VALUE_BY_LABEL,
		OPERATOR_TYPE_VALUE_BY_LABEL,
		STATUS_VALUE_BY_LABEL
	} from '$lib/constants';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import { canUpdateCompanyOperator } from '$lib/utils/permissions';

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
		fetchOperators();
	}

	let selected: Operator | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Load available roles for the dropdown --
	async function loadOperatorRoleOptions(
		q?: string,
		limit: number = 10,
		offset: number = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchOperatorRoleList({ search: q, limit, offset });
			if (!Array.isArray(result)) return [];

			return result
				.map((role: any) => ({
					id: Number(role.id || role.apiId),
					name: String(role.name)
				}))
				.slice(0, limit);
		} catch (err) {
			console.error('Failed to load roles:', err);
			return [];
		}
	}

	//-- Open Detail Sidebar --
	let detailRequestId = 0;
	async function openDetail(row: Operator) {
		const currentDetailRequestId = ++detailRequestId;
		selected = row;
		let rolesDisplay = '';
		let roleId = '';
		let roleMapId: number | null = null;

		//-- Fetch and assign roles for the operator --
		if (row.apiId) {
			try {
				//-- Get role mappings for this operator --
				const roleMap = await fetchOperatorRoleMap(row.apiId);
				if (currentDetailRequestId !== detailRequestId) return; //-- stale response, discard --
				if (roleMap && roleMap.length > 0) {
					//-- Single-role model: use only the first mapping --
					const firstRoleMap = roleMap[0];
					roleMapId = firstRoleMap.id || null;

					if (firstRoleMap.role_id != null) {
						roleId = String(firstRoleMap.role_id);

						//-- Fetch role name for the assigned role --
						const roleData = await fetchOperatorRoleList({ id: firstRoleMap.role_id });
						if (currentDetailRequestId !== detailRequestId) return; //-- stale response, discard --
						const roleName =
							Array.isArray(roleData) && roleData.length > 0
								? (roleData[0] as any).name || 'Unknown'
								: 'Unknown';

						rolesDisplay = roleName;
					}
				}
			} catch (err) {
				if (currentDetailRequestId !== detailRequestId) return; //-- stale error, discard --
				console.error('Failed to fetch operator roles:', err);
				rolesDisplay = 'Failed to load roles';
			}
		}

		//-- Build a non-null Operator object from the row and role data --
		const selectedWithRoles: Operator = {
			...row,
			rolesDisplay: rolesDisplay || 'No roles assigned',
			roleId: roleId,
			roleMapId: roleMapId
		};

		//-- If the request became stale while awaiting, abort applying results --
		if (currentDetailRequestId !== detailRequestId) return;

		// assign to `selected` for UI binding
		selected = selectedWithRoles;

		//-- Generate detail config after roles are loaded --
		detailConfig = getOperatorDetailConfig(
			selectedWithRoles,
			loadOperatorRoleOptions,
			canUpdateCompanyOperator()
		);

		//-- Show detail sidebar only after config and roles are ready --
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;

	//-- request id to prevent stale response race conditions --
	let requestId = 0;

	let formattedOperatorData: Operator[] = [];
	let totalItems = 0;
	let loading = false;

	function formatPhone(phone: string | null | undefined, asDisplay = false): string {
		if (!phone) return '';
		const digits = String(phone).replace(/\D/g, '');
		const normalized = digits.length > 10 ? digits.slice(-10) : digits;
		if (!normalized) return '';
		return asDisplay ? `+91 ${normalized}` : normalized;
	}

	//-- Fetch operators from API with current search, filters, and pagination --
	async function fetchOperators() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const genderFilter =
				activeFilters.gender && !String(activeFilters.gender).toLowerCase().startsWith('all')
					? GENDER_VALUE_BY_LABEL[String(activeFilters.gender)]
					: undefined;
			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;
			const typeFilter =
				activeFilters.type && !String(activeFilters.type).toLowerCase().startsWith('all')
					? OPERATOR_TYPE_VALUE_BY_LABEL[String(activeFilters.type)]
					: undefined;

			// validate companyId from query params -- avoid passing NaN to the API
			const parsedCompanyId = companyId ? Number(companyId) : undefined;
			const validCompanyId =
				typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
					? parsedCompanyId
					: undefined;

			const apiData = await fetchOperatorAccount({
				search: searchTerm,
				company_id: validCompanyId,
				gender: genderFilter,
				status: statusFilter,
				type: typeFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return; //-- stale response, discard --

			const items = Array.isArray(apiData)
				? apiData
				: Array.isArray((apiData as any)?.data)
					? (apiData as any).data
					: [];

			formattedOperatorData = items.map((item: any) => ({
				id: item.id ? `OPR-${item.id}` : '',
				apiId: item.id ?? null,
				companyId: item.company_id ? `COMP-${item.company_id}` : '',
				username: item.username ?? '',
				password: '',
				name: titleCase(item.full_name ?? item.username ?? ''),
				gender: titleCase(mapGenderToLabel(item.gender)),
				type: mapOperatorTypeToLabel(item.type),
				status: titleCase(mapStatusToLabel(item.status)),
				isActive: String(mapStatusToLabel(item.status)).toLowerCase() === 'active',
				email: item.email_id ?? '',
				phone: formatPhone(item.phone_number, true),
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
					return await fetchOperators();
				}

				hasNextPage = items.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount; //-- +1 signals next page exists --
			}
		} catch (e) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedOperatorData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch operators.');
		} finally {
			if (currentRequestId === requestId) {
				loading = false;
			}
		}
	}
	onMount(() => {
		fetchOperators();
	});
	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchOperators();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Gender',
			key: 'gender',
			options: ['All Genders', 'Male', 'Female', 'Transgender', 'Other']
		},
		{
			label: 'Type',
			key: 'type',
			options: ['All Types', 'Normal', 'Owner', 'Manager', 'HR', 'Legal', 'Admin', 'Bot']
		},
		{ label: 'Status', key: 'status', options: ['All Status', 'Active', 'Suspended'] }
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchOperators();
	}
	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'phone', label: 'Phone Number' },
		{ key: 'gender', label: 'Gender', isChip: true }
	];
	const optionalColumns = [
		{ key: 'type', label: 'Type', isChip: true },
		{ key: 'status', label: 'Status', isChip: true },
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

	//-- Custom Renderers --
	const customRender: Record<string, any> = {
		name: NameCell
	};

	//-- Add Operator --
	let showModal = false;
	const operatorFields = [
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
		}
	];
	function handleAddOperator() {
		showModal = true;
	}
	//-- TODO: Implement proper form data processing, error handling, and success feedback for better UX. --
	function handleSubmit(_e: CustomEvent) {
		alert('Form submitted');
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
				title="Operator Account Management"
				subtitle="View and manage all operator accounts"
				buttonLabel="Add Operator"
				icon="bi-plus-lg"
				onButtonClick={handleAddOperator}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, or email..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedOperatorData}
					columns={displayedColumns}
					{visibleColumns}
					{customRender}
					tableName="Operators"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedOperatorData as oper}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(oper)}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(oper);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(oper);
							}
						}}
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Avatar -->
							<div class="position-relative">
								<div
									class="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center"
									style="width: 48px; height: 48px; background-color: {getColorFromName(
										oper.name
									)};"
								>
									{oper.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.toUpperCase()}
									<span
										class="status-dot"
										class:active={oper.isActive}
										aria-label={oper.isActive ? 'Active' : 'Inactive'}
										role="status"
									></span>
								</div>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-inter-700 main-info">{oper.name}</div>
								<div class="small sub-info">{oper.id} • {oper.gender}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary" aria-hidden="true"></i>
					</div>
				{/each}
				{#if !loading && totalItems === 0}
					<EmptyData message="No operators found" />
				{/if}

				<!-- Add Operator Button (Mobile)-->
				<FloatingAddButton onClick={handleAddOperator} tooltip="Add new operator" />
			</div>
			<!-- Modal creation form  -->
			<CreationForm
				bind:open={showModal}
				fields={operatorFields}
				schema={operatorAccountSchema}
				title="Add New Operator Account"
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
					sectionName="operators"
					on:close={() => (showDetail = false)}
					onDelete={() => {
						if (selected) {
							//-- TODO: Implement delete logic for operator accounts (e.g., call API and update state). --
							console.log('Delete operator:', selected);
						}
					}}
					onSave={(updated: unknown) => {
						//-- TODO: Implement save logic for operator accounts (e.g., call API and update state). --
						console.log('Save operator:', updated);
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
