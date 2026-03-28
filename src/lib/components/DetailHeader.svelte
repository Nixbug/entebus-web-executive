<script lang="ts">
	import { onMount } from 'svelte';
	import { MOBILE_BREAKPOINT } from '$lib/constants';
	import type { DetailConfig } from '$lib/types/detail-config';
	export let title = '';
	export let isEditing = false;
	export let onEdit = () => {};
	export let onDelete = () => {};
	export let onClose = () => {};
	export let actions: DetailConfig['actions'] | undefined = undefined;
	export let onBack = () => {};
	export let hasDeletePermission = true;
	export let hasUpdatePermission = true;
	export let disabledDeleteTooltip = 'You do not have permission to delete this item.';
	export let disabledUpdateTooltip = 'You do not have permission to update this item.';

	let isMobile = false;

	//-- Keep isMobile in sync on resize --
	onMount(() => {
		const checkIsMobile = () => {
			isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
		};
		//-- Initial check --
		checkIsMobile();
		//-- Listen for viewport changes --
		window.addEventListener('resize', checkIsMobile);
		//-- Cleanup on destroy --
		return () => {
			window.removeEventListener('resize', checkIsMobile);
		};
	});
</script>

<header class="header">
	<!-- Mobile Back Button -->
	{#if isMobile}
		<button class="icon-btn back" aria-label="Go back" on:click={onBack}>
			<i class="bi bi-arrow-left"></i>
		</button>
	{/if}

	<!-- Title – always centered vertically -->
	<h5 class="title fw-inter-700 fs-6">{title}</h5>

	<!-- Right actions -->
	<div class="actions d-flex gap-2">
		{#if !isEditing}
			<!-- Edit Button (only if enabled in config) -->
			{#if actions?.edit !== false}
				<button
					class="icon-btn edit"
					class:disabled={!hasUpdatePermission}
					aria-label="Edit"
					aria-disabled={!hasUpdatePermission}
					title={!hasUpdatePermission ? disabledUpdateTooltip : undefined}
					tabindex={!hasUpdatePermission ? -1 : undefined}
					on:click={() => hasUpdatePermission && onEdit()}
				>
					<i class="bi bi-pencil"></i>
				</button>
			{/if}

			<!-- Delete Button (only if enabled in config) -->
			{#if actions?.delete !== false}
				<button
					class="icon-btn delete"
					class:disabled={!hasDeletePermission}
					aria-label="Delete"
					aria-disabled={!hasDeletePermission}
					title={!hasDeletePermission ? disabledDeleteTooltip : undefined}
					tabindex={!hasDeletePermission ? -1 : undefined}
					on:click={() => hasDeletePermission && onDelete()}
				>
					<i class="bi bi-trash"></i>
				</button>
			{/if}

			<!-- Custom Actions -->
			{#if actions?.custom}
				{#each actions.custom as action}
					<button
						class="icon-btn"
						aria-label={action.label}
						on:click={action.action}
						style="border-color: {action.color || 'var(--border)'}; color: {action.color ||
							'var(--text-primary)'}"
					>
						<i class={action.icon}></i>
					</button>
				{/each}
			{/if}
		{/if}
		{#if !isMobile || isEditing}
			<!-- Show close icon -->
			<button class="icon-btn close" aria-label="Close" on:click={onClose}>
				<i class="bi bi-x-lg"></i>
			</button>
		{/if}
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
		border-bottom: 1px solid var(--border);
		padding: 14px 18px;
	}
	.title {
		color: var(--text-primary);
		margin: 0;
	}
	.icon-btn {
		width: 38px;
		height: 38px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: 0.2s ease-in-out;
		font-size: 18px;
	}

	.icon-btn.edit:hover {
		border-color: var(--edit-btn);
		color: var(--edit-btn);
		background: var(--clear-btn-bg);
	}

	.icon-btn.delete:not(.disabled):hover {
		border-color: var(--delete-btn);
		color: var(--delete-btn);
		background: var(--clear-btn-bg);
	}

	.icon-btn.delete.disabled,
	.icon-btn.edit.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		border-color: var(--border) !important;
		color: var(--text-muted) !important;
		background: var(--bg-card) !important;
	}

	.icon-btn.close:hover {
		border-color: var(--delete-btn);
		color: var(--delete-btn);
		background: var(--clear-btn-bg);
	}
</style>
