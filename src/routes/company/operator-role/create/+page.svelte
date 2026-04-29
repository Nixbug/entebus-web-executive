<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createOperatorRole } from '$lib/services/operator-role';
	import toast from '$lib/utils/toast';
	import { handleApiError } from '$lib/utils/api-error';

	let isSubmitting = false;
	//-- Preserve all company context params so the back button returns to the correct filtered listing --
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		const qs = params.toString();
		listingHref = `/company/operator-role${qs ? `?${qs}` : ''}`;
	}
	let listingHref = '/company/operator-role';

	//-- Handle form submission for creating a new operator role --
	async function createOperatorRoleHandler(e: CustomEvent<{ name: string; permissions: any }>) {
		if (isSubmitting) return;
		const formData = e.detail;
		if (!companyId?.trim()) {
			toast.error('Invalid company selected. Please refresh the page and try again.');
			return;
		}
		const company_id = Number(companyId);
		if (!Number.isFinite(company_id) || company_id <= 0) {
			toast.error('Invalid company selected. Please refresh the page and try again.');
			return;
		}
		const payload = {
			company_id,
			name: formData.name,
			permissions: formData.permissions
		};
		isSubmitting = true;
		try {
			await createOperatorRole(payload);
			toast.success('Role created successfully.');
			goto(listingHref);
		} catch (err: any) {
			const message = await handleApiError(err);
			if (err.status === 409) {
				toast.error('Role name already exists. Please choose a different name.');
			} else {
				toast.error(message || 'Failed to create role.');
			}
		} finally {
			isSubmitting = false;
		}
	}

	function onCancel() {
		goto(listingHref);
	}
</script>

<HeaderBar />
<main>
	<RoleForm
		permissionTree={operatorRolePermissionTree}
		on:save={createOperatorRoleHandler}
		on:cancel={onCancel}
		isEditMode={false}
		{listingHref}
		{isSubmitting}
	/>
</main>

<style>
	:global(body) {
		background-color: var(--bg-primary);
	}

	main {
		min-height: 80vh;
		padding: 2rem 1rem;
		max-width: 1100px;
		margin: 0 auto;
	}
</style>
