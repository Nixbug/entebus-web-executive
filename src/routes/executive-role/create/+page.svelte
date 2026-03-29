<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';
	import { createRole } from '$lib/services/executive-role';
	import toast from '$lib/utils/toast';

	let isSubmitting = false;

	async function onSave(e: CustomEvent<{ name: string; permissions: any }>) {
		const payload = { name: e.detail.name, permissions: e.detail.permissions };
		isSubmitting = true;
		try {
			await createRole(payload);
			toast.success('Role created successfully.');
			goto('/executive-role');
		} catch (err: any) {
			const msg = err?.message ?? String(err);
			toast.error(msg || 'Failed to create role.');
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
	on:save={onSave}
	on:cancel={onCancel}
	isEditMode={false}
/>
