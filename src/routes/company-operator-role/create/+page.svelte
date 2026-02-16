<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';

	function onSave() {
		alert('form saved! (not really, this is just a demo)');
	}

	function onCancel() {
		alert('form cancelled! (not really, this is just a demo)');
	}
</script>

<HeaderBar />
<RoleForm
	permissionTree={operatorRolePermissionTree}
	on:save={onSave}
	on:cancel={onCancel}
	isEditMode={false}
/>
