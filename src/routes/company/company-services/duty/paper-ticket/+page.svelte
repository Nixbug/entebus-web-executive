<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import PaperTicketDetailModal from '$lib/components/service-components/PaperTicketDetailModal.svelte';
	import { getInitialVisibleColumns, utcToIstFormat } from '$lib/helpers';
	import { page } from '$app/stores';
	import { fetchPaperTicketList } from '$lib/services/paper-ticket';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onMount } from 'svelte';

	//-- URL params --
	$: dutyId = (() => {
		const raw = $page.url.searchParams.get('dutyId');
		const parsed = raw === null ? undefined : Number(raw);
		return parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
	})();

	$: companyId = (() => {
		const raw = $page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id');
		const parsed = raw === null ? undefined : Number(raw);
		return parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
	})();

	$: dutyDisplayId =
		$page.url.searchParams.get('dutyDisplayId') ?? (dutyId ? `DUTY-${dutyId}` : '');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: serviceIdParam = $page.url.searchParams.get('serviceId');
	$: serviceNameParam = $page.url.searchParams.get('serviceName');

	//-- Back navigation --
	$: backHref = (() => {
		const params = new URLSearchParams();
		if (dutyId && serviceIdParam) params.set('serviceId', serviceIdParam);
		if (companyId) params.set('companyId', String(companyId));
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		if (serviceNameParam) params.set('serviceName', serviceNameParam);
		return `/company/company-services/duty?${params.toString()}`;
	})();

	//-- Pagination --
	let currentPage = 1;
	const itemsPerPage = 10;
	let hasNextPage = false;
	let totalItems = 0;
	let requestId = 0;

	//-- Data --
	type TicketRow = {
		id: string;
		apiId: number;
		amount: string;
		pickupPoint: string;
		droppingPoint: string;
		issuedAt: string;
		fareCount: number;
		[key: string]: any;
	};

	let ticketRows: TicketRow[] = [];
	let rawTickets: any[] = [];
	let loading = false;

	//-- Lookup caches --
	//-- ticketTypeNameMap: maps composite key (fareId-typeId) → name (from fare.attributes.ticket_types) --
	let ticketTypeNameMap: Map<string, string> = new Map();
	let ticketTypeNamesLoaded = false;
	let ticketTypeNamesLoadPromise: Promise<void> | null = null;
	let landmarkNameMap: Map<number, string> = new Map();

	//-- Load ticket type names from all fare templates for this company --
	async function loadTicketTypeNames() {
		if (ticketTypeNamesLoaded) return;
		if (ticketTypeNamesLoadPromise) {
			await ticketTypeNamesLoadPromise;
			return;
		}

		ticketTypeNamesLoadPromise = (async () => {
			try {
				const fares = await fetchFareList({ company_id: companyId });
				const updated = new Map(ticketTypeNameMap);
				for (const fare of fares as Array<{
					id?: number;
					attributes?: { ticket_types?: Array<{ id: number; name: string }> };
				}>) {
					for (const tt of fare.attributes?.ticket_types ?? []) {
						//-- Use composite key (fareId-typeId) to avoid collisions across fares --
						updated.set(`${fare.id}-${tt.id}`, tt.name);
					}
				}
				ticketTypeNameMap = updated;
				ticketTypeNamesLoaded = true;
			} catch {
				//-- Names fall back to IDs --
			} finally {
				ticketTypeNamesLoadPromise = null;
			}
		})();

		await ticketTypeNamesLoadPromise;
	}

	//-- Detail modal state --
	let selectedTicket: any | null = null;
	let showModal = false;
	let modalLoading = false;
	let modalRequestId = 0;

	//-- Search/Filter --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};

	//-- Build detail ticket object for modal --
	async function openTicketDetail(row: TicketRow) {
		const raw = rawTickets.find((t) => t.id === row.apiId);
		if (!raw) return;
		const currentModalRequestId = ++modalRequestId;
		modalLoading = true;
		showModal = true;
		selectedTicket = null;

		try {
			//-- Ensure ticket type names are loaded --
			await loadTicketTypeNames();

			//-- Resolve pickup/dropping point names --
			const pointIds: number[] = [raw.ticket?.pickup_point, raw.ticket?.dropping_point].filter(
				Boolean
			);
			const missingPointIds = pointIds.filter((id) => !landmarkNameMap.has(id));
			if (missingPointIds.length > 0) {
				const lmResult = await fetchLandmarkList({ id_list: missingPointIds });
				const updated = new Map(landmarkNameMap);
				for (const lm of lmResult as any[]) {
					if (lm.id != null) updated.set(lm.id, lm.name ?? `Landmark #${lm.id}`);
				}
				landmarkNameMap = updated;
			}

			if (currentModalRequestId !== modalRequestId) return;

			selectedTicket = {
				id: raw.id,
				serviceId: raw.service_id,
				dutyId: raw.duty_id,
				companyId: raw.company_id,
				amount: raw.amount,
				createdOn: raw.created_on,
				distance: raw.ticket?.distance ?? 0,
				pickupPointName:
					raw.ticket?.pickup_point != null
						? (landmarkNameMap.get(raw.ticket.pickup_point) ??
							`Landmark #${raw.ticket.pickup_point}`)
						: '—',
				droppingPointName:
					raw.ticket?.dropping_point != null
						? (landmarkNameMap.get(raw.ticket.dropping_point) ??
							`Landmark #${raw.ticket.dropping_point}`)
						: '—',
				ticketTypes: (raw.ticket?.ticket_types ?? []).map((tt: any) => ({
					id: tt.id,
					count: tt.count,
					price: tt.price,
					//-- Use composite key (fareId-typeId) to get the correct name across fares --
					ticketTypeName: ticketTypeNameMap.get(`${tt.template_id}-${tt.id}`) ?? `Type #${tt.id}`
				}))
			};
		} catch (err) {
			console.error('Failed to resolve ticket details:', err);
			toast.error('Failed to load ticket details.');
			showModal = false;
		} finally {
			if (currentModalRequestId === modalRequestId) modalLoading = false;
		}
	}

	//-- Core fetch --
	async function fetchTickets() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;

		try {
			const data = await fetchPaperTicketList({
				duty_id: dutyId,
				company_id: companyId,
				id: searchTerm && Number.isFinite(Number(searchTerm)) ? Number(searchTerm) : undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return;

			rawTickets = Array.isArray(data) ? (data as any[]) : [];

			//-- Collect all landmark IDs from this page and resolve missing ones --
			const allPointIds: number[] = rawTickets.flatMap((t: any) =>
				[t.ticket?.pickup_point, t.ticket?.dropping_point].filter((id): id is number => id != null)
			);
			const uniquePointIds = [...new Set(allPointIds)];
			const missingPointIds = uniquePointIds.filter((id) => !landmarkNameMap.has(id));
			if (missingPointIds.length > 0) {
				try {
					const lmResult = await fetchLandmarkList({ id_list: missingPointIds });
					if (currentRequestId !== requestId) return;
					const updated = new Map(landmarkNameMap);
					for (const lm of lmResult as any[]) {
						if (lm.id != null) updated.set(lm.id, lm.name ?? `Landmark #${lm.id}`);
					}
					landmarkNameMap = updated;
				} catch {
					//-- Names fall back to IDs --
				}
			}

			ticketRows = rawTickets.map((t: any) => ({
				id: `TKT-${t.id}`,
				apiId: t.id,
				amount: `₹${t.amount}`,
				pickupPoint:
					t.ticket?.pickup_point != null
						? (landmarkNameMap.get(t.ticket.pickup_point) ?? `Landmark #${t.ticket.pickup_point}`)
						: '—',
				droppingPoint:
					t.ticket?.dropping_point != null
						? (landmarkNameMap.get(t.ticket.dropping_point) ??
							`Landmark #${t.ticket.dropping_point}`)
						: '—',
				fareCount: (t.ticket?.ticket_types ?? []).length,
				issuedAt: utcToIstFormat(t.created_on)
			}));

			const fetchedCount = (currentPage - 1) * itemsPerPage + rawTickets.length;
			if (rawTickets.length === 0 && currentPage > 1) {
				currentPage = Math.max(1, currentPage - 1);
				return await fetchTickets();
			}
			hasNextPage = rawTickets.length === itemsPerPage;
			totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
		} catch (err: any) {
			if (currentRequestId !== requestId) return;
			ticketRows = [];
			rawTickets = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(err);
			toast.error(message || 'Failed to fetch tickets.');
		} finally {
			if (currentRequestId === requestId) loading = false;
		}
	}

	onMount(async () => {
		await fetchTickets();
	});

	function handlePageChange(p: number) {
		currentPage = p;
		fetchTickets();
	}

	async function handleFilterUpdate(event: CustomEvent) {
		activeFilters = event.detail?.activeFilters ?? {};
		searchTerm = event.detail?.searchTerm ?? '';
		currentPage = 1;
		await fetchTickets();
	}

	//-- Table columns --
	const defaultColumns = [
		{ key: 'id', label: 'Ticket ID' },
		{ key: 'amount', label: 'Amount' },
		{ key: 'pickupPoint', label: 'Pickup' },
		{ key: 'droppingPoint', label: 'Drop' },
		{ key: 'fareCount', label: 'Fare Types' },
		{ key: 'issuedAt', label: 'Issued At' }
	];

	let visibleColumns = getInitialVisibleColumns(defaultColumns, [], []);
	$: displayedColumns = defaultColumns.filter((col) => visibleColumns.includes(col.key));
</script>

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
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel="Back to duties"
				to={backHref}
				preserveQuery={false}
			/>

			<ListingPageHeader
				title="Paper Tickets"
				subtitle={dutyDisplayId
					? `Tickets for duty: ${dutyDisplayId}`
					: 'View paper tickets associated with this duty.'}
				showButton={false}
				buttonLabel=""
			/>

			<SearchFilterBar
				showFilter={false}
				{activeFilters}
				searchPlaceholder="Search by ticket ID..."
				on:update={handleFilterUpdate}
			/>

			<!-- Table (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={ticketRows}
					columns={displayedColumns}
					{visibleColumns}
					tableName="Paper Tickets"
					on:rowClick={(e) => openTicketDetail(e.detail)}
				/>
			</div>

			<!-- Card View (Mobile) -->
			<div class="d-md-none">
				{#each ticketRows as ticket (ticket.id)}
					<button
						class="d-flex align-items-center justify-content-between p-3 rounded-4 mb-2 w-100 text-start border-0"
						style="background-color: var(--bg-card); cursor: pointer;"
						on:click={() => openTicketDetail(ticket)}
					>
						<div class="d-flex flex-column gap-1" style="color: var(--text-primary);">
							<div class="fw-inter-700">{ticket.id}</div>
							<div class="small text-muted">{ticket.pickupPoint} → {ticket.droppingPoint}</div>
							<div class="small text-muted">{ticket.issuedAt}</div>
						</div>
						<span class="amount-pill">{ticket.amount}</span>
					</button>
				{/each}
				{#if ticketRows.length === 0 && !loading}
					<EmptyData message="No paper tickets found" />
				{/if}
			</div>

			{#if totalItems > 0 || hasNextPage}
				<Pagination
					{totalItems}
					{itemsPerPage}
					{currentPage}
					hasMore={hasNextPage}
					onPageChange={handlePageChange}
				/>
			{/if}
		</main>
	</div>
</div>

{#if showModal}
	<PaperTicketDetailModal
		ticket={selectedTicket}
		loading={modalLoading}
		onClose={() => {
			showModal = false;
			selectedTicket = null;
		}}
	/>
{/if}

<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}

	.amount-pill {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.25);
		border-radius: 20px;
		padding: 4px 12px;
		font-size: 13px;
		font-weight: 700;
		white-space: nowrap;
		flex-shrink: 0;
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
