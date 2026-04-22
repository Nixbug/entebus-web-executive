<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createFare } from '$lib/services/dynamic-fare';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { canCreateFare } from '$lib/utils/permissions';
	import { FARE_SCOPE } from '$lib/constants';
	import { validateFare } from '$lib/schemas';

	let pageTitle = 'Create Local Fare';
	let pageDescription = 'Use this page to create a new local fare.';
	let isSubmitting = false;
	//-- Preserve company context so the back button returns to the correct filtered listing --
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		const qs = params.toString();
		listingHref = `/company/local-fare${qs ? `?${qs}` : ''}`;
	}
	let listingHref = '/company/local-fare';

	//-- Handle form submission for creating a new local fare --
	async function handleCreate(e: CustomEvent) {
		if (isSubmitting) return;
		if (!canCreateFare()) {
			toast.error('You do not have permission to create fares.');
			return;
		}
		const formData = e.detail;
		//-- Validate before API call --
		const validation = validateFare(formData);
		if (!validation.valid) {
			toast.error(validation.error || 'Fare validation failed.');
			return;
		}
		const company_id = Number(companyId);
		if (!Number.isFinite(company_id) || company_id <= 0) {
			toast.error('Invalid company selected. Please refresh the page and try again.');
			return;
		}
		const payload = {
			scope: FARE_SCOPE.LOCAL,
			company_id: company_id,
			name: formData.name,
			attributes: formData.attributes,
			function: formData.function
		};
		isSubmitting = true;
		try {
			await createFare(payload);
			toast.success('Local fare created successfully.');
			goto(listingHref);
		} catch (err: any) {
			const message = await handleApiError(err);
			if (err.status === 409) {
				toast.error('Local fare name already exists. Please choose a different name.');
			} else {
				toast.error(message || 'Failed to create local fare.');
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<HeaderBar />
<FarePageTemplate
	{pageTitle}
	{pageDescription}
	on:create={handleCreate}
	{listingHref}
	{isSubmitting}
/>
