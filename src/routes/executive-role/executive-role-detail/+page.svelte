<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleCreate from '$lib/permissions/RoleCreate.svelte';
	import { executiveRoles } from '$lib/dummy-data';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
    import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	const url = get(page).url;
	const id = url.searchParams.get('id');
	let showDeleteModal = false;

	let role = id ? executiveRoles.find((r) => r.id === id) : undefined;
	let isEditing = false;
	let componentKey = 0;

	// Track current working values for inline edit mode
	let currentName = role?.name ?? '';
	let currentPermissions = role?.permissions;

	function handleUpdate() {
		// Enable inline edit mode
		isEditing = true;
	}

	function handleDelete() {
		showDeleteModal = true;
	}

	function handleCancel() {
		// Revert to original values and exit edit mode
		currentName = role?.name ?? '';
		currentPermissions = role?.permissions;
		isEditing = false;
		// Force RoleCreate to remount and reset internal state
		componentKey += 1;
	}

	function handleSave(e: CustomEvent<{ name: string; permissions: any }>) {
		const { name, permissions } = e.detail;
		// Update role with new values and exit edit mode
		if (role) {
			role.name = name;
			role.permissions = permissions;
		}
		currentName = name;
		currentPermissions = permissions;
		isEditing = false;

		// Log confirmed updated data
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
			permissions,
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
</script>

<HeaderBar/>
{#if role}
	{#key componentKey}
		<RoleCreate
			readOnly={!isEditing}
			isEdit={isEditing}
			initialName={currentName}
			initialPermissions={currentPermissions}
			on:update={handleUpdate}
			on:delete={handleDelete}
			on:cancel={handleCancel}
			on:save={handleSave}
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
		name={role?.name }
		onCancel={handleDeleteCancel}
		onConfirm={handleDeleteConfirm}
	/>
{/if}
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
