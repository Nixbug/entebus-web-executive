<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import NameCell from '$lib/components/TableNameCell.svelte';
	import { getColorFromName } from '$lib/color-palette';
	import { applySearchAndFilters, getInitialVisibleColumns } from '$lib/helpers';
	import { page } from '$app/stores';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import { operators } from '$lib/dummy-data';
	import { operatorAccountSchema } from '$lib/schemas';
	import type { Operator } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getOperatorDetailConfig } from '$lib/configs/company-operator.config';

	let selected: Operator | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Operators scoped to current company (or all if no companyId provided) --
	$: baseOperators = companyId ? operators.filter((o) => o.companyId === companyId) : operators;

	//-- Open Detail Sidebar --
	function openDetail(row: Operator) {
		selected = row;
		detailConfig = getOperatorDetailConfig(row);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let filtered: Operator[] = [...(baseOperators ?? operators)];
	let paginated: Operator[] = [];

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
	let activeFilters = {};
	const filters = [
		{
			label: 'Gender',
			key: 'gender',
			options: ['All Genders', 'Male', 'Female', 'Transgender', 'Other']
		},
		{ label: 'Status', key: 'status', options: ['All Status', 'Active', 'Inactive'] }
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		filtered = applySearchAndFilters(baseOperators, searchTerm, {
			searchKeys: ['name', 'id', 'email', 'phone'],
			filters: activeFilters
		});

		currentPage = 1;
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'phone', label: 'Phone Number' },
		{ key: 'gender', label: 'Gender', isChip: true }
	];
	const optionalColumns = [
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
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton icon="bi bi-arrow-left" ariaLabel="Back" to="/company/dashboard" preserveQuery={true} />
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
					data={paginated}
					columns={displayedColumns}
					{visibleColumns}
					{customRender}
					tableName="Operators"
					on:rowClick={(e) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each paginated as oper}
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
				{#if paginated.length === 0}
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
			{#if paginated.length > 0}
				<!-- Pagination -->
				<Pagination
					totalItems={filtered.length}
					{itemsPerPage}
					{currentPage}
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
