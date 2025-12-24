<script lang="ts">
	import RoleCreate from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';

	function onSave(_e: any) {
		goto('/executive-role');
	}

	function onCancel() {
		goto('/executive-role');
	}
</script>

<HeaderBar />
<RoleCreate permissionTree={executiveRolePermissionTree} on:save={onSave} on:cancel={onCancel} />
