<script lang="ts">
	import PermissionNode from './PermissionNode.svelte';
	import { buildState } from '$lib/role-permissions/build-state';
	import { writable, type Writable, get, derived } from 'svelte/store';
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { tick } from 'svelte';
	import type { PermissionNodeData } from '$lib/role-permissions/build-state';
	import { deepMerge, deepClone } from '$lib/role-permissions/permission-utils';
	import { roleNameSchema } from '$lib/schemas';
	import HomeButton from '../HomeButton.svelte';
	import { boolean } from 'zod';

	export let permissionTree: PermissionNodeData[] = [];
	export let initialName: string = '';
	export let initialPermissions: any = undefined;
	export let readOnly: boolean = false;
	export let showDelete: boolean = false;
	export let showSave: boolean = false;
	export let isEditMode: boolean = false;
	export let isSubmitting: boolean = false;
	export let roleId: string | undefined = undefined;
	export let listingHref: string = '/executive-role';
	export let hasDeletePermission: boolean = false;
	export let hasUpdatePermission: boolean = false;
	export let disabledDeleteTooltip: string = 'You do not have permission to delete this role.';
	export let disabledUpdateTooltip: string = 'You do not have permission to update this role.';

	const dispatch = createEventDispatcher();

	let roleName = initialName;
	let roleNameInput: HTMLInputElement | null = null;
	//-- Validation state for role name --
	let nameTouched = false;
	//-- ID for the role name validation message (used by aria-describedby) --
	const roleNameErrorId = `roleNameError-${Math.random().toString(36).slice(2, 9)}`;
	let nameIsValid = true;
	let nameError = '';

	//-- Computed aria-describedby value to avoid rendering 'undefined' --
	let ariaDescribedBy: string | undefined = undefined;
	$: ariaDescribedBy = nameTouched && !nameIsValid ? roleNameErrorId : undefined;

	$: {
		const value = typeof roleName === 'string' ? roleName.trim() : '';
		const res = roleNameSchema.safeParse(value);
		nameIsValid = res.success;
		nameError = res.success ? '' : (res.error.issues[0]?.message ?? 'Invalid name');
	}

	//-- Always merge loaded permissions with a fresh state from the tree --
	const mergedInitialPermissions =
		initialPermissions !== undefined
			? deepMerge(buildState(permissionTree), initialPermissions)
			: buildState(permissionTree);

	const permissions: Writable<any> = writable(deepClone(mergedInitialPermissions));

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
		permissions: structuredClone(mergedInitialPermissions)
	};

	//-- Consolidate change detection: combine `permissions` and `roleName` stores --
	const nameStore = writable(roleName);
	$: nameStore.set(roleName);

	const combined = derived([permissions, nameStore], ([$permissions, $name]) => ({
		name: $name,
		permissions: structuredClone($permissions)
	}));

	const unsubscribe = combined.subscribe(({ name, permissions: perms }) => {
		enabledPermissionsCount = countEnabledPermissions(perms);
		if (
			JSON.stringify(perms) !== JSON.stringify(lastEmitted.permissions) ||
			name !== lastEmitted.name
		) {
			lastEmitted = { name, permissions: structuredClone(perms) };
			dispatch('change', { name, permissions: structuredClone(perms) });
		}
	});

	onDestroy(() => {
		unsubscribe();
	});

	//-- Submit role data --
	async function submit() {
		nameTouched = true;
		if (!nameIsValid) {
			//-- Wait for DOM to update so the error message is rendered,
			// then move focus to the input. This ensures users see the
			// validation message after attempting submit. --
			await tick();
			roleNameInput?.focus();
			return;
		}
		const snapshot = structuredClone(get(permissions));
		dispatch('save', { name: roleName.trim(), permissions: snapshot });
	}

	//-- Cancel role creation --
	function cancel() {
		dispatch('cancel');
	}

	//-- Reset permissions to initial state --
	function resetAll() {
		permissions.set(buildState(permissionTree));
	}
</script>

<div class="role-create container-fluid py-3">
	<div class="content-wrap mt-5 mx-auto">
		<div class="header mb-3 content-inset">
			<div class="title-row d-flex align-items-start justify-content-between">
				<div class="d-flex flex-column align-items-start gap-2">
					<HomeButton to={listingHref} icon="bi bi-arrow-left" ariaLabel="Back" />
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
				bind:this={roleNameInput}
				required
				bind:value={roleName}
				placeholder="Enter role name"
				on:blur={() => (nameTouched = true)}
				aria-required="true"
				aria-invalid={nameTouched && !nameIsValid}
				aria-describedby={ariaDescribedBy}
			/>
			{#if nameTouched && !nameIsValid}
				<div id={roleNameErrorId} class="invalid-feedback">{nameError}</div>
			{/if}
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
				{#if !hasDeletePermission}
					<span
						class="disabled-wrapper"
						title={disabledDeleteTooltip}
						tabindex="0"
						role="button"
						aria-disabled="true"
					>
						<button
							class="btn btn-outline-danger delete-role-btn disabled"
							aria-label="Delete"
							aria-disabled="true"
							disabled
							on:click={() => {
								/* no-op when disabled */
							}}
						>
							Delete Role
						</button>
					</span>
				{:else}
					<button
						class="btn btn-outline-danger delete-role-btn"
						aria-label="Delete"
						on:click={() => dispatch('delete', roleId ? { id: roleId } : {})}
					>
						Delete Role
					</button>
				{/if}
			{/if}
			{#if showSave || !isEditMode}
				<button class="btn cancel-btn" on:click={cancel} disabled={isSubmitting}>Cancel</button>
				<span
					class="disabled-wrapper"
					title={!hasUpdatePermission ? disabledUpdateTooltip : undefined}
					style={`display: inline-block; ${!hasUpdatePermission ? 'cursor: not-allowed;' : ''}`}
				>
					<button
						class="btn btn-primary"
						on:click={submit}
						disabled={isSubmitting || !hasUpdatePermission}
						aria-disabled={!hasUpdatePermission}
					>
						{#if isSubmitting}
							<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"
							></span>
							{isEditMode ? 'Saving...' : 'Creating...'}
						{:else}
							{isEditMode ? 'Save Changes' : 'Create Role'}
						{/if}
					</button>
				</span>
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

	.invalid-feedback {
		color: var(--error-color);
		font-size: 0.9rem;
		margin-top: 0.35rem;
		display: block;
	}

	.form-control:focus {
		background-color: var(--bg-card);
		border-color: var(--field-border);
		color: var(--text-primary);
	}
	.delete-role-btn.disabled,
	.delete-role-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.disabled-wrapper {
		display: inline-block;
		cursor: not-allowed;
	}
</style>
