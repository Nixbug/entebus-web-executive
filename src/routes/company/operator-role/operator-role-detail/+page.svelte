<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import { operatorRoles } from '$lib/dummy-data';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';

	//-- Use the reactive `$page` store so `id` and `role` update if the URL changes --

	$: id = $page.url.searchParams.get('id');
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
	let showDeleteModal = false;

	$: role = id ? operatorRoles.find((r) => r.id === id) : undefined;
	let componentKey = 0;

	//-- Track current working values --
	let currentName = role?.name ?? '';
	let currentPermissions = role?.permissions;

	//-- Track if any changes have been made --
	let hasChanges = false;

	//-- Track original values for comparison --
	let originalName = role?.name ?? '';
	let originalPermissions = role?.permissions;

	//-- No first-change sentinel: compare incoming values directly to originals --

	//-- Update form state when role changes --
	$: if (role) {
		currentName = role.name ?? '';
		//-- deep-clone permissions so local edits don't mutate the shared role object directly --
		currentPermissions = role.permissions ? structuredClone(role.permissions) : undefined;
		originalName = role.name ?? '';
		originalPermissions = role.permissions ? structuredClone(role.permissions) : undefined;
		componentKey += 1;
	} else {
		//-- Clear form state when no role is selected --
		currentName = '';
		currentPermissions = undefined;
		originalName = '';
		originalPermissions = undefined;
	}

	function handleDelete() {
		showDeleteModal = true;
	}

	//-- cancel handler to revert changes --
	function handleCancel() {
		//-- Revert to original values and reset change state --
		currentName = originalName;
		currentPermissions = originalPermissions;
		hasChanges = false;
		componentKey += 1;
	}

	function handleUpdateRole(e: CustomEvent<{ name: string; permissions: any }>) {
		const { name, permissions } = e.detail;
		if (role) {
			const i = operatorRoles.findIndex((r) => r.id === role?.id);
			if (i === -1) return;
			//-- Create a new array to avoid mutating the imported dummy data --
			//-- In production, this would be replaced with an API call --
			const updatedRoles = [...operatorRoles];
			updatedRoles[i] = { ...updatedRoles[i], name, permissions };
			role = updatedRoles[i];
		}
		currentName = name;
		currentPermissions = permissions;
		originalName = name;
		originalPermissions = permissions;
		hasChanges = false;
		console.log('Confirmed role update:', { name, permissions });
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	function handleDeleteConfirm() {
		if (role?.id) {
			console.log('Deleted role id:', role.id);
		}
		showDeleteModal = false;
		goto(listingHref);
	}

	//-- Handler for detecting changes from RoleForm --
	function handleRoleFormChange(e: CustomEvent<{ name: string; permissions: any }>) {
		const nameChanged = e.detail.name !== originalName;
		const permsChanged =
			JSON.stringify(e.detail.permissions) !== JSON.stringify(originalPermissions);

		hasChanges = nameChanged || permsChanged;
		currentName = e.detail.name;
		currentPermissions = e.detail.permissions;
	}
</script>

<HeaderBar />
<main>
	{#if role}
		{#key componentKey}
			<RoleForm
				permissionTree={operatorRolePermissionTree}
				initialName={currentName}
				initialPermissions={currentPermissions}
				roleId={role?.id}
				on:delete={handleDelete}
				on:cancel={handleCancel}
				on:save={handleUpdateRole}
				on:change={handleRoleFormChange}
				showDelete={!hasChanges}
				showSave={hasChanges}
				isEditMode={true}
				{listingHref}
			/>
		{/key}
	{:else}
		<div
			class="d-flex flex-column min-vh-100 align-items-center container-xl py-5"
			style="color: var(--text-primary);"
		>
			<h4 class="mb-2">Role not found</h4>
			<p class="mb-4">We couldn't find a role for the requested id.</p>
			<button class="btn btn-light" on:click={() => goto(listingHref)}>Back to Roles</button>
		</div>
	{/if}
</main>
{#if showDeleteModal}
	<DeleteConfirmationModal
		id={role?.id}
		name={role?.name}
		onCancel={handleDeleteCancel}
		onConfirm={handleDeleteConfirm}
		sectionName="Role"
	/>
{/if}

<!-- Styles -->
<style>
	:global(body) {
		background-color: var(--bg-primary);
	}
	.container-xl {
		min-height: 80vh;
	}
	button.btn-light {
		border: 1px solid var(--border);
	}
</style>
