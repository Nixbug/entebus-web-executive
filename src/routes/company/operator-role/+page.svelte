<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { applySearchAndFilters, getInitialVisibleColumns, utcToIstFormat } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { operatorRoles } from '$lib/dummy-data';
	import type { OperatorRole } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fetchOperatorRoleList } from '$lib/services/operator-role';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onMount } from 'svelte';

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Preserve company context params (name, status) for downstream navigation --
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');

	//-- Build a reusable URLSearchParams with all company context --
	function buildCompanyParams(): URLSearchParams {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		return params;
	}

	//-- Operator Roles scoped to current company (or all if no companyId provided) --
	$: baseOperatorRoles = companyId
		? operatorRoles.filter((o) => o.companyId === companyId)
		: operatorRoles;

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;
	let requestId = 0;

	let formattedRoles: OperatorRole[] = [];
	let loading = false;
	let totalItems = 0;

	async function fetchOperatorRoles() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		const parsedCompanyId = companyId ? Number(companyId) : undefined;
		const validCompanyId =
			typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
				? parsedCompanyId
				: undefined;
		try {
			const data = await fetchOperatorRoleList({
				company_id: validCompanyId,
				search: searchTerm || undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return;

			formattedRoles = (data as any[]).map(
				(role) =>
					({
						...role,
						apiId: role.apiId ?? role.id ?? null,
						id: role.id ? `ROLE-${role.id}` : '',
						createdAt: utcToIstFormat(role.created_on ?? role.createdAt ?? ''),
						updatedAt: utcToIstFormat(role.updated_on ?? role.updatedAt ?? '')
					}) as OperatorRole
			);

			if (Array.isArray(data)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + data.length;
				if (data.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchOperatorRoles();
				}
				hasNextPage = data.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (err: any) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedRoles = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(err);
			toast.error(message || 'Failed to fetch roles.');
		}
		loading = false;
	}

	onMount(() => {
		fetchOperatorRoles();
	});

	function handlePageChange(p: number) {
		currentPage = p;
		fetchOperatorRoles();
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	//-- Handle search/filter updates --
	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		await fetchOperatorRoles();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'createdAt', label: 'Created At' }
	];
	const optionalColumns = [{ key: 'updatedAt', label: 'Updated At' }];

	//-- Start with only default columns visible, no optional ones --
	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
	}

	//-- Navigation to role creation --
	function handleAddOperatorRole() {
		const params = buildCompanyParams();
		const qs = params.toString();
		goto(`/company/operator-role/create${qs ? `?${qs}` : ''}`);
	}

	//-- Navigation to role detail page --
	function handleShowDetailPage(role: OperatorRole) {
		if (!role?.id) return;
		const params = buildCompanyParams();
		params.set('id', role.id);
		goto(`/company/operator-role/operator-role-detail?${params.toString()}`);
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
				title="Operator Role Management"
				subtitle="Define and manage all operator roles in the system."
				buttonLabel="Add New Role"
				icon="bi-plus-lg"
				onButtonClick={handleAddOperatorRole}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name or ID..."
				showFilter={false}
				showSearch={true}
				on:update={handleSearchUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedRoles}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Roles"
					on:rowClick={(e) => handleShowDetailPage(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedRoles as role}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						role="button"
						tabindex="0"
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleShowDetailPage(role);
							}
						}}
						style="background-color: var(--bg-card);"
						on:click={() => handleShowDetailPage(role)}
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Info -->
							<div style="color: var(--text-primary);">
								<div class="fw-inter-700">{role.name}</div>
								<div class="small">{role.id}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if formattedRoles.length === 0}
					<EmptyData message="No Roles found" />
				{/if}
				<FloatingAddButton onClick={handleAddOperatorRole} tooltip="Add new role" />
			</div>
			<!-- Pagination -->
			{#if totalItems > 0 || hasNextPage}
				<Pagination
					{totalItems}
					{itemsPerPage}
					{currentPage}
					hasMore={hasNextPage}
					onPageChange={handlePageChange}
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

<!-- Styles -->
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
