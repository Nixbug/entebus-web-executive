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
	import { fetchRoleList, type Role } from '$lib/services/executive-role';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { goto } from '$app/navigation';

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let roles: Role[] = [];
	let filtered: Role[] = [];
	let paginated: Role[] = [];
	let loading = false;
	let error: string | null = null;
	let totalItems = 0;

	// server-side pagination: filtered contains current page items
	$: paginated = filtered;

	async function handlePageChange(p: number) {
		currentPage = p;
		await loadRoles();
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		await loadRoles();
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
	function handleAddExecutiveRole() {
		goto('/executive-role/create');
	}

	//-- Navigation to role detail page --
	function handleShowDetailPage(role: Role) {
		if (!role?.id) return;
		goto(`/executive-role/executive-role-detail?id=${encodeURIComponent(role.id)}`);
	}
	import { onMount } from 'svelte';

	// normalize API fields to UI-friendly names used by table columns
	function normalizeRoles(data: Role[]) {
		return data.map(
			(r) =>
				({
					...r,
					createdAt: utcToIstFormat(r.created_on ?? (r as any).createdAt ?? ''),
					updatedAt: utcToIstFormat(r.updated_on ?? (r as any).updatedAt ?? '')
				}) as Role & { createdAt: string; updatedAt: string | null }
		);
	}

	async function loadRoles() {
		loading = true;
		error = null;
		try {
			const data = await fetchRoleList({
				name: searchTerm || undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});
			roles = normalizeRoles(data as Role[]);
			filtered = roles;
			totalItems = (currentPage - 1) * itemsPerPage + (roles?.length ?? 0);
		} catch (err: any) {
			error = err?.message ?? String(err);
			roles = [];
			filtered = [];
			totalItems = 0;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRoles();
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
				title="Role Management"
				subtitle="Define and manage all user roles in the system."
				buttonLabel="Add New Role"
				icon="bi-plus-lg"
				onButtonClick={handleAddExecutiveRole}
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
					tableName="Roles"
					on:rowClick={(e) => handleShowDetailPage(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as role}
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
				{#if paginated.length === 0}
					<EmptyData message="No Roles found" />
				{/if}
				<FloatingAddButton onClick={handleAddExecutiveRole} tooltip="Add new role" />
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
