<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import RoleForm from '$lib/components/role-permission-components/RoleForm.svelte';
	import { operatorRolePermissionTree } from '$lib/role-permissions/role-permission-tree';
	import { fetchOperatorRoleById, type OperatorRole } from '$lib/services/operator-role';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { onDestroy } from 'svelte';

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
	let role: OperatorRole | undefined;
	let isLoadingRole = false;
	let isDeletingRole = false;
	let isSaving = false;
	let loadError: string | null = null;
	let requestId = 0;

	//-- Utility to parse and validate role id from query params --
	function parseRoleId(rawId: string | null): number | null {
		if (!rawId) return null;
		const numeric = Number(rawId);
		return Number.isNaN(numeric) ? null : numeric;
	}
	//-- Load role by id --
	async function loadRoleById(rawId: string | null) {
		const currentRequestId = ++requestId;
		const roleId = parseRoleId(rawId);
		if (roleId === null) {
			role = undefined;
			loadError = rawId ? 'Invalid role id' : null;
			return;
		}
		isLoadingRole = true;
		loadError = null;
		try {
			const fetched = await fetchOperatorRoleById(roleId);
			if (currentRequestId !== requestId) return;
			role = fetched ?? undefined;
			if (!role) loadError = 'Role not found';
		} catch (e: any) {
			if (currentRequestId !== requestId) return;
			role = undefined;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch roles.');
		}
		isLoadingRole = false;
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
{#if isLoadingRole}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if role}
		{#key componentKey}
			<RoleForm
				permissionTree={operatorRolePermissionTree}
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
				{listingHref}
			/>
		{/key}
	{:else if loadError}
		<div class="empty-state card text-center p-4">
			<h4 class="mb-3">{loadError}</h4>
			{#if loadError === 'Role not found'}
				<p class="mb-4">We couldn't find a role for the requested id.</p>
			{:else if loadError === 'Invalid role id'}
				<p class="mb-4">The role id in the URL is invalid. Please check the link and try again.</p>
			{:else}
				<p class="mb-4">
					An error occurred while fetching the role. Please refresh or try again later.
				</p>
			{/if}
			<button class="btn btn-primary" on:click={() => goto('/executive-role')}
				>Back to Role List</button
			>
		</div>
	{:else}
		<div class="empty-state card text-center p-4">
			<h4 class="mb-3">Role not found</h4>
			<p class="mb-4">We couldn't find a role for the requested id.</p>
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
