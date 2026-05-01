<script lang="ts">
	import ServiceDetailPage from '$lib/components/service-components/ServiceDetailPage.svelte';
	import type { ServiceDetail, Landmark } from '$lib/types/type';
	import { fetchServiceDetail } from '$lib/services/company-services';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { page } from '$app/stores';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';

	let service: ServiceDetail | null = null;
	let landmarks: Landmark[] = [];
	let loading = true;
	let error: string | null = null;
	let loadedServiceId: number | null = null;

	$: serviceId = Number($page.url.searchParams.get('id'));
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: listingHref = buildListingHref(companyId, companyName, companyStatus);

	function buildListingHref(
		currentCompanyId: string | null,
		currentCompanyName: string | null,
		currentCompanyStatus: string | null
	): string {
		const params = new URLSearchParams();
		if (currentCompanyId) params.set('companyId', currentCompanyId);
		if (currentCompanyName) params.set('name', currentCompanyName);
		if (currentCompanyStatus) params.set('status', currentCompanyStatus);
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
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<HomeButton icon="bi bi-arrow-left" ariaLabel="Back to services" to={listingHref} />

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
				<ServiceDetailPage {service} {landmarks} {companyId} {companyName} {companyStatus} />
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
