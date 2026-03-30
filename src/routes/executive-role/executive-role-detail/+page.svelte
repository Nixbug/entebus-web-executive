<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { executiveRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import { fetchRoleById, deleteRole, updateRole, type Role } from '$lib/services/executive-role';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onDestroy } from 'svelte';
	import { canDeleteExecutiveRole, canUpdateExecutiveRole } from '$lib/utils/permissions';

	let showDeleteModal = false;
	let role: Role | undefined;
	let loading = false;
	let isSaving = false;
	let loadError: string | null = null;

	//-- Utility to parse and validate role id from query params --
	function parseRoleId(rawId: string | null): number | null {
		if (!rawId) return null;
		const numeric = Number(rawId);
		return Number.isNaN(numeric) ? null : numeric;
	}

	//-- Load role by id --
	async function loadRoleById(rawId: string | null) {
		const roleId = parseRoleId(rawId);
		if (roleId === null) {
			role = undefined;
			loadError = rawId ? 'Invalid role id' : null;
			return;
		}

		loading = true;
		loadError = null;
		try {
			const fetched = await fetchRoleById(roleId);
			role = fetched ?? undefined;
			if (!role) loadError = 'Role not found';
		} catch (e: any) {
			role = undefined;
			const message = await handleApiError(e);
			loadError = message || 'Failed to fetch role.';
			toast.error(loadError);
		} finally {
			loading = false;
		}
	}

	//-- Initial load based on current URL --
	const unsub = page.subscribe(async ($p) => {
		await loadRoleById($p.url.searchParams.get('id'));
	});

	//-- Cleanup subscription on component destroy --
	onDestroy(() => unsub());

	//-- Key to force RoleForm remount when role changes --
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

	async function handleUpdateRole(e: CustomEvent<{ name: string; permissions: any }>) {
		if (!role?.id) return;
		isSaving = true;
		const { name, permissions } = e.detail;
		try {
			const payload = { name, permissions };
			await updateRole(role.id, payload);
			role = { ...role, name, permissions };
			currentName = name;
			currentPermissions = permissions;
			originalName = name;
			originalPermissions = permissions;
			hasChanges = false;
			toast.success('Role updated successfully.');
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to update role.');
		} finally {
			isSaving = false;
		}
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	async function handleDeleteConfirm() {
		if (!role?.id) {
			showDeleteModal = false;
			return;
		}

		loading = true;
		try {
			await deleteRole(role.id);
			toast.success('Role deleted successfully.');
			showDeleteModal = false;
			goto('/executive-role');
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to delete role.');
		} finally {
			loading = false;
		}
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
	{#if loading}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if role}
		{#key componentKey}
			<RoleForm
				permissionTree={executiveRolePermissionTree}
				initialName={currentName}
				initialPermissions={currentPermissions}
				roleId={role?.id?.toString()}
				isSubmitting={loading || isSaving}
				on:delete={handleDelete}
				on:cancel={handleCancel}
				on:save={handleUpdateRole}
				on:change={handleRoleFormChange}
				showDelete={!hasChanges}
				showSave={hasChanges}
				isEditMode={true}
				hasDeletePermission={canDeleteExecutiveRole()}
				hasUpdatePermission={canUpdateExecutiveRole()}
			/>
		{/key}
	{:else}
		<div class="empty-state card text-center p-4">
			<h4 class="mb-3">Role not found</h4>
			<p class="mb-4">
				We couldn't find a role for the requested id. It may have been removed, or the link is
				invalid.
			</p>
			<button class="btn btn-primary" on:click={() => goto('/executive-role')}
				>Back to Role List</button
			>
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
		{loading}
	/>
{/if}

<!-- Styles -->
<style>
	:global(body) {
		background-color: var(--bg-primary);
	}

	main {
		min-height: 80vh;
		padding: 2rem 1rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	.spinner-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(10, 10, 10, 0.35);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-state {
		max-width: 520px;
		margin: 1.5rem auto;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 1rem;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
	}

	.empty-state h4 {
		color: var(--text-primary);
	}

	.empty-state p {
		color: var(--text-muted);
	}

	.btn-primary {
		background-color: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	@media (max-width: 768px) {
		main {
			padding: 1.25rem;
		}

		.empty-state {
			padding: 1.25rem;
			margin: 1rem auto;
		}
	}
</style>
