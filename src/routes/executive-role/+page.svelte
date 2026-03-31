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
	import { fetchRoleList } from '$lib/services/executive-role';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import type { ExecutiveRole } from '$lib/types/type';
	import { canCreateExecutiveRole } from '$lib/utils/permissions';

	//-- Cache permission check to avoid repeated parsing/localStorage reads on each render --
	const canCreate = canCreateExecutiveRole();

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;
	let requestId = 0;

	let formattedRoles: ExecutiveRole[] = [];
	let loading = false;
	let totalItems = 0;

	//-- Handle page changes from the Pagination component --
	async function handlePageChange(p: number) {
		currentPage = p;
		await fetchExecutiveRoles();
	}

	//-- Search/Filter setup --
	let searchTerm = '';

	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		await fetchExecutiveRoles();
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
	function handleShowDetailPage(role: ExecutiveRole) {
		const roleId = role.apiId;
		if (roleId === null || roleId === undefined) return;
		goto(`/executive-role/executive-role-detail?id=${encodeURIComponent(String(roleId))}`);
	}

	async function fetchExecutiveRoles() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const data = await fetchRoleList({
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
					}) as ExecutiveRole
			);

			if (Array.isArray(data)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + data.length;
				if (data.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchExecutiveRoles();
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
		fetchExecutiveRoles();
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
				title="Role Management"
				subtitle="Define and manage all user roles in the system."
				buttonLabel="Add New Role"
				icon="bi-plus-lg"
				onButtonClick={handleAddExecutiveRole}
				isInitiallyEnabled={canCreate}
				disabledTooltip="You don't have permission to create roles."
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
				<FloatingAddButton
					onClick={handleAddExecutiveRole}
					tooltip={canCreate ? 'Add new role' : 'You do not have permission to add roles'}
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
