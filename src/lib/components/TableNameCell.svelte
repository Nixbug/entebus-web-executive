<script lang="ts">
	import { getColorFromName } from '$lib/color-palette';
	import { getInitials } from '$lib/helpers';
	export let row: {
		name: string;
		initials?: string;
		isActive?: boolean;
		isYou?: boolean;
	};

	let initials = '';

	$: initials = getInitials(row.initials ?? null, row.name ?? null, '');
</script>

<div class="d-flex align-items-center">
	<div
		class="avatar-circle text-white me-2 position-relative"
		style="background-color: {getColorFromName(row.name)};"
	>
		{initials}

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
		min-width: 36px;
		min-height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
		line-height: 1;
		overflow: visible;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status-dot {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--status-dot-inactive);
		border: 1px solid #fff;
		z-index: 2;
	}

	.status-dot.active {
		background-color: var(--status-dot-active);
	}
</style>
