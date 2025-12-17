<script lang="ts">
	import RoleCreate from '$lib/permissions/RoleCreate.svelte';
	import { executiveRoles } from '$lib/dummy-data';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';

	const url = get(page).url;
	const id = url.searchParams.get('id');

	let role = id ? executiveRoles.find((r) => r.id === id) : undefined;

	function handleUpdate() {
		// Navigate to create/edit page with id (prefill could be added later)
		if (role) goto(`/executive-role/create?id=${encodeURIComponent(role.id)}`);
	}

	function handleDelete() {
		// Placeholder: implement deletion; navigate back to listing for now
		console.log('Delete role', role?.id);
		goto('/executive-role');
	}
</script>

{#if role}
	<RoleCreate
		readOnly={true}
		initialName={role.name}
		initialPermissions={role.permissions}
		on:update={handleUpdate}
		on:delete={handleDelete}
	/>
{:else}
	<div class="container-xl py-5" style="color: var(--text-primary);">
		<h4 class="mb-2">Role not found</h4>
		<p class="mb-4">We couldn't find a role for the requested id.</p>
		<button class="btn btn-light" on:click={() => goto('/executive-role')}>Back to Roles</button>
	</div>
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
