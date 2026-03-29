<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import { fetchRoleById, type Role } from '$lib/services/executive-role';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';

	//-- Use the reactive `$page` store so `id` and `role` update if the URL changes --

	$: id = $page.url.searchParams.get('id');
	let showDeleteModal = false;

	let role: Role | undefined;
	let loading = false;
	let loadError: string | null = null;

	// fetch role when id changes
	import { onDestroy } from 'svelte';
	const unsub = page.subscribe(async ($p) => {
		const iid = $p.url.searchParams.get('id');
		if (!iid) {
			role = undefined;
			return;
		}
		// try parse numeric id, also handle 'EXE-<id>' formats
		let n = Number(iid);
		if (Number.isNaN(n)) {
			const m = iid.match(/(\d+)$/);
			n = m ? Number(m[1]) : NaN;
		}
		if (Number.isNaN(n)) {
			role = undefined;
			loadError = 'Invalid role id';
			return;
		}
		loading = true;
		loadError = null;
		try {
			const fetched = await fetchRoleById(n);
			role = fetched ?? undefined;
			if (!role) loadError = 'Role not found';
		} catch (e: any) {
			role = undefined;
			loadError = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	});
	onDestroy(() => unsub());
	let componentKey = 0;

	//-- Track current working values --
	let currentName = '';
	let currentPermissions: any = undefined;

	//-- Track if any changes have been made --
	let hasChanges = false;

	//-- Track original values for comparison --
	let originalName = role?.name ?? '';
	let originalPermissions = role?.permissions;

	//-- No first-change sentinel: compare incoming values directly to originals --

	//-- Update form state when role changes --
	$: if (role) {
		currentName = role.name ?? '';
		currentPermissions = role.permissions ? structuredClone(role.permissions) : undefined;
		originalName = role.name ?? '';
		originalPermissions = role.permissions ? structuredClone(role.permissions) : undefined;
		componentKey += 1;
	} else {
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
				permissionTree={executiveRolePermissionTree}
				initialName={currentName}
				initialPermissions={currentPermissions}
				roleId={role?.id?.toString()}
				on:delete={handleDelete}
				on:cancel={handleCancel}
				on:save={handleUpdateRole}
				on:change={handleRoleFormChange}
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
</main>
{#if showDeleteModal}
	<DeleteConfirmationModal
		id={role?.id?.toString()}
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
