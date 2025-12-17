<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import { applySearchAndFilters, getInitialVisibleColumns } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { executiveRoles } from '$lib/dummy-data';
	import { goto } from '$app/navigation';

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
    
	let filtered = [...executiveRoles];
	let paginated: any = [];

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end);
	}

	function handlePageChange(p: number) {
		currentPage = p;
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	//-- Handle search/filter updates --
	function handleUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		filtered = applySearchAndFilters(executiveRoles, searchTerm, {
			searchKeys: ['name', 'id']
		});
		currentPage = 1;
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

	//-- Add Executive --
function handleAddExecutiveRole() {
		goto('/executive-role/create');
}



	function handleShowDetailPage(event: CustomEvent) {
		const row = event.detail;
		if (row?.id) {
			goto(`/executive-role/executive-role-detail?id=${encodeURIComponent(row.id)}`);
		} else {
			goto('/executive-role/executive-role-detail');
		}
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
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Role Management"
				subtitle="Define and manage all user roles in the system"
				buttonLabel="Add New Role"
				icon="bi-plus-lg"
				onButtonClick={handleAddExecutiveRole}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name or ID..."
				showFilter={false}
				on:update={handleUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable data={paginated} columns={displayedColumns} {visibleColumns} tableName="Roles"
				on:rowClick={handleShowDetailPage}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as role}
					<div
						class="exec-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Info -->
							<div style="color: var(--text-primary);">
								<div class="fw-inter-700">{role.name}</div>
								<div class="small">{role.createdAt}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary"></i>
					</div>
				{/each}
				{#if paginated.length === 0}
					<div
						class=" card d-flex flex-column align-items-center justify-content-center py-5 gap-2"
						style="background-color: var(--bg-card);"
					>
						<div
							class="d-flex align-items-center justify-content-center rounded-circle"
							style="width:70px; height:70px; background:rgba(255,255,255,0.05);"
						>
							<i class="bi bi-search fs-2" style="color:var(--text-muted);"></i>
						</div>

						<h5 class="m-0 fw-inter-700" style="color:var(--text-muted);">No data found</h5>
						<p class="m-0 small" style="color:var(--text-muted);">
							Try adjusting your search or filters
						</p>
					</div>
				{/if}
				<FloatingAddButton onClick={handleAddExecutiveRole} tooltip="Add new executive role" />
			</div>
			<!-- Pagination -->
			<Pagination
				totalItems={filtered.length}
				{itemsPerPage}
				{currentPage}
				onPageChange={handlePageChange}
			/>
			<div class="float-end mt-3" style="position: fixed; bottom: 1rem; right: 1rem;">
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
