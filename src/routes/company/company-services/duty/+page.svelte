<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import { getInitialVisibleColumns, utcToIstFormat, mapDutyStatusToLabel } from '$lib/helpers';
	import { page } from '$app/stores';
	import { fetchDutyList } from '$lib/services/service-duty';
	import { fetchOperatorAccount } from '$lib/services/operator-account';
	import { fetchServiceList } from '$lib/services/company-services';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import { DUTY_STATUS_FILTER_OPTIONS, DUTY_STATUS_VALUE_BY_LABEL } from '$lib/constants';
	import type { Duty } from '$lib/types/type';

	//-- Filter by company id from URL --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Optional: filter to a specific service's duties (from service detail page) --
	$: serviceIdFilter = $page.url.searchParams.get('serviceId')
		? Number($page.url.searchParams.get('serviceId'))
		: undefined;
	$: serviceNameFilter = $page.url.searchParams.get('serviceName') ?? undefined;

	//-- Preserve company context params for downstream navigation --
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;
	let requestId = 0;

	let formattedDuties: Duty[] = [];
	let loading = false;
	let totalItems = 0;
	let previousCompanyId: string | null | undefined = undefined;
	let hasInitializedCompanyContext = false;

	//-- Lookup maps: operatorId → name, serviceId → name --
	let operatorNameMap: Map<number, string> = new Map();
	let serviceNameMap: Map<number, string> = new Map();

	//-- Load operator and service lookup maps for the current company --
	async function loadLookupMaps() {
		const parsedCompanyId = companyId ? Number(companyId) : undefined;
		const validCompanyId =
			typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
				? parsedCompanyId
				: undefined;

		const [operators, services] = await Promise.allSettled([
			fetchOperatorAccount({ company_id: validCompanyId, limit: 500 }),
			fetchServiceList({ company_id: validCompanyId, limit: 500 })
		]);

		if (operators.status === 'fulfilled' && Array.isArray(operators.value)) {
			const map = new Map<number, string>();
			for (const op of operators.value as any[]) {
				if (op.id != null) {
					map.set(op.id, op.full_name ?? op.username ?? `Operator #${op.id}`);
				}
			}
			operatorNameMap = map;
		}

		if (services.status === 'fulfilled' && Array.isArray(services.value)) {
			const map = new Map<number, string>();
			for (const svc of services.value as any[]) {
				if (svc.id != null) {
					map.set(svc.id, svc.name ?? `Service #${svc.id}`);
				}
			}
			serviceNameMap = map;
		}
	}

	//-- Core data fetching function --
	async function fetchDuties() {
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
			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? DUTY_STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;

			const data = await fetchDutyList({
				company_id: validCompanyId,
				service_id: serviceIdFilter,
				status: statusFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return;

			formattedDuties = (data as any[]).map(
				(duty) =>
					({
						id: duty.id ? `DUTY-${duty.id}` : '',
						apiId: duty.id ?? null,
						companyId: String(duty.company_id ?? ''),
						operatorId: duty.operator_id ?? null,
						serviceId: duty.service_id ?? null,
						operatorName: duty.operator_id
							? (operatorNameMap.get(duty.operator_id) ?? `Operator #${duty.operator_id}`)
							: '—',
						serviceName: duty.service_id
							? (serviceNameMap.get(duty.service_id) ?? `Service #${duty.service_id}`)
							: '—',
						statusLabel: mapDutyStatusToLabel(duty.status),
						collection: duty.collection ?? '—',
						startedOn: utcToIstFormat(duty.started_on),
						finishedOn: utcToIstFormat(duty.finished_on),
						createdAt: utcToIstFormat(duty.created_on),
						updatedAt: utcToIstFormat(duty.updated_on)
					}) as Duty
			);

			if (Array.isArray(data)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + data.length;
				if (data.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchDuties();
				}
				hasNextPage = data.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (err: any) {
			if (currentRequestId !== requestId) return;
			formattedDuties = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(err);
			toast.error(message || 'Failed to fetch duties.');
		} finally {
			if (currentRequestId === requestId) loading = false;
		}
	}

	onMount(async () => {
		await loadLookupMaps();
		await fetchDuties();
	});

	//-- Refetch if company context changes --
	$: if (!hasInitializedCompanyContext) {
		previousCompanyId = companyId;
		hasInitializedCompanyContext = true;
	} else if (companyId !== previousCompanyId) {
		previousCompanyId = companyId;
		currentPage = 1;
		loadLookupMaps().then(() => fetchDuties());
	}

	function handlePageChange(p: number) {
		currentPage = p;
		fetchDuties();
	}

	//-- Filter setup (no search bar) --
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Status',
			key: 'status',
			options: DUTY_STATUS_FILTER_OPTIONS
		}
	];

	async function handleFilterUpdate(event: CustomEvent) {
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		await fetchDuties();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'operatorName', label: 'Operator' },
		{ key: 'serviceName', label: 'Service' },
		{ key: 'statusLabel', label: 'Status', isChip: true },
		{ key: 'startedOn', label: 'Started On' },
		{ key: 'finishedOn', label: 'Finished On' }
	];
	const optionalColumns = [
		{ key: 'collection', label: 'Collection' },
		{ key: 'createdAt', label: 'Created At' },
		{ key: 'updatedAt', label: 'Updated At' }
	];

	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
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
				to={serviceIdFilter
					? `/company/company-services/detail?id=${serviceIdFilter}${companyId ? `&companyId=${companyId}` : ''}${companyName ? `&name=${encodeURIComponent(companyName)}` : ''}${companyStatus ? `&status=${encodeURIComponent(companyStatus)}` : ''}`
					: '/company/dashboard'}
				preserveQuery={false}
			/>
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Duty Management"
				subtitle={serviceNameFilter
					? `Duties for service: ${serviceNameFilter}`
					: 'View and manage all operator duties.'}
                showButton={false}
                buttonLabel=""
                
			/>
			<!-- FILTER BAR (no search) -->
			<SearchFilterBar
				{filters}
				{activeFilters}
                searchPlaceholder="Search by ID..."

				on:update={handleFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedDuties}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Duties"
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedDuties as duty (duty.id)}
					<div
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
					>
						<div class="d-flex flex-column gap-1" style="color: var(--text-primary);">
							<div class="fw-inter-700">{duty.operatorName}</div>
							<div class="small text-muted">{duty.serviceName}</div>
							<div class="small">{duty.id}</div>
						</div>
						<span
							class="badge rounded-pill"
							style="background-color: var(--edit-btn); color: var(--text-primary);"
						>
							{duty.statusLabel}
						</span>
					</div>
				{/each}
				{#if formattedDuties.length === 0}
					<EmptyData message="No Duties found" />
				{/if}
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
