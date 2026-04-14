<script lang="ts">
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { createFare } from '$lib/services/dynamic-fare';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';

	let pageTitle = 'Create Global Fare';
	let pageDescription = 'Use this page to create a new global fare.';

	let isSubmitting = false;

	//-- Handle form submission for creating a new global fare --
	async function handleCreate(e: CustomEvent) {
		if (isSubmitting) return;
		const formData = e.detail;
		const payload = {
			scope: 1 as const, //-- 1 indicates global fare --
			name: formData.name,
			attributes: formData.attributes,
			function: formData.function
		};
		isSubmitting = true;
		try {
			await createFare(payload);
			toast.success('Global fare created successfully.');
			goto('/global-fare');
		} catch (err: any) {
			const message = await handleApiError(err);
			if (err.status === 409) {
				toast.error('Global fare name already exists. Please choose a different name.');
			} else {
				toast.error(message || 'Failed to create global fare.');
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<HeaderBar />
<FarePageTemplate {pageTitle} {pageDescription} on:create={handleCreate} isSubmitting={isSubmitting} />
