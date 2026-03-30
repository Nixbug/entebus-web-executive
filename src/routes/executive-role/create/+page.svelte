<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';
	import { createRole } from '$lib/services/executive-role';
	import toast from '$lib/utils/toast';
	import { handleApiError } from '$lib/utils/api-error';
	let isSubmitting = false;

	//-- Handle form submission for creating a new executive role --
	async function createExecutiveRole(e: CustomEvent<{ name: string; permissions: any }>) {
		const payload = { name: e.detail.name, permissions: e.detail.permissions };
		isSubmitting = true;
		try {
			await createRole(payload);
			toast.success('Role created successfully.');
			goto('/executive-role');
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
		goto('/executive-role');
	}
</script>

<HeaderBar />
<RoleForm
	permissionTree={executiveRolePermissionTree}
	on:save={createExecutiveRole}
	on:cancel={onCancel}
	isEditMode={false}
	{isSubmitting}
/>
