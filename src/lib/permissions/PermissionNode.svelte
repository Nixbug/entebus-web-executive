<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import type { PermissionNodeData } from '$lib/permissions/permission-tree';
	import {
		toggleActionClone,
		toggleAllClone,
		countPermissions,
		getNodeState
	} from '$lib/permissions/permission-utils';

	// recursive import (allowed)
	import PermissionNode from './PermissionNode.svelte';

	export let node: PermissionNodeData;
	export let state: Writable<any>; // must be a writable store
	export let path: string[] = [];
    let isAll: boolean = false;
	let open = true;
	$: nextPath = [...path, node.id];

	// reactive snapshot from store
	// $state auto subscribes; any update to store re-evaluates below computations
	$: snapshot = $state; // Svelte store auto-subscribe

	// reactive nodeState for this node (object with booleans + nested children)
	$: nodeState = getNodeState(snapshot, nextPath) || {};

	// counts recompute on nodeState change
	$: counts = countPermissions(nodeState);

	// compute isAll from nodeState
	$: {
		const actionKeys = Object.keys(nodeState).filter((k) => typeof nodeState[k] === 'boolean');
		isAll = actionKeys.length > 0 && actionKeys.every((k) => nodeState[k] === true);
	}

	// handlers that use immutable clone helpers via state.update
	function onToggleAction(action: string) {
		state.update((s) => toggleActionClone(s, nextPath, action));
	}

	function onToggleAll() {
		state.update((s) => toggleAllClone(s, nextPath));
	}
</script>

<div class="perm-node card mb-3">
	<div class="card-body py-2 px-3" style="background-color: var(--bg-card);">
		<div class="d-flex align-items-center gap-2" style="background-color: var(--bg-card); color: var(--text-primary); border-radius:4px; padding:4px 8px; border-color: var(--border);">
			<!-- chevron -->
			<button
				class="btn p-0 border-0 toggle-btn"
				on:click={() => (open = !open)}
				aria-label="toggle"
			>
				<i class="bi" style="color: var(--text-primary);" class:bi-chevron-down={open} class:bi-chevron-right={!open}></i>
			</button>

			<div class="label-row flex-grow-1 min-w-0">
				<i class="bi bi-folder2-fill text-primary"></i>
				<div class="node-label text-truncate">{node.label}</div>
				<div class="count-badge">
					<div class="badge bg-light text-muted small rounded-pill">
						{counts.enabled}/{counts.total}
					</div>
				</div>
			</div>

			<div class="ms-auto d-flex align-items-center gap-2">
				<div class="me-2 small text-muted">All</div>
				<div class="form-check form-switch mb-0">
					<input
						class="form-check-input"
						type="checkbox"
						role="switch"
						checked={isAll}
						on:change={onToggleAll}
					/>
				</div>
			</div>
		</div>

		{#if open}
			<div class="perm-body mt-3" transition:slide>
				<div
					class="actions-row d-flex flex-wrap align-items-center gap-3 px-3 py-2 rounded"
					style="background:var(--bg-action-row,var(--bg-card)); border:1px solid var(--border);"
				>
					{#each node.actions as action}
						<label class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="color: var(--text-primary);">
							<input
								class="form-check-input"
								type="checkbox"
								role="switch"
								checked={nodeState[action]}
								on:change={() => onToggleAction(action)}
							/>
							<span class="small text-capitalize">{action}</span>
						</label>
					{/each}
				</div>

				{#if node.children?.length}
					<div class="children-list mt-3 ps-3" style="border-left:3px solid var(--border-accent, rgba(13,110,253,0.15));">
						{#each node.children as child (child.id)}
							<div
								class="child-item p-2 my-2 rounded"
								style="background-color: var(--bg-card); color: var(--text-primary); border:1px solid var(--border);"
							>
								<PermissionNode node={child} {state} path={nextPath} />
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.node-label {
		font-weight: 600;
	}

	.label-row {
		display: grid;
		grid-template-columns: auto 1fr 72px;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.count-badge {
		width: 72px;
		text-align: center;
	}

	.count-badge .badge {
		padding: 4px 8px;
		width: 100%;
	}
	.form-check-input {
		width: 36px;
		height: 20px;
	}
</style>
