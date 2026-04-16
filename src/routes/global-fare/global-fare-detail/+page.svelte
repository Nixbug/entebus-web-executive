<script lang="ts">
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { fetchFareById } from '$lib/services/dynamic-fare';
	import type { Fare } from '$lib/types/type';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { canDeleteFare, canUpdateFare } from '$lib/utils/permissions';
	import { updateFare, deleteFare } from '$lib/services/dynamic-fare';

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
	function mapFareSchemaToFare(schema: any): Fare {
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

	//-- Validate fare structure before API call --
	function validateFare(formData: any): { valid: boolean; error?: string } {
		if (!formData) return { valid: false, error: 'Missing fare data.' };
		//-- Validate ticket types --
		if (!formData.attributes?.ticket_types || formData.attributes.ticket_types.length === 0) {
			return { valid: false, error: 'At least one ticket type is required.' };
		}

		//-- Validate function code --
		const funcCode = formData.function || '';
		if (!funcCode.trim()) {
			return { valid: false, error: 'Fare calculation function is required.' };
		}

		//-- Check if function contains "getFare" --
		if (!/function\s+getFare\s*\(/.test(funcCode)) {
			return { valid: false, error: 'Function must be named "getFare".' };
		}

		//-- Validate JavaScript syntax --
		try {
			new Function(funcCode);
		} catch (e: any) {
			return {
				valid: false,
				error: `Invalid JavaScript syntax: ${e.message || 'Please check your function code.'}`
			};
		}

		return { valid: true };
	}

	//-- Update fare --
	async function handleUpdate(arg: any) {
		const detail: any = arg?.detail ?? arg ?? {};
		if (!canUpdateFare()) {
			toast.error('You do not have permission to update fares.');
			return Promise.reject(new Error('no-permission'));
		}
		//-- Validate before API call --
		const validation = validateFare(detail);
		if (!validation.valid) {
			toast.error(validation.error || 'Fare validation failed.');
			return Promise.reject(new Error('validation-failed'));
		}
		const apiId = Number(detail.apiId ?? detail.id ?? selectedFare?.apiId);
		if (!apiId) {
			toast.error('Invalid fare id.');
			return Promise.reject(new Error('invalid-id'));
		}
		const payload = {
			name: detail.name,
			function: detail.function,
			attributes: detail.attributes
		};
		console.log('Updating fare with payload:', payload);
		try {
			await updateFare(apiId, payload as any);
			toast.success('Fare updated successfully.');
			goto('/global-fare');
			return Promise.resolve(true);
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to update fare.');
			return Promise.reject(err);
		}
	}

	//-- Delete fare --
	async function handleDelete(apiId?: number) {
		if (!canDeleteFare()) {
			toast.error('You do not have permission to delete fares.');
			return Promise.reject(new Error('no-permission'));
		}
		const id = Number(apiId ?? selectedFare?.apiId);
		if (!id) {
			toast.error('Invalid fare id.');
			return Promise.reject(new Error('invalid-id'));
		}
		try {
			await deleteFare(id);
			toast.success('Fare deleted successfully.');
			goto('/global-fare');
			return Promise.resolve(true);
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to delete fare.');
			return Promise.reject(err);
		}
	}
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
		on:update={handleUpdate}
		deleteHandler={handleDelete}
		updateHandler={handleUpdate}
	/>
{:else}
	<div style="padding:2rem;color:var(--text-primary);">
		<h5>No fare found</h5>
		<p style="color:var(--text-muted)">
			{loadError || 'Requested fare not found or missing `id` query parameter.'}
		</p>
	</div>
{/if}
