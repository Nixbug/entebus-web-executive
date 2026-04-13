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
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';

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
		await fetchGlobalFares();
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	//-- Handle search/filter updates --
	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		await fetchGlobalFares();
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
	function handleAddGlobalFare() {
		goto('/global-fare/create');
	}

	//-- Navigation to fare detail page --
	function handleShowDetailPage(fare: Fare) {
		const fareApiId = fare.apiId;
		if (fareApiId === null || fareApiId === undefined) return;
		goto(`/global-fare/global-fare-detail?id=${encodeURIComponent(String(fareApiId))}`);
	}

	async function fetchGlobalFares() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const data = await fetchFareList({
				scope: 1,
				search: searchTerm || undefined,
				limit: itemsPerPage + 1,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return;

			formattedFares = (data as any[]).map((fare) => ({
				id: `GFARE-${fare.id}`,
				apiId: fare.id,
				companyId: fare.company_id ? String(fare.company_id) : undefined,
				name: fare.name,
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
					return await fetchGlobalFares();
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
			toast.error(message || 'Failed to fetch global fares.');
		} finally {
			if (currentRequestId === requestId) {
				loading = false;
			}
		}
	}

	onMount(() => {
		fetchGlobalFares();
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
				title="Global Fare Management"
				subtitle="Define and manage all global fares in the system."
				buttonLabel="Add New Fare"
				icon="bi-plus-lg"
				onButtonClick={handleAddGlobalFare}
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
					data={formattedFares}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Global Fares"
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
							</div>
						</div>
						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if formattedFares.length === 0}
					<EmptyData message="No Global Fares found" />
				{/if}
				<FloatingAddButton onClick={handleAddGlobalFare} tooltip="Add new fare" />
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
