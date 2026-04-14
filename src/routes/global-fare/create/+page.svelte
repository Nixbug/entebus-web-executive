<script lang="ts">
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { createFare } from '$lib/services/dynamic-fare';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { canCreateFare } from '$lib/utils/permissions';

	let pageTitle = 'Create Global Fare';
	let pageDescription = 'Use this page to create a new global fare.';
	let isSubmitting = false;

	//-- Validate fare structure before API call --
	function validateFare(formData: any): { valid: boolean; error?: string } {
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
		if (!funcCode.includes('function getFare')) {
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

	//-- Handle form submission for creating a new global fare --
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
<FarePageTemplate {pageTitle} {pageDescription} on:create={handleCreate} {isSubmitting} />
