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
	import { localFares } from '$lib/dummy-data';
	import type { Fare } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Operator Roles scoped to current company (or all if no companyId provided) --
	$: baseLocalFares = companyId
		? localFares.filter((o) => o.companyId === companyId)
		: localFares;

	let filtered: Fare[] = [...(baseLocalFares ?? localFares)];
	let paginated: Fare[] = [];

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end).map((r) => ({
			...r,
			created_on: utcToIstFormat(r.created_on),
			updated_on: utcToIstFormat(r.updated_on)
		}));
	}

	function handlePageChange(p: number) {
		currentPage = p;
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	//-- Handle search/filter updates --
	function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		filtered = applySearchAndFilters(baseLocalFares, searchTerm, {
			searchKeys: ['name', 'id']
		});
		currentPage = 1;
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'version', label: 'Version' },
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
		goto('/company/local-fare/create');
	}

	//-- Navigation to fare detail page --
	function handleShowDetailPage(fare: 	Fare) {
		if (!fare?.id) return;
		goto(`/company/local-fare/local-fare-detail?id=${encodeURIComponent(fare.id)}`);
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
				title="Local Fare Management"
				subtitle="Define and manage all local fares in the system."
				buttonLabel="Add New Fare"
				icon="bi-plus-lg"
				onButtonClick={handleAddLocalFare}
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
					data={paginated}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Local Fares"
					on:rowClick={(e) => handleShowDetailPage(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as fare}
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
							</div>
						</div>
						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if paginated.length === 0}
					<EmptyData message="No Local Fares found" />
				{/if}
				<FloatingAddButton onClick={handleAddLocalFare} tooltip="Add new fare" />
			</div>
			<!-- Pagination -->
			{#if paginated.length > 0}
				<Pagination
					totalItems={filtered.length}
					{itemsPerPage}
					{currentPage}
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
