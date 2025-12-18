<script lang="ts">
	import type { Writable } from 'svelte/store';
	import type { PermissionNodeData } from '$lib/permissions/permission-tree';
	import {
		getNodeState,
		toggleActionClone,
		toggleAllClone,
		countPermissions
	} from '$lib/permissions/permission-utils';
	import PermissionNode from './PermissionNode.svelte';
	import { createEventDispatcher } from 'svelte';

	export let node: PermissionNodeData;
	export let state: Writable<any>;
	export let path: string[] = [];
	export let enabledPermissionsCount: number;
	export let readonly: boolean = false;

	let open = false;
	let isAll = false;

	// Accordion control wiring
	const dispatch = createEventDispatcher<{ 'toggle-open': { id: string; open: boolean } }>();
	// Whether this node participates in parent's accordion control (children set this to true)
	export let accordion: boolean = false;
	// When acting as a child, this determines if we are forced open
	export let controlledOpenId: string | null = null;
	// When acting as a parent, track which child is open (mobile only)
	let openChildId: string | null = null;

	$: nextPath = [...path, node.id];
	$: snapshot = $state;
	$: nodeState = getNodeState(snapshot, nextPath) ?? {};
	$: counts = countPermissions(nodeState);

	// Determine effective open state (controlled when in accordion mode)
	let effectiveOpen: boolean;
	$: effectiveOpen = accordion ? controlledOpenId === node.id : open;

	$: {
		const keys = Object.keys(nodeState).filter((k) => typeof nodeState[k] === 'boolean');
		isAll = keys.length > 0 && keys.every((k) => nodeState[k]);
	}

	function handleToggleAction(action: string) {
		if (readonly) return;
		state.update((s) => toggleActionClone(s, nextPath, action));
	}

	function handleToggleAll() {
		if (readonly) return;
		state.update((s) => toggleAllClone(s, nextPath));
	}

	function toggleSelfOpen() {
		const next = accordion ? controlledOpenId !== node.id : !open;
		if (!accordion) {
			open = next;
		}
		dispatch('toggle-open', { id: node.id, open: next });
	}
</script>

<div class="perm-node" class:nested={accordion}>
	<!-- HEADER -->
	<div
		class="perm-header mb-2"
		role="button"
		tabindex="0"
		on:click={toggleSelfOpen}
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSelfOpen()}
	>
		<button class="chevron" aria-label="Toggle Permissions">
			<i class="bi" class:bi-chevron-down={effectiveOpen} class:bi-chevron-right={!effectiveOpen}
			></i>
		</button>
		<span class="title">{node.label}</span>

		<!-- Two-tone capsule count -->
		<div
			class="count-pill"
			aria-label={`${counts.enabled} of ${counts.total} enabled`}
			role="status"
		>
			<span class="count-left">{counts.enabled}</span>
			<span class="count-right">{counts.total}</span>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="all-toggle desktop" on:click|stopPropagation on:mousedown|stopPropagation>
			<span>All</span>
			<label class="form-check form-switch m-0">
				<input
					class="form-check-input"
					type="checkbox"
					checked={isAll}
					on:change={handleToggleAll}
					disabled={readonly}
					aria-disabled={readonly}
					on:click|stopPropagation
				/>
			</label>
		</div>
	</div>

	{#if effectiveOpen}
		<!-- ACTION ROW -->
		<div class="action-row">
			<!-- Mobile-only Select All inside the card (top-right) -->
			<div class="all-toggle mobile">
				
				<label class="form-check form-switch m-0">
					<input
						class="form-check-input"
						type="checkbox"
						checked={isAll}
						on:change={handleToggleAll}
						disabled={readonly}
						aria-disabled={readonly}
					/>
				</label><span>All</span>
			</div>
			<div class="actions-grid">
				{#each node.actions as action}
					<label class="form-check form-switch action-item">
						<input
							class="form-check-input"
							type="checkbox"
							checked={nodeState[action]}
							on:change={() => handleToggleAction(action)}
							disabled={readonly}
							aria-disabled={readonly}
						/>
						<span class="action-label">{action}</span>
					</label>
				{/each}
			</div>
		</div>

		{#if node.children?.length}
			<div class="children">
				{#each node.children as child}
					<PermissionNode
						node={child}
						{state}
						path={nextPath}
						{enabledPermissionsCount}
						{readonly}
						accordion={true}
						controlledOpenId={openChildId}
						on:toggle-open={(e) => {
							openChildId = e.detail.open ? e.detail.id : null;
						}}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.perm-node {
		padding: 6px 0;
	}

	.perm-header {
		display: grid;
		grid-template-columns: auto 1fr 64px auto;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		background: var(--bg-card);
		border-radius: 8px;
		border: 1px solid var(--border);
		cursor: pointer;
	}

	.chevron {
		color: var(--color-primary);
		border: none;
		background: none;
		padding: 2px;
		cursor: pointer;
	}

	.title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count-pill {
		display: inline-flex;
		align-items: center;
		border-radius: 9999px;
		overflow: hidden;
		border: 1px solid var(--border);
		font-size: 12px;
		line-height: 1;
		justify-self: center;
		background: var(--bg-card);
		width: 62px;
	}

	.count-pill .count-left {
		flex: 0 0 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 3px 0;
		background: var(--icon-hover-bg);
		color: var(--color-primary);
	}

	.count-pill .count-right {
		flex: 0 0 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 3px 0;
		background: transparent;
		color: var(--text-muted);
		border-left: 1px solid var(--border);
	}

	.all-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 4px 8px;
		font-size: 14px;
		color: var(--text-primary);
		border-radius: 6px;
	}

	/* Visibility defaults */
	.all-toggle.desktop {
		display: flex;
	}
	.all-toggle.mobile {
		display: none;
	}

	.all-toggle .form-check-input {
		transform: scale(1.2);
		transform-origin: center;
		cursor: pointer;
	}

	.all-toggle span {
		font-weight: 500;
	}

	.action-row {
		display: block;
		margin-left: 32px;
		padding: 10px;
		background: var(--bg-card);
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	/* Default layout for actions (desktop/tablet): flex wrap */
	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.action-label {
		text-transform: capitalize;
		font-size: 13px;
	}

	.children {
		border-left: 2px solid rgba(0, 123, 255, 0.25);
		margin-left: 28px;
		padding-left: 12px;
		margin-top: 12px;
	}

	/* Mobile layout: move Select All inside action row */
	@media (max-width: 768px) {
		/* Hide header 'All' on mobile */
		.all-toggle.desktop {
			display: none;
		}

		/* Show 'All' inside action row on mobile */
		.all-toggle.mobile {
			display: inline-flex;
			position: absolute;
			top: 8px;
			left: 5px;
			z-index: 1;
		}

		/* Tighten action row spacing on mobile and add horizontal padding */
		.action-row {
			position: relative;
			margin-left: 16px;
			padding-top: 40px; /* room for top-right 'All' */
			padding-left: 16px;
			padding-right: 16px; /* prevent switches/labels touching right border */
		}

		/* Two actions per row on mobile */
		.actions-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px;
		}

		/* Make count pill a bit smaller */
		.count-pill {
			width: 56px;
		}

		/* Reduce ONLY the 'All' switch size on mobile */
		.all-toggle .form-check-input {
			transform: scale(1.0);
		}
	}
</style>
