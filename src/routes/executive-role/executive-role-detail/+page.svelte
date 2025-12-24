<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import { executiveRoles } from '$lib/dummy-data';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';

	const url = get(page).url;
	const id = url.searchParams.get('id');
	let showDeleteModal = false;

	let role = id ? executiveRoles.find((r) => r.id === id) : undefined;
	let componentKey = 0;

	//-- Track current working values --
	let currentName = role?.name ?? '';
	let currentPermissions = role?.permissions;

	//-- Track if any changes have been made --
	let hasChanges = false;

	//-- Track original values for comparison --
	let originalName = role?.name ?? '';
	let originalPermissions = role?.permissions;

	//-- Track if first change event has been handled
	let initialized = false;

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

	function handleSave(e: CustomEvent<{ name: string; permissions: any }>) {
		const { name, permissions } = e.detail;
		if (role) {
			role.name = name;
			role.permissions = permissions;
		}
		currentName = name;
		currentPermissions = permissions;
		originalName = name;
		originalPermissions = permissions;
		hasChanges = false;

		//-- Log confirmed updated data --
		function countEnabledPermissions(state: any): number {
			let count = 0;
			function walk(node: any) {
				if (!node || typeof node !== 'object') return;
				for (const key of Object.keys(node)) {
					const val = node[key];
					if (typeof val === 'boolean') {
						if (val) count += 1;
					} else if (typeof val === 'object') {
						walk(val);
					}
				}
			}
			walk(state);
			return count;
		}
		console.log('Confirmed role update:', {
			name,
			enabledPermissionsCount: countEnabledPermissions(permissions),
			permissions
		});
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	function handleDeleteConfirm() {
		if (role?.id) {
			console.log('Deleted role id:', role.id);
		}
		showDeleteModal = false;
	}

	//-- Handler for detecting changes from RoleForm --

	function handleChange(e: CustomEvent<{ name: string; permissions: any }>) {
		if (!initialized) {
			originalName = e.detail.name;
			originalPermissions = e.detail.permissions;
			hasChanges = false;
			initialized = true;
		} else {
			const nameChanged = e.detail.name !== originalName;
			const permsChanged =
				JSON.stringify(e.detail.permissions) !== JSON.stringify(originalPermissions);
			hasChanges = nameChanged || permsChanged;
		}
		currentName = e.detail.name;
		currentPermissions = e.detail.permissions;
	}
</script>

<HeaderBar />
{#if role}
	{#key componentKey}
		<RoleForm
			permissionTree={executiveRolePermissionTree}
			initialName={currentName}
			initialPermissions={currentPermissions}
			on:delete={handleDelete}
			on:cancel={handleCancel}
			on:save={handleSave}
			on:change={handleChange}
			showDelete={!hasChanges}
			showSave={hasChanges}
			isEditMode={true}
		/>
	{/key}
{:else}
	<div class="container-xl py-5" style="color: var(--text-primary);">
		<h4 class="mb-2">Role not found</h4>
		<p class="mb-4">We couldn't find a role for the requested id.</p>
		<button class="btn btn-light" on:click={() => goto('/executive-role')}>Back to Roles</button>
	</div>
{/if}
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
