<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';

	function onSave() {
		goto('/executive-role');
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
