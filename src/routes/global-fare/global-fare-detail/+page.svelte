<script lang="ts">
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { fetchFareById, type FareSchema } from '$lib/services/dynamic-fare';
	import type { Fare } from '$lib/types/type';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';

	let pageTitle = 'Global Fare Detail';
	let pageDescription =
		'Use this page to review, update, or delete the configuration of this global fare template.';

	let selectedFare: Fare | null = null;
	let isLoading = false;
	let loadError: string | null = null;
	let requestId = 0;

	//-- Utility to parse and validate fare id from query params --
	function parseFareId(rawId: string | null): number | null {
		if (!rawId) return null;
		const trimmed = rawId.trim();
		if (!/^\d+$/.test(trimmed)) return null;
		const numeric = Number(trimmed);
		return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
	}

	//-- Map API FareSchema to UI Fare type --
	function mapFareSchemaToFare(schema: FareSchema): Fare {
		return {
			id: `GFARE-${schema.id}`,
			apiId: schema.id,
			companyId: schema.company_id ? String(schema.company_id) : undefined,
			name: schema.name,
			version: schema.version,
			attributes: schema.attributes,
			function: schema.function,
			created_on: schema.created_on,
			updated_on: schema.updated_on ?? ''
		};
	}

	//-- Load fare by id --
	async function loadFareById(rawId: string | null) {
		const currentRequestId = ++requestId;
		const fareId = parseFareId(rawId);
		if (fareId === null) {
			selectedFare = null;
			loadError = rawId ? 'Invalid fare id' : null;
			isLoading = false;
			return;
		}
		isLoading = true;
		loadError = null;
		try {
			const fetched = await fetchFareById(fareId);
			if (currentRequestId !== requestId) return;
			selectedFare = fetched ? mapFareSchemaToFare(fetched) : null;
			if (!selectedFare) loadError = 'Fare not found';
		} catch (e: any) {
			if (currentRequestId !== requestId) return;
			selectedFare = null;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to load fare.');
			loadError = message || 'Failed to load fare.';
		} finally {
			if (currentRequestId === requestId) {
				isLoading = false;
			}
		}
	}

	//-- React to URL changes --
	const unsub = page.subscribe(async ($p) => {
		await loadFareById($p.url.searchParams.get('id'));
	});

	onDestroy(() => unsub());
</script>

<HeaderBar />
{#if isLoading}
	<div class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
		<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
			<span class="visually-hidden">Loading...</span>
		</div>
	</div>
{:else if selectedFare}
	<FarePageTemplate
		{pageTitle}
		{pageDescription}
		initialData={selectedFare}
		on:update={() => goto('/global-fare')}
		on:delete={() => goto('/global-fare')}
	/>
{:else}
	<div style="padding:2rem;color:var(--text-primary);">
		<h5>No fare found</h5>
		<p style="color:var(--text-muted)">
			{loadError || 'Requested fare not found or missing `id` query parameter.'}
		</p>
	</div>
{/if}
