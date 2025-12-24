<script lang="ts">
	import PermissionNode from './PermissionNode.svelte';
	import { buildState } from '$lib/role-permissions/build-state';
	import { writable, type Writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PermissionNodeData } from '$lib/role-permissions/build-state';
	import { deepMerge, deepClone } from '$lib/role-permissions/permission-utils';
	export let permissionTree: PermissionNodeData[] = [];
	export let initialName: string = '';
	export let initialPermissions: any = undefined;
	export let readOnly: boolean = false;
	export let showDelete: boolean = false;
	export let showSave: boolean = false;
	export let isEditMode: boolean = false;

	const dispatch = createEventDispatcher();

	let roleName = initialName;

	//-- Always merge loaded permissions with a fresh state from the tree --
	const permissions: Writable<any> = writable(
		deepClone(
			initialPermissions !== undefined
				? deepMerge(buildState(permissionTree), initialPermissions)
				: buildState(permissionTree)
		)
	);

	//-- Compute total enabled permissions whenever state changes --
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

	let enabledPermissionsCount = 0;

	//-- Track last emitted state for change detection --
	let lastEmitted = {
		name: initialName,
		permissions: structuredClone(
			initialPermissions !== undefined ? initialPermissions : buildState(permissionTree)
		)
	};

	permissions.subscribe((s) => {
		enabledPermissionsCount = countEnabledPermissions(s);
		//-- Emit change event if permissions changed --
		if (
			JSON.stringify(s) !== JSON.stringify(lastEmitted.permissions) ||
			roleName !== lastEmitted.name
		) {
			lastEmitted = { name: roleName, permissions: structuredClone(s) };
			dispatch('change', { name: roleName, permissions: structuredClone(s) });
		}
	});

	//-- Watch for name changes --
	$: if (roleName !== lastEmitted.name) {
		lastEmitted = { name: roleName, permissions: structuredClone($permissions) };
		dispatch('change', { name: roleName, permissions: structuredClone($permissions) });
	}

	//-- Submit role data --
	function submit() {
		let snapshot: any;
		permissions.subscribe((s) => (snapshot = structuredClone(s)))();
		dispatch('save', { name: roleName, permissions: snapshot });
		console.log({ name: roleName, permissions: snapshot });
	}

	//-- Cancel role creation --
	function cancel() {
		dispatch('cancel');
	}

	//-- Reset permissions to initial state --
	function resetAll() {
		permissions.set(buildState(permissionTree));
	}

	//-- Navigate back to listing page --
	function gotoListingPage() {
		goto('/executive-role');
	}
</script>

<div class="role-create container-fluid py-3">
	<div class="content-wrap mt-5 mx-auto">
		<div class="header mb-3 content-inset">
			<div class="title-row d-flex align-items-start justify-content-between">
				<div class="d-flex flex-column align-items-start gap-2">
					<button
						class="btn p-0 back-btn"
						aria-label="Go back"
						title="Back"
						on:click={gotoListingPage}
					>
						<i class="bi bi-arrow-left back-icon"></i>
					</button>
					<div>
						<h3 class="fw-inter-700">
							{#if isEditMode}
								Edit Role
							{:else}
								Create New Role
							{/if}
						</h3>
						<h6 class="fw-inter-400">
							{#if isEditMode}
								Update role name and permissions
							{:else}
								Define role name and select permissions
							{/if}
						</h6>
					</div>
				</div>
			</div>
		</div>
		<div class="field-card p-4">
			<label for="roleName" class="form-label">Role Name</label>
			<input
				class="form-control"
				type="text"
				id="roleName"
				required
				bind:value={roleName}
				placeholder="Enter role name"
			/>
		</div>
		<div class="field-card permissions-panel p-4">
			<div class="d-flex align-items-center justify-content-between mb-1">
				<h5 class="mb-0 ml-1">Permissions</h5>
				{#if !readOnly}
					<button
						class="btn btn-link p-0 reset-btn"
						aria-label="Reset permissions"
						title="Reset permissions"
						on:click={resetAll}
					>
						<i class="bi bi-arrow-clockwise text-primary fs-4"></i>
					</button>
				{/if}
			</div>
			<div class="small mb-3">{enabledPermissionsCount} permissions enabled</div>
			<div class="permission-tree">
				{#each permissionTree as module (module.id)}
					<PermissionNode
						node={module}
						state={permissions}
						path={[]}
						{enabledPermissionsCount}
						readonly={readOnly}
					/>
				{/each}
			</div>
		</div>
		<div class="action-buttons content-inset d-flex justify-content-end gap-2">
			{#if showDelete}
				<button class="btn btn-outline-danger" on:click={() => dispatch('delete', { id: 'role' })}
					>Delete Role</button
				>
			{/if}
			{#if showSave || !isEditMode}
				<button class="btn cancel-btn" on:click={cancel}>Cancel</button>
				<button class="btn btn-primary" on:click={submit}
					>{isEditMode ? 'Save Changes' : 'Create Role'}</button
				>
			{/if}
		</div>
	</div>
</div>

<!-- Styles -->
<style>
	.role-create {
		background-color: var(--bg-primary);
		color: var(--text-primary);
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
		overflow: visible;
	}

	.permission-tree {
		margin-left: 0;
	}

	.back-btn {
		width: 35px;
		height: 35px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		border: 1px solid var(--border);
	}

	.back-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
		outline: rgb(27, 126, 207) solid 2px;
	}

	.back-icon {
		font-size: 1.5rem;
		color: var(--text-muted);
	}
	.back-icon:hover {
		color: rgb(27, 126, 207);
	}

	.content-inset {
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.reset-btn {
		border-radius: 8px;
		padding: 6px;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.reset-btn:hover {
		background-color: color-mix(in oklab, var(--color-primary) 10%, transparent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.reset-btn:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.reset-btn:active {
		transform: scale(0.95);
	}
	.cancel-btn {
		background-color: var(--clear-btn-bg);
		border: 1px solid var(--error-color);
		color: var(--error-color);
	}

	@keyframes spin-once {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.reset-btn:active .bi-arrow-clockwise {
		animation: spin-once 350ms ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.reset-btn {
			transition: none;
		}
		.reset-btn:active .bi-arrow-clockwise {
			animation: none;
		}
	}

	.action-buttons {
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}
	@media (max-width: 768px) {
		.content-wrap {
			padding-bottom: 80px;
		}

		.action-buttons {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			padding: 12px;
			background: var(--bg-card);
			border-top: 1px solid var(--border);
		}

		.action-buttons .btn {
			flex: 1 1 50%;
		}
	}

	.form-control {
		background-color: var(--bg-card);
		border-color: var(--border);
		color: var(--text-primary);
	}

	.form-control::placeholder {
		color: var(--text-muted);
	}

	.form-control:focus {
		background-color: var(--bg-card);
		border-color: var(--field-border);
		color: var(--text-primary);
	}
</style>
