<script lang="ts">
	import { onMount } from 'svelte';

	export let title = '';
	export let isEditing = false;
	export let onEdit = () => {};
	export let onDelete = () => {};
	export let onClose = () => {};
	export let actions: any = {};
	export let onBack = () => {};

	let isMobile = false;

	onMount(() => {
		isMobile = window.innerWidth <= 768;
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
				<button class="icon-btn edit" aria-label="Edit" on:click={onEdit}>
					<i class="bi bi-pencil"></i>
				</button>
			{/if}

			<!-- Delete Button (only if enabled in config) -->
			{#if actions?.delete !== false}
				<button class="icon-btn delete" aria-label="Delete" on:click={onDelete}>
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
		{#if isMobile === isEditing}
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
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: 0.2s ease-in-out;
		font-size: 18px;
	}

	.icon-btn.edit:hover {
		border-color: #0d6efd;
		color: #0d6efd;
		background: rgba(13, 110, 253, 0.1);
	}

	.icon-btn.delete:hover {
		border-color: #dc3545;
		color: #dc3545;
		background: rgba(220, 53, 69, 0.1);
	}

	.icon-btn.close:hover {
		border-color: #dc3545;
		color: #dc3545;
		background: rgba(220, 53, 69, 0.1);
	}
</style>
