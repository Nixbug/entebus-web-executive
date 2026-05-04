<script lang="ts">
	import type { DetailConfig } from '$lib/types/detail-config';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	export let avatar:
		| (Partial<DetailConfig['avatar']> & { imageUrl?: string; imageLoading?: boolean })
		| null = null;
	export let editable: boolean = false;
	export let customActions: Array<{
		label: string;
		action: () => void;
		icon?: string;
		color?: string;
	}> = [];

	const dispatch = createEventDispatcher();

	let fileInput: HTMLInputElement | null = null;

	function onAvatarClick() {
		if (!editable) return;
		fileInput?.click();
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files && input.files[0];
		if (!f) return;
		dispatch('fileSelected', { file: f });
		input.value = '';
	}

	//-- Normalize status text for styling --
	let normalizedStatus: string | null = null;
	$: normalizedStatus = avatar?.statusText ? avatar.statusText.toLowerCase().trim() : null;
</script>

<div class="avatar-card">
	<div
		class="avatar"
		style="background: {avatar?.color}"
		on:click={onAvatarClick}
		role={editable ? 'button' : undefined}
	>
		{#if avatar?.imageLoading}
			<div class="loader"><span class="dot"></span></div>
		{:else if avatar?.imageUrl}
			<img src={avatar.imageUrl} alt={avatar?.name ?? ''} loading="lazy" decoding="async" />
		{:else if avatar?.icon}
			<i class={avatar.icon} aria-hidden="true"></i>
		{:else}
			{avatar?.initials}
		{/if}

		{#if editable}
			<button
				type="button"
				class="edit-pulse"
				aria-label="Upload image"
				on:click|stopPropagation={onAvatarClick}
			>
				<i class="bi bi-pencil"></i>
			</button>
		{/if}
	</div>

	{#if editable}
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			on:change={onFileChange}
			style="display:none"
		/>
	{/if}

	<h2 class="mt-3">
		{avatar?.name}
		{#if avatar?.isYou}
			<span class="you-chip">You</span>
		{/if}
	</h2>

	{#if avatar?.registrationNumber}
		<h2 class="registration-number">{avatar.registrationNumber}</h2>
	{/if}

	<p class="role">{avatar?.designation}</p>

	{#if avatar?.isActive}
		<span class="status active">
			<i class="bi bi-circle-fill status-dot"></i>
			Active
		</span>
	{/if}
	{#if avatar?.isActive === false}
		<span class="status inactive">{avatar?.statusText ?? 'Suspended'}</span>
	{/if}

	{#if avatar?.statusText}
		{#if normalizedStatus === 'verified'}
			<span class="status status-verified mt-1">
				<i class="bi bi-check-circle-fill status-icon"></i>
				Verified
			</span>
		{:else if normalizedStatus === 'suspended'}
			<span class="status status-suspended mt-1">
				<i class="bi bi-exclamation-triangle-fill status-icon"></i>
				Suspended
			</span>
		{:else if normalizedStatus === 'under verification'}
			<span class="status status-validating mt-1">
				<i class="bi bi-hourglass-split status-icon"></i>
				Under Verification
			</span>
		{/if}
	{/if}
	{#if avatar?.dashboardLink}
		<button
			class="dashboard-btn mt-3"
			on:click={() => avatar?.dashboardLink && goto(avatar.dashboardLink)}
			aria-label="Open company dashboard"
			title="Open company dashboard"
		>
			View Company Dashboard
		</button>
	{/if}

	{#each customActions as action}
		<button
			class="custom-action-btn mt-2"
			on:click={action.action}
			aria-label={action.label}
			title={action.label}
		>
			{#if action.icon}
				<i class={action.icon}></i>
			{/if}
			{action.label}
		</button>
	{/each}
</div>

<!-- Styles -->
<style>
	.avatar-card {
		background: var(--detail-avatar-card);
		border-radius: 20px;
		padding: 32px 20px;
		text-align: center;
		box-shadow: 0 0 3px var(--field-border);
		position: relative;
	}
	.avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 26px;
		color: #fff;
		margin: 0 auto;
		border: 5px solid var(--field-border);
		position: relative;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		display: block;
	}

	.avatar .loader {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
	}

	.avatar .dot {
		width: 28px;
		height: 28px;
		border: 3px solid rgba(255, 255, 255, 0.4);
		border-top-color: rgba(255, 255, 255, 0.95);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.avatar i {
		font-size: 38px;
		line-height: 1;
	}
	h2 {
		color: var(--text-primary);
		font-weight: 700;
		font-size: 20px;
	}
	.you-chip {
		background: linear-gradient(90deg, #3b82f6, #6366f1);
		color: #fff;
		font-size: 0.7rem;
		padding: 3px 10px;
		border-radius: 12px;
		vertical-align: middle;
	}

	p {
		color: var(--text-muted);
	}
	.registration-number {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 14px;
		height: 30px;
		border-radius: 30px;
		font-size: 0.75rem;
		font-weight: 500;
		margin-top: 12px;
	}

	.status.active {
		background: var(--online-bg);
		color: var(--online-fg);
		border: var(--status-dot-active) 1.5px solid;
	}

	.status-dot {
		font-size: 0.625rem;
		color: var(--status-dot-active);
	}

	.status.inactive {
		background: #999;
		color: #fff;
		border: 1.5px solid #666;
	}

	.status-verified {
		background: var(--active-filter-chip-bg);
		color: var(--status-dot-active);
		border: 1.5px solid var(--status-dot-active);
	}

	.status-suspended {
		background: var(--clear-btn-bg);
		color: var(--delete-btn);
		border: 1.5px solid var(--delete-btn);
	}

	.status-validating {
		background: rgba(245, 158, 11, 0.15);
		color: var(--warning-color);
		border: 1.5px solid var(--warning-color);
	}

	.status-icon {
		font-size: 0.9rem;
	}
	.status-text {
		margin-top: 8px;
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.dashboard-btn {
		position: static;
		width: 100%;
		padding: 10px 14px;
		border-radius: 12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		transition:
			box-shadow 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
		cursor: pointer;
	}

	.dashboard-btn:hover {
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
		border-color: var(--home-button-bg);
	}

	.custom-action-btn {
		position: static;
		width: 100%;
		padding: 10px 14px;
		border-radius: 12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		transition:
			box-shadow 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.95rem;
	}

	.custom-action-btn:hover {
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
		border-color: var(--home-button-bg);
	}

	.custom-action-btn i {
		font-size: 1rem;
	}

	.edit-pulse {
		position: absolute;
		right: -8px;
		bottom: -8px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.45);
		color: white;
		border: 2px solid var(--bg-primary);
		cursor: pointer;
		backdrop-filter: blur(4px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		z-index: 3;
	}

	.edit-pulse i {
		font-size: 14px;
	}
</style>
