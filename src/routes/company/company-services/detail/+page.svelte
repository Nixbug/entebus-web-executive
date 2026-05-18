<script lang="ts">
	import ServiceDetailPage from '$lib/components/service-components/ServiceDetailPage.svelte';
	import type { ServiceDetail, Landmark } from '$lib/types/type';
	import { fetchServiceDetail } from '$lib/services/company-services';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import { fetchOperatorAccount } from '$lib/services/operator-account';
	import {
		createServiceAssignment,
		deleteServiceAssignment,
		fetchServiceAssignmentList
	} from '$lib/services/service-assignment';
	import { fetchDutyList } from '$lib/services/service-duty';

	let service: ServiceDetail | null = null;
	let landmarks: Landmark[] = [];
	let loading = true;
	let error: string | null = null;
	let loadedServiceId: number | null = null;
	let totalCollection: number | null = null;

	$: serviceId = Number($page.url.searchParams.get('id'));
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: referrer = $page.url.searchParams.get('from');
	$: referrerFromDate = $page.url.searchParams.get('from_date');
	$: referrerToDate = $page.url.searchParams.get('to_date');
	$: listingHref = buildListingHref(
		companyId,
		companyName,
		companyStatus,
		referrerFromDate,
		referrerToDate
	);
	$: referrerCompanyId = $page.url.searchParams.get('companyId');
	$: referrerCompanyName = $page.url.searchParams.get('name');
	$: referrerCompanyStatus = $page.url.searchParams.get('status');

	// Build a safe return URL when navigating back from a report view.
	// Preserve company context and date range when returning to report.
	$: backToReportUrl = (() => {
		if (referrer !== 'report') return listingHref;
		const params = new URLSearchParams();
		if (referrerFromDate) params.set('from', String(referrerFromDate));
		if (referrerToDate) params.set('to', String(referrerToDate));
		if (referrerCompanyId) params.set('companyId', String(referrerCompanyId));
		if (referrerCompanyName) params.set('name', String(referrerCompanyName));
		if (referrerCompanyStatus) params.set('status', String(referrerCompanyStatus));
		const qs = params.toString();
		return `/company/service-report${qs ? `?${qs}` : ''}`;
	})();
	function buildListingHref(
		currentCompanyId: string | null,
		currentCompanyName: string | null,
		currentCompanyStatus: string | null,
		currentFromDate: string | null,
		currentToDate: string | null
	): string {
		const params = new URLSearchParams();
		if (currentCompanyId) params.set('companyId', currentCompanyId);
		if (currentCompanyName) params.set('name', currentCompanyName);
		if (currentCompanyStatus) params.set('status', currentCompanyStatus);
		if (currentFromDate) params.set('from_date', currentFromDate);
		if (currentToDate) params.set('to_date', currentToDate);
		const qs = params.toString();
		return `/company/company-services${qs ? `?${qs}` : ''}`;
	}

	//-- Map raw snake_case API response → camelCase ServiceDetail --
	function mapService(raw: any): ServiceDetail {
		return {
			id: raw.id,
			companyId: raw.company_id,
			name: raw.name,
			status: raw.status,
			ticketMode: raw.ticket_mode,
			registrationNumber: raw.registration_number,
			remark: raw.remark ?? null,
			startingAt: raw.starting_at,
			endingAt: raw.ending_at,
			startingLandmarkId: raw.starting_landmark_id,
			endingLandmarkId: raw.ending_landmark_id,
			createdOn: raw.created_on,
			updatedOn: raw.updated_on ?? null,
			route: (raw.route ?? []).map((r: any) => ({
				serviceId: r.service_id,
				landmarkId: r.landmark_id,
				arrivalAt: r.arrival_at,
				departureAt: r.departure_at,
				distanceFromStart: r.distance_from_start
			})),
			fare: {
				fareId: raw.fare?.fare_id,
				id: raw.fare?.id,
				name: raw.fare?.name,
				version: raw.fare?.version,
				function: raw.fare?.function,
				attributes: raw.fare?.attributes
			},
			vehicle: {
				id: raw.vehicle?.id,
				vehicleId: raw.vehicle?.vehicle_id,
				version: raw.vehicle?.version,
				registrationNumber: raw.vehicle?.registration_number,
				name: raw.vehicle?.name,
				capacity: raw.vehicle?.capacity
			}
		};
	}

	//-- Map raw snake_case API response → camelCase Landmark --
	function mapLandmark(raw: any): Landmark {
		return {
			id: String(raw.id),
			apiId: raw.id,
			name: raw.name,
			boundary: raw.boundary ?? '',
			type: String(raw.type ?? ''),
			createdAt: raw.created_on,
			updatedAt: raw.updated_on ?? undefined
		};
	}

	//-- Core function to load service details and associated landmarks --
	async function loadServiceDetail(id: number) {
		if (!id || isNaN(id)) {
			error = 'Invalid service ID.';
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			const raw = await fetchServiceDetail(id);
			service = mapService(raw);

			//-- Load duties for this service and sum their collection values (if present)
			try {
				const duties = await fetchDutyList({ service_id: id, limit: 100 });
				if (Array.isArray(duties)) {
					totalCollection = duties.reduce((acc: number, d: any) => {
						const v = Number(d.collection);
						return acc + (Number.isFinite(v) ? v : 0);
					}, 0);
				} else {
					totalCollection = 0;
				}
			} catch (e) {
				console.warn('Failed to load duties for collection sum:', e);
				totalCollection = null;
			}

			const landmarkIds = service.route.map((r: any) => r.landmarkId);
			if (landmarkIds.length > 0) {
				const rawLandmarks = await fetchLandmarkList({ id_list: landmarkIds });
				landmarks = rawLandmarks.map(mapLandmark);
			} else {
				landmarks = [];
			}
		} catch (err) {
			error = (err as Error).message;
			console.error('Failed to load service detail:', err);
		} finally {
			loading = false;
		}
	}

	$: if (serviceId !== loadedServiceId || (loading && (!serviceId || isNaN(serviceId)))) {
		loadedServiceId = serviceId;
		loadServiceDetail(serviceId);
	}

	//-- load operators for operator assignment dropdown --
	async function loadOperators(
		q?: string,
		limit = 10,
		offset = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const rawCompanyId = service?.companyId ?? (companyId ? Number(companyId) : null);
			const resolvedCompanyId =
				typeof rawCompanyId === 'number' && Number.isFinite(rawCompanyId)
					? rawCompanyId
					: undefined;

			if (resolvedCompanyId === undefined) return [];
			const result = await fetchOperatorAccount({
				search: q,
				limit,
				offset,
				status: 1,
				company_id: resolvedCompanyId
			});
			if (!Array.isArray(result)) return [];
			return result.map((v: any) => ({
				id: Number(v.id),
				name: String(v.full_name ?? v.username ?? `Operator #${v.id}`)
			}));
		} catch {
			return [];
		}
	}

	//-- assign operator to service --
	async function assignOperator(
		serviceId: number,
		operatorId: number
	): Promise<{ assignmentId: number }> {
		//-- Prefer company id from the loaded service; fall back to URL param --
		const rawCompanyId = service?.companyId ?? (companyId ? Number(companyId) : null);
		if (!rawCompanyId || !Number.isFinite(rawCompanyId)) {
			throw new Error('Company ID is missing or invalid. Please refresh and try again.');
		}
		try {
			const result = await createServiceAssignment({
				company_id: rawCompanyId,
				service_id: serviceId,
				operator_id: operatorId
			});
			const assignmentId = typeof result.id === 'number' ? result.id : Number(result.id);
			if (!Number.isFinite(assignmentId)) {
				throw new Error('createServiceAssignment returned an invalid assignment id.');
			}
			return { assignmentId };
		} catch (err) {
			console.error('Failed to assign operator:', err);
			throw err;
		}
	}

	//-- unassign operator from service (takes assignment record id, not operator id) --
	async function unassignOperator(assignmentId: number): Promise<void> {
		try {
			await deleteServiceAssignment(assignmentId);
		} catch (err) {
			console.error('Failed to unassign operator:', err);
			throw err;
		}
	}
	//-- fetch assigned operators for a service --
	async function fetchAssignedOperators(
		serviceId: number
	): Promise<Array<{ id: number; name: string; assignmentId: number }>> {
		try {
			const result = await fetchServiceAssignmentList({ service_id: serviceId });
			if (!Array.isArray(result)) return [];
			return result.map((v: any) => ({
				id: Number(v.operator_id),
				name: String(v.operator_name ?? v.name ?? `Operator #${v.operator_id}`),
				assignmentId: Number(v.id)
			}));
		} catch {
			return [];
		}
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel={referrer === 'report' ? 'Back to service report' : 'Back to services'}
				to={referrer === 'report' ? backToReportUrl : listingHref}
			/>

			<ListingPageHeader
				title="Service Detail"
				subtitle="Review the service schedule, route timeline, fare, and vehicle details."
				buttonLabel=""
				showButton={false}
			/>

			{#if loading}
				<div class="state-view">
					<div class="spinner-border text-primary" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
					<p>Loading service details…</p>
				</div>
			{:else if error}
				<div class="state-view error">
					<p>Failed to load: {error}</p>
					<button on:click={() => loadServiceDetail(serviceId)}>Retry</button>
				</div>
			{:else if service}
				<ServiceDetailPage
					{service}
					{landmarks}
					{totalCollection}
					{companyId}
					{companyName}
					{companyStatus}
					{referrerFromDate}
					{referrerToDate}
					isFromReport={referrer === 'report'}
					{loadOperators}
					{assignOperator}
					{unassignOperator}
					{fetchAssignedOperators}
					on:serviceUpdated={() => loadServiceDetail(serviceId)}
					on:serviceDeleted={() => goto(listingHref)}
				/>
			{:else}
				<div class="state-view">
					<p>Service not found.</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}

	.state-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 45vh;
		font-size: 14px;
		color: var(--text-muted);
	}

	.state-view.error {
		color: var(--error-color);
	}

	.state-view button {
		font-size: 13px;
		padding: 6px 16px;
		border: 1px solid var(--delete-btn);
		border-radius: 8px;
		background: var(--clear-btn-bg);
		color: var(--delete-btn);
		cursor: pointer;
	}

	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
</style>
