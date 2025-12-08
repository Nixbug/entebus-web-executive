<script lang="ts">
	export let row: {
		name: string;
		initials: string;
		color: string;
		isActive?: boolean;
		isYou?: boolean;
	};
</script>

<div class="d-flex align-items-center">
	<div
		class="avatar-circle text-white me-2 position-relative"
		style="background-color: {row.color};"
	>
		{row.initials}

		<span
			class="status-dot"
			class:active={row.isActive}
			title={row.isActive ? 'Active' : 'Inactive'}
		></span>
	</div>

	<strong style="color: var(--text-primary);">{row.name}</strong>

	{#if row.isYou}
		<span class="badge bg-primary text-white ms-2">You</span>
	{/if}
</div>

<!-- Styles -->
<style>
	.avatar-circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: #94a3b8;
		border: 1px solid #fff;
	}

	.status-dot.active {
		background-color: var(--status-dot-active);
	}
</style>
