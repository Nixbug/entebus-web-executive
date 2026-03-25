<script lang="ts">
	import type { DetailConfig } from '$lib/types/detail-config';
	import { goto } from '$app/navigation';
	export let avatar: DetailConfig['avatar'];

	//-- Normalize status text for styling --
	let normalizedStatus: string | null = null;
	$: normalizedStatus = avatar?.statusText ? avatar.statusText.toLowerCase().trim() : null;
</script>

<div class="avatar-card">
	<div class="avatar" style="background: {avatar?.color}">
		{#if avatar?.icon}
			<i class={avatar.icon} aria-hidden="true"></i>
		{:else}
			{avatar?.initials}
		{/if}
	</div>

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
		<span class="status inactive">{avatar?.statusText ?? 'Inactive'}</span>
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
		{:else if normalizedStatus === 'validating' || normalizedStatus === 'verifying'}
			<span class="status status-validating mt-1">
				<i class="bi bi-hourglass-split status-icon"></i>
				Validating
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
		width: 90px;
		height: 90px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 26px;
		color: #fff;
		margin: 0 auto;
		border: 5px solid var(--field-border);
	}

	.avatar i {
		font-size: 28px;
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
</style>
