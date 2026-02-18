<script lang="ts">
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

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

	function onSave() {
		goto(listingHref);
	}

	function onCancel() {
		goto(listingHref);
	}
</script>

<HeaderBar />
<RoleForm
	permissionTree={operatorRolePermissionTree}
	on:save={onSave}
	on:cancel={onCancel}
	isEditMode={false}
	{listingHref}
/>
