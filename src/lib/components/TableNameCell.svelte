<script lang="ts">
	export let row: any;
</script>

<div class="d-flex align-items-center">
	<div class="avatar-circle text-white me-2" style="background-color: {row.color};">
		{row.initials}
	</div>
	<strong style="color: var(--text-primary);" >{row.name}</strong>
	{#if row.isYou}
		<span class="badge bg-primary text-white ms-2">You</span>
	{/if}
</div>

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
</style>
