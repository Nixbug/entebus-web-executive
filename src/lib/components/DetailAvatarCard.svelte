<script lang="ts">
	import type { DetailConfig } from '$lib/types/detail-config';
	export let avatar: DetailConfig['avatar'];
</script>

<div class="avatar-card">
	<div class="avatar" style="background: {avatar.color}">
		{avatar.initials}
	</div>

	<h2>
		{avatar.name}
		{#if avatar.isYou}
			<span class="you-chip">You</span>
		{/if}
	</h2>

	<p class="role">{avatar.designation}</p>

	{#if avatar.isActive}
		<span class="status active">
			<i class="bi bi-circle-fill status-dot"></i>
			Active
		</span>
	{:else}
		<span class="status inactive"> Inactive </span>
	{/if}
</div>

<style>
	.avatar-card {
		background: var(--detail-avatar-card);
		border-radius: 20px;
		padding: 32px 20px;
		text-align: center;
		box-shadow: 0 0 3px var(--field-border);
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
</style>
