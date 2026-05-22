<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ServiceDetailPage from '$lib/components/service-components/ServiceDetailPage.svelte';
	import { fetchRoute } from '$lib/services/route-landmarks';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { FARE_SCOPE_LABEL_BY_VALUE } from '$lib/constants';
	import type { FareScopeEnum } from '$lib/constants';
	import { fetchVehicleList } from '$lib/services/vehicle';
	import { createService } from '$lib/services/company-services';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { canCreateService } from '$lib/utils/permissions';
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;
	$: parsedCompanyId = companyId ? Number(companyId) : undefined;
	$: validCompanyId =
		typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
			? parsedCompanyId
			: undefined;

	//-- preserve original listing query params so we return to the same filtered listing --
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: fromDate = $page.url.searchParams.get('from_date');
	$: toDate = $page.url.searchParams.get('to_date');
	$: {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		if (fromDate) params.set('from_date', fromDate);
		if (toDate) params.set('to_date', toDate);
		const qs = params.toString();
		listingHref = `/company/company-services${qs ? `?${qs}` : ''}`;
	}
	let listingHref = '/company/company-services';

	let isSubmitting = false;

	//-- Async data loaders for ServiceDetailPage's dropdowns --
	async function loadRoutes(
		q?: string,
		limit = 10,
		offset = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchRoute({
				search: q,
				limit,
				offset,
				company_id: validCompanyId,
				status: 1
			});
			if (!Array.isArray(result)) return [];
			return result.map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
		} catch {
			return [];
		}
	}

	async function loadFares(
		q?: string,
		limit = 10,
		offset = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchFareList({ search: q, limit, offset, company_id: validCompanyId });
			if (!Array.isArray(result)) return [];
			return result.map((f: any) => {
				const id = Number(f.id);
				const rawName = f.name ?? '';
				const scopeValAny: any = f.scope;
				const scopeVal = (
					typeof scopeValAny === 'number' ? (scopeValAny as FareScopeEnum) : undefined
				) as FareScopeEnum | undefined;
				const scopeLabel =
					scopeVal !== undefined ? (FARE_SCOPE_LABEL_BY_VALUE[scopeVal] ?? 'Unknown') : '';
				const suffix = scopeLabel ? ` (${String(scopeLabel).toLowerCase()})` : '';
				return { id, name: `${String(rawName)}${suffix}` };
			});
		} catch {
			return [];
		}
	}

	async function loadVehicles(
		q?: string,
		limit = 10,
		offset = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchVehicleList({
				search: q,
				limit,
				offset,
				company_id: validCompanyId,
				status: 2
			});
			if (!Array.isArray(result)) return [];
			return result.map((v: any) => {
				const vehicleName = String(v.name);
				const regNumber = v.registration_number ? String(v.registration_number).trim() : '';
				const displayName = regNumber ? `${vehicleName}(${regNumber})` : vehicleName;
				return { id: Number(v.id || v.apiId), name: displayName };
			});
		} catch {
			return [];
		}
	}

	//-- Handle create event from ServiceCreatePanel --
	async function handleCreate(event: CustomEvent<{ payload: Record<string, any> }>) {
		if (!canCreateService()) {
			toast.error('You do not have permission to create a service.');
			return;
		}
		if (!validCompanyId) {
			toast.error('Missing company ID.');
			return;
		}

		isSubmitting = true;
		try {
			const { payload } = event.detail;
			await createService({
				company_id: validCompanyId,
				route_id: payload.route_id,
				fare_id: payload.fare_id,
				vehicle_id: payload.vehicle_id,
				name: payload.name || undefined,
				ticket_mode: payload.ticket_mode,
				starting_at: payload.starting_at
			});

			toast.success('Service created successfully.');
			goto(listingHref);
		} catch (err: any) {
			const message = await handleApiError(err);
			if (message === 'Invalid starting_at is provided')
				toast.error(
					'Service starting time must be within the next 24 hours and cannot be in the past.'
				);
			else toast.error(message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	{#if isSubmitting}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width:3rem;height:3rem;">
				<span class="visually-hidden">Loading…</span>
			</div>
		</div>
	{/if}

	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>

		<main class="container-xl py-5 page-wrapper">
			<HomeButton icon="bi bi-arrow-left" ariaLabel="Back" to={listingHref} preserveQuery={false} />

			<ServiceDetailPage
				mode="create"
				{loadRoutes}
				{loadFares}
				{loadVehicles}
				on:create={handleCreate}
			/>
		</main>
	</div>
</div>

<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}

	.spinner-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
</style>
