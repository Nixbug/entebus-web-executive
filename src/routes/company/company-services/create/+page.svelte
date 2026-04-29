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

	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;
	$: parsedCompanyId = companyId ? Number(companyId) : undefined;
	$: validCompanyId =
		typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
			? parsedCompanyId
			: undefined;

	let isSubmitting = false;

	// ── Loader functions passed to ServiceCreatePanel ──

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
			return result.map((v: any) => ({ id: Number(v.id || v.apiId), name: String(v.name) }));
		} catch {
			return [];
		}
	}

	// ── Handle create event from ServiceCreatePanel ──
	async function handleCreate(event: CustomEvent<{ payload: Record<string, any> }>) {
		if (!validCompanyId) {
			toast.error('Missing company ID.');
			return;
		}

		isSubmitting = true;
		try {
			const { payload } = event.detail;
			console.log('Creating service with payload:', payload);
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
			goto(`/company/company-services?companyId=${validCompanyId}`);
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
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel="Back"
				to="/company/company-services"
				preserveQuery={true}
			/>

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
