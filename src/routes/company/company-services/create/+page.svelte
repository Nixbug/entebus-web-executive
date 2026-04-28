<script lang="ts">
	import { fetchRoute } from '$lib/services/route-landmarks';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { fetchVehicleList } from '$lib/services/vehicle';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { page } from '$app/stores';

	let companyId: string | null = null;
	$: companyId = $page.url.searchParams.get('companyId');

	function handleCreate(event: any) {
		// TODO: call API to create service. For now show a preview toast.
		toast.success('Create payload prepared');
		console.log('create payload', event.detail);
	}

	async function loadRoutes(
		q?: string,
		limit: number = 10,
		offset: number = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const parsedCompanyId = companyId ? Number(companyId) : undefined;
			const validCompanyId =
				typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
					? parsedCompanyId
					: undefined;

			const result = await fetchRoute({
				search: q,
				limit,
				offset,
				company_id: validCompanyId,
				status: 1 // Only show valid routes
			});
			if (!Array.isArray(result)) return [];

			return result
				.map((route: any) => ({
					id: Number(route.id || route.apiId),
					name: String(route.name)
				}))
				.slice(0, limit);
		} catch (err) {
			console.error('Failed to load routes:', err);
			return [];
		}
	}

	async function loadFare(
		q?: string,
		limit: number = 10,
		offset: number = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const parsedCompanyId = companyId ? Number(companyId) : undefined;
			const validCompanyId =
				typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
					? parsedCompanyId
					: undefined;

			const result = await fetchFareList({
				search: q,
				limit,
				offset,
				company_id: validCompanyId
			});
			if (!Array.isArray(result)) return [];

			return result
				.map((fare: any) => ({
					id: Number(fare.id || fare.apiId),
					name: String(fare.name)
				}))
				.slice(0, limit);
		} catch (err) {
			console.error('Failed to load fares:', err);
			return [];
		}
	}

	async function loadVehicle(
		q?: string,
		limit: number = 10,
		offset: number = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const parsedCompanyId = companyId ? Number(companyId) : undefined;
			const validCompanyId =
				typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
					? parsedCompanyId
					: undefined;

			const result = await fetchVehicleList({
				search: q,
				limit,
				offset,
				company_id: validCompanyId,
				status: 2 //-- Only show active vehicles --
			});
			if (!Array.isArray(result)) return [];

			return result
				.map((vehicle: any) => ({
					id: Number(vehicle.id || vehicle.apiId),
					name: String(vehicle.name)
				}))
				.slice(0, limit);
		} catch (err) {
			console.error('Failed to load vehicles:', err);
			return [];
		}
	}
</script>
