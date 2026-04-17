<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { getInitialVisibleColumns, utcToIstFormat } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import type { Fare } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { FARE_SCOPE_VALUE_BY_LABEL } from '$lib/constants';
	import { canCreateFare } from '$lib/utils/permissions';

	// Cache permission check to avoid repeated parsing on each render
	const canCreate = canCreateFare();

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

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;
	let requestId = 0;

	let formattedFares: Fare[] = [];
	let loading = false;
	let totalItems = 0;

	//-- Handle page changes from the Pagination component --
	async function handlePageChange(p: number) {
		currentPage = p;
		await fetchLocalFares();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [{ key: 'scope', label: 'Type', options: ['All Types', 'Global', 'Local'] }];

	//-- Handle search/filter updates --
	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		await fetchLocalFares();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'version', label: 'Version' },
		{ key: 'scope', label: 'Type', isChip: true },
		{ key: 'created_on', label: 'Created At' }
	];
	const optionalColumns = [{ key: 'updated_on', label: 'Updated At' }];

	//-- Start with only default columns visible, no optional ones --
	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
	}

	//-- Navigation to fare creation --
	function handleAddLocalFare() {
		const params = buildCompanyParams();
		goto(`/company/local-fare/create?${params.toString()}`);
	}

	//-- Navigation to fare detail page --
	function handleShowDetailPage(fare: Fare) {
		const fareApiId = fare.apiId;
		if (fareApiId === null || fareApiId === undefined) return;
		const params = buildCompanyParams();
		params.set('id', String(fareApiId));
		goto(`/company/local-fare/local-fare-detail?${params.toString()}`);
	}

	async function fetchLocalFares() {
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
			const fareScopeFilter = //-- replace it with scope 2 if we need both local and global fares, currently we are showing only local fares so hardcoding it to 2"
				activeFilters.scope && !String(activeFilters.scope).toLowerCase().startsWith('all')
					? FARE_SCOPE_VALUE_BY_LABEL[String(activeFilters.scope)]
					: undefined;
			const data = await fetchFareList({
				...(validCompanyId && { company_id: validCompanyId }),
				search: searchTerm || undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage,
				scope: 2
			});

			if (currentRequestId !== requestId) return;

			formattedFares = (data as any[]).map((fare) => ({
				id: `LFARE-${fare.id}`,
				apiId: fare.id,
				companyId: fare.company_id ? String(fare.company_id) : undefined,
				name: fare.name,
				scope: fare.scope === 1 ? 'Global' : fare.scope === 2 ? 'Local' : 'Unknown',
				version: fare.version,
				attributes: fare.attributes,
				function: fare.function,
				created_on: utcToIstFormat(fare.created_on),
				updated_on: fare.updated_on ? utcToIstFormat(fare.updated_on) : ''
			}));

			if (Array.isArray(data)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + data.length;
				if (data.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchLocalFares();
				}
				hasNextPage = data.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (e) {
			if (currentRequestId !== requestId) return;
			formattedFares = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch local fares.');
		} finally {
			if (currentRequestId === requestId) {
				loading = false;
			}
		}
	}

	let previousCompanyId: string | null | undefined = undefined;
	onMount(() => {
		previousCompanyId = companyId;
		fetchLocalFares();
	});

	$: if (previousCompanyId !== undefined && companyId !== previousCompanyId) {
		previousCompanyId = companyId;
		formattedFares = [];
		totalItems = 0;
		hasNextPage = false;
		currentPage = 1;
		fetchLocalFares();
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
				title="Local Fare Management"
				subtitle="Define and manage all local fares in the system."
				buttonLabel="Add New Fare"
				icon="bi-plus-lg"
				onButtonClick={handleAddLocalFare}
				isInitiallyEnabled={canCreate}
				disabledTooltip="You don't have permission to create fares."
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name or ID..."
				showFilter={false}
				{filters}
				on:update={handleSearchUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedFares}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Local Fares"
					on:rowClick={(e) => handleShowDetailPage(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedFares as fare}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						role="button"
						tabindex="0"
						on:click={() => handleShowDetailPage(fare)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleShowDetailPage(fare);
							}
						}}
						style="background-color: var(--bg-card);"
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Info -->
							<div style="color: var(--text-primary);">
								<div class="fw-inter-700">{fare.name}</div>
								<div class="small">{fare.id}</div>
								<div class="small">{fare.scope}</div>
							</div>
						</div>
						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if formattedFares.length === 0}
					<EmptyData message="No Fares found" />
				{/if}
				<FloatingAddButton
					onClick={handleAddLocalFare}
					tooltip="Add new fare"
					isInitiallyEnabled={canCreate}
				/>
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
