<script lang="ts">
	export let message: string = 'No data available';
	export let subtitle: string = 'Try adjusting your search or filters';
	export let showSubtitle: boolean = true;
</script>

<div
	class="card d-flex flex-column align-items-center justify-content-center py-5 gap-2"
	style="background-color: var(--bg-card);"
>
	<div
		class="d-flex align-items-center justify-content-center rounded-circle"
		style="width:70px; height:70px; background:rgba(255,255,255,0.05);"
	>
		<i class="bi bi-search fs-2" style="color:var(--text-muted);"></i>
	</div>

	<h5 class="m-0 fw-inter-700" style="color:var(--text-muted);">{message}</h5>
	{#if showSubtitle}
		<p class="m-0 small" style="color:var(--text-muted);">{subtitle}</p>
	{/if}
</div>
