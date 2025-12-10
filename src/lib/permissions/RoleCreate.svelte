<script lang="ts">
	import PermissionNode from './PermissionNode.svelte';
	import { permissionTree } from '$lib/permissions/permission-tree';
	import { buildState } from '$lib/permissions/build-state';
	import { writable, type Writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	export let initialName = '';
	export let initialPermissions = buildState(permissionTree);

	const dispatch = createEventDispatcher();

	let roleName = initialName;
	const permissions: Writable<any> = writable(structuredClone(initialPermissions));

	function submit() {
		let snapshot: any;
		permissions.subscribe((s) => (snapshot = structuredClone(s)))();
		dispatch('save', { name: roleName, permissions: snapshot });
	}

	function cancel() {
		dispatch('cancel');
	}

	function resetAll() {
		permissions.set(buildState(permissionTree));
	}
</script>

<div class="role-create container-fluid py-3">
	<div class="content-wrap mx-auto">
	<div class=" header d-flex align-items-center justify-content-between mb-3">
		<div>
			<h3 class="mb-1 fw-inter-700">Create New Role</h3>
			<h6 class="fw-inter-400">Define role name and select permissions</h6>
		</div>
		<div>
			<button class="btn btn-outline-secondary" on:click={resetAll}>Reset</button>
		</div>
	</div>

	<div class="mb-3">
		<input class="form-control" bind:value={roleName} placeholder="Enter role name" />
	</div>

	<div class="permissions-panel p-3 mb-4">
		<h5 class="mb-3">Permissions</h5>
		<div class="permission-tree">
			{#each permissionTree as module (module.id)}
				<PermissionNode node={module} state={permissions} path={[]} />
			{/each}
		</div>
	</div>

	<div class="d-flex gap-2">
		<button class="btn btn-light" on:click={cancel}>Cancel</button>
		<button class="btn btn-primary" on:click={submit}>Create Role</button>
	</div>
	</div>
</div>

<style>
	.role-create {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		min-height: 100vh;
	}

	.content-wrap {
		max-width: 900px;
		padding-left: 12px;
		padding-right: 12px;
	}

	.header h3 {
		color: var(--text-primary);
	}
	.header h6 {
		color: var(--text-muted);
	}

	.permissions-panel {
		border-radius: 8px;
		max-height: 400px;
		overflow-y: auto;
	}

	.permission-tree {
		margin-left: 8px;
	}
</style>
