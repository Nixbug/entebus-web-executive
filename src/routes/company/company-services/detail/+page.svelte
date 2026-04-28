<script lang="ts">
	import ServiceDetailPage from '$lib/components/service-components/ServiceDetailPage.svelte';
	import type { ServiceDetail, Landmark } from '$lib/types/type';
	import { fetchServiceDetail } from '$lib/services/company-services';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
    import HeaderBar from '$lib/components/HeaderBar.svelte';

	let service: ServiceDetail | null = null;
	let landmarks: Landmark[] = [];
	let loading = true;
	let error: string | null = null;

	// ── Map raw snake_case API response → camelCase ServiceDetail ──
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
				name: raw.vehicle?.name
			}
		};
	}

	// ── Map raw snake_case API response → camelCase Landmark ──
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

	async function loadServiceDetail(id: number) {
		loading = true;
		error = null;
		try {
			const raw = await fetchServiceDetail(id);
			service = mapService(raw);

			const landmarkIds = raw.route.map((r: any) => r.landmark_id);
			const rawLandmarks = await fetchLandmarkList({ id_list: landmarkIds });
			landmarks = rawLandmarks.map(mapLandmark);
		} catch (err) {
			error = (err as Error).message;
			console.error('Failed to load service detail:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const serviceId = Number($page.params.id ?? 3);
		loadServiceDetail(serviceId);
	});
</script>
<HeaderBar />
{#if loading}
	<div class="state-view">
		<p>Loading service details…</p>
	</div>
{:else if error}
	<div class="state-view error">
		<p>Failed to load: {error}</p>
		<button on:click={() => loadServiceDetail(Number($page.params.id ?? 1))}>Retry</button>
	</div>
{:else if service}
	<ServiceDetailPage {service} {landmarks} />
{:else}
	<div class="state-view">
		<p>Service not found.</p>
	</div>
{/if}

<style>
	.state-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 100vh;
		font-size: 14px;
		color: var(--color-text-muted, #888);
	}

	.state-view.error {
		color: #a32d2d;
	}

	.state-view button {
		font-size: 13px;
		padding: 6px 16px;
		border: 0.5px solid rgba(163, 45, 45, 0.3);
		border-radius: 8px;
		background: #fcebeb;
		color: #a32d2d;
		cursor: pointer;
	}
</style>