<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';

	function onSave() {
		goto('/company-operator-role');
	}

	function onCancel() {
		goto('/company-operator-role');
	}
</script>

<HeaderBar />
<RoleForm
	permissionTree={operatorRolePermissionTree}
	on:save={onSave}
	on:cancel={onCancel}
	isEditMode={false}
/>
